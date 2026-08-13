import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateNameEntryDto } from './dto/create-name-entry.dto';
import { HistoryQueryDto } from './dto/history-query.dto';
import type { Context } from '../../generated/prisma/client';
import { UpdateNameEntryDto } from './dto/update-name-entry.dto';
import { TransactionClient } from 'generated/prisma/internal/prismaNamespace';
import { StorageService } from 'src/storage/storage.service';

const MAX_SOFT_DELETED_NAME_ENTRIES = 50;

const MIME_TO_EXT: Record<string, string> = {
  'audio/mpeg': 'mp3',
  'audio/mp3': 'mp3',
  'audio/mp4': 'm4a',
  'audio/wav': 'wav',
  'audio/webm': 'webm',
};

@Injectable()
export class NameService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
  ) {}

  async create(userId: string, dto: CreateNameEntryDto) {
    // Get context and throw error if not found
    const context = await this.validateContext(dto.context);

    // Create name entry
    const created = await this.prisma.nameEntry.create({
      data: {
        user_id: userId,
        context_id: context.id,
        value: dto.value,
        charset: dto.charset,
      },
      select: {
        id: true,
        value: true,
        charset: true,
        audio_key: true,
        context: {
          select: {
            name: true,
            key: true,
            description: true,
          },
        },
        user: {
          select: {
            email: true,
          },
        },
      },
    });

    return this.addAudioUrl(created);
  }

  async query(userId: string, contextKey?: string, includeEmail = true) {
    // Validate context key if provided
    let context: Context | null = null;
    if (contextKey) {
      context = await this.validateContext(contextKey);
    }

    // Search for name entries
    const entries = await this.prisma.nameEntry.findMany({
      where: {
        user_id: userId,
        deleted_at: null,
        ...(context && { context_id: context.id }),
      },
      select: {
        id: true,
        value: true,
        charset: true,
        audio_key: true,
        context: {
          select: {
            name: true,
            description: true,
          },
        },
        ...(includeEmail && {
          user: {
            select: {
              email: true,
            },
          },
        }),
      },
    });

    return this.addAudioUrls(entries);
  }

  async queryByUser(userId: string, contextKey?: string) {
    // Validate the target user exists
    await this.validateUser(userId);

    // Delegate to query without exposing the target user's email
    return this.query(userId, contextKey, false);
  }

  async queryByEmail(email: string, contextKey?: string) {
    const user = await this.prisma.user.findFirst({
      where: { email: { equals: email.toLowerCase(), mode: 'insensitive' } },
      select: { id: true },
    });
    if (!user) {
      throw new NotFoundException(`User with email '${email}' not found`);
    }

    return this.query(user.id, contextKey, false);
  }

  async update(userId: string, id: string, dto: UpdateNameEntryDto) {
    // Validate that at least one field is provided
    if (
      dto.context === undefined &&
      dto.charset === undefined &&
      dto.value === undefined
    ) {
      throw new BadRequestException(
        'At least one field is required to update a name entry',
      );
    }

    // Get name entry and throw error if not found
    const nameEntry = await this.prisma.nameEntry.findUnique({
      where: { id, user_id: userId, deleted_at: null },
      select: {
        id: true,
        value: true,
        charset: true,
        audio_key: true,
        context_id: true,
      },
    });
    if (!nameEntry) {
      throw new NotFoundException(
        `Name entry with id '${id}' not found for user '${userId}'`,
      );
    }

    // Validate context if provided
    let context: Context | null = null;
    if (dto.context) {
      context = await this.validateContext(dto.context);
    }

    // Soft delete the old entry and create a new one carrying over inherited fields
    return this.replaceNameEntry(userId, id, {
      value: dto.value ?? nameEntry.value,
      charset: dto.charset ?? nameEntry.charset,
      audio_key: nameEntry.audio_key,
      context_id: context?.id ?? nameEntry.context_id,
    });
  }

  async queryHistory(userId: string, query: HistoryQueryDto) {
    // Default page and limit
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    // Validate context key if provided
    let context: Context | null = null;
    if (query.context) {
      context = await this.validateContext(query.context);
    }

    // Formulate where clause for user id, deleted and context
    const where = {
      user_id: userId,
      deleted_at: { not: null },
      ...(context && { context_id: context.id }),
    };

    // Get paginated history
    const [entries, total] = await Promise.all([
      this.prisma.nameEntry.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: {
          deleted_at: 'desc',
        },
        select: {
          id: true,
          value: true,
          charset: true,
          audio_key: true,
          created_at: true,
          deleted_at: true,
          context: { select: { name: true, description: true } },
        },
      }),
      this.prisma.nameEntry.count({ where }),
    ]);

    const data = await this.addAudioUrls(entries);
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getAllContexts() {
    return this.prisma.context.findMany({
      select: {
        name: true,
        key: true,
        description: true,
      },
      orderBy: { name: 'asc' },
    });
  }

  private async validateContext(contextKey: string) {
    const context = await this.prisma.context.findUnique({
      where: { key: contextKey },
    });
    if (!context) {
      throw new NotFoundException(`'${contextKey}' is not a valid context`);
    }

    return context;
  }

  private async validateUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });
    if (!user) {
      throw new NotFoundException(`User with id '${userId}' not found`);
    }
  }

  private async enforceMaxSoftDeletedNameEntries(
    userId: string,
    tx: TransactionClient,
  ): Promise<string[]> {
    const count = await tx.nameEntry.count({
      where: { user_id: userId, deleted_at: { not: null } },
    });

    // No cleanup needed if under the limit
    if (count < MAX_SOFT_DELETED_NAME_ENTRIES) return [];

    // Calculate the number of entries to remove
    const exceededCount = count - MAX_SOFT_DELETED_NAME_ENTRIES + 1;

    // Get the oldest exceeded entries
    const exceededEntries = await tx.nameEntry.findMany({
      where: { user_id: userId, deleted_at: { not: null } },
      orderBy: { deleted_at: 'asc' },
      take: exceededCount,
      select: { id: true, audio_key: true },
    });

    await tx.nameEntry.deleteMany({
      where: { id: { in: exceededEntries.map((entry) => entry.id) } },
    });

    // Return the audio keys of the exceeded entries for future cleanup
    return exceededEntries
      .map((entry) => entry.audio_key)
      .filter((key): key is string => key != null);
  }

  private async replaceNameEntry(
    userId: string,
    oldId: string,
    data: {
      value: string | null;
      charset: string;
      audio_key: string | null;
      context_id: string;
    },
  ) {
    const { result, orphanedAudioKeys } = await this.prisma.$transaction(
      async (tx) => {
        // Enforce max soft deleted name entries
        const orphanedAudioKeys = await this.enforceMaxSoftDeletedNameEntries(
          userId,
          tx,
        );

        // Soft delete old name entry
        await tx.nameEntry.update({
          where: { id: oldId },
          data: { deleted_at: new Date() },
        });

        // Create the replacement entry
        const created = await tx.nameEntry.create({
          data: { user_id: userId, ...data },
          select: {
            id: true,
            value: true,
            charset: true,
            audio_key: true,
            context: { select: { name: true, key: true, description: true } },
          },
        });

        const result = await this.addAudioUrl(created);
        return { result, orphanedAudioKeys };
      },
    );

    // Cleanup orphaned R2 objects after the DB tx commits
    await this.cleanupOrphanedAudios(orphanedAudioKeys);

    return result;
  }

  private async cleanupOrphanedAudios(audioKeys: string[]): Promise<void> {
    // Dedupe to avoid checking the same key twice
    const uniqueKeys = [...new Set(audioKeys)];

    await Promise.all(
      uniqueKeys.map(async (key) => {
        // Only delete from R2 if no entry references it
        const remainingRefs = await this.prisma.nameEntry.count({
          where: { audio_key: key },
        });

        // If there are remaining references, do not delete
        if (remainingRefs > 0) return;

        // Delete from R2
        await this.storageService.delete(key);
      }),
    );
  }

  async uploadAudio(userId: string, nameId: string, file: Express.Multer.File) {
    // Get name entry and throw error if not found
    const nameEntry = await this.prisma.nameEntry.findUnique({
      where: { id: nameId, user_id: userId, deleted_at: null },
      select: {
        id: true,
        value: true,
        charset: true,
        audio_key: true,
        context_id: true,
      },
    });
    if (!nameEntry) {
      throw new NotFoundException(
        `Name entry with id '${nameId}' not found for user '${userId}'`,
      );
    }

    // Upload the new audio to R2 before touching the DB
    const extension = MIME_TO_EXT[file.mimetype] ?? 'bin';
    const newAudioKey = `audio/${userId}/${nameId}/${randomUUID()}.${extension}`;
    await this.storageService.upload(newAudioKey, file.buffer, file.mimetype);

    // Soft delete the old entry and create a new one with the new audio_key
    return this.replaceNameEntry(userId, nameId, {
      value: nameEntry.value,
      charset: nameEntry.charset,
      audio_key: newAudioKey,
      context_id: nameEntry.context_id,
    });
  }

  async removeAudio(userId: string, nameId: string) {
    // Get name entry and throw error if not found
    const nameEntry = await this.prisma.nameEntry.findUnique({
      where: { id: nameId, user_id: userId, deleted_at: null },
      select: {
        id: true,
        value: true,
        charset: true,
        audio_key: true,
        context_id: true,
        context: { select: { name: true, key: true, description: true } },
      },
    });
    if (!nameEntry) {
      throw new NotFoundException(
        `Name entry with id '${nameId}' not found for user '${userId}'`,
      );
    }

    // If there is no audio to remove, return the entry as it is
    if (nameEntry.audio_key === null) {
      return this.addAudioUrl({
        id: nameEntry.id,
        value: nameEntry.value,
        charset: nameEntry.charset,
        audio_key: nameEntry.audio_key,
        context: nameEntry.context,
      });
    }

    // Soft delete the old entry and create a new one with audio_key null
    return this.replaceNameEntry(userId, nameId, {
      value: nameEntry.value,
      charset: nameEntry.charset,
      audio_key: null,
      context_id: nameEntry.context_id,
    });
  }

  async remove(userId: string, id: string) {
    const nameEntry = await this.prisma.nameEntry.findUnique({
      where: { id, user_id: userId, deleted_at: null },
      select: { id: true },
    });

    // Throw error if the entry does not exist
    if (!nameEntry) {
      throw new NotFoundException(
        `Name entry with id '${id}' not found for user '${userId}'`,
      );
    }

    // Soft delete the entry and get the orphaned audio keys
    const orphanedAudioKeys = await this.prisma.$transaction(async (tx) => {
      const orphanedAudioKeys = await this.enforceMaxSoftDeletedNameEntries(
        userId,
        tx,
      );

      await tx.nameEntry.update({
        where: { id },
        data: { deleted_at: new Date() },
      });

      return orphanedAudioKeys;
    });

    // Cleanup orphaned R2 objects after the DB tx commits
    await this.cleanupOrphanedAudios(orphanedAudioKeys);
  }

  private async addAudioUrl<T extends { audio_key: string | null }>(
    entry: T,
  ): Promise<T & { audio_url: string | null }> {
    return {
      ...entry,
      audio_url: entry.audio_key
        ? await this.storageService.getSignedUrl(entry.audio_key)
        : null,
    };
  }

  private addAudioUrls<T extends { audio_key: string | null }>(
    entries: T[],
  ): Promise<Array<T & { audio_url: string | null }>> {
    return Promise.all(entries.map((entry) => this.addAudioUrl(entry)));
  }
}
