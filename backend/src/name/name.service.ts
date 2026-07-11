import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateNameEntryDto } from './dto/create-name-entry.dto';
import { HistoryQueryDto } from './dto/history-query.dto';
import type { Context } from '../../generated/prisma/client';

@Injectable()
export class NameService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateNameEntryDto) {
    // Get context and throw error if not found
    const context = await this.validateContext(dto.context);

    // Create name entry
    return this.prisma.nameEntry.create({
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
        audio_url: true,
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
  }

  async query(userId: string, contextKey?: string) {
    // Validate context key if provided
    let context: Context | null = null;
    if (contextKey) {
      context = await this.validateContext(contextKey);
    }

    // Search for name entries
    return this.prisma.nameEntry.findMany({
      where: {
        user_id: userId,
        deleted_at: null,
        ...(context && { context_id: context.id }),
      },
      select: {
        id: true,
        value: true,
        charset: true,
        audio_url: true,
        context: {
          select: {
            name: true,
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
    const [data, total] = await Promise.all([
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
          audio_url: true,
          deleted_at: true,
          context: { select: { name: true, description: true } },
        },
      }),
      this.prisma.nameEntry.count({ where }),
    ]);

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
}
