import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateNameEntryDto } from './dto/create-name-entry.dto';
import type { Context } from '../../generated/prisma/client';

@Injectable()
export class NameService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateNameEntryDto) {
    // Get context and throw error if not found
    const context = await this.prisma.context.findUnique({
      where: { key: dto.context },
    });
    if (!context) {
      throw new NotFoundException(`'${dto.context}' is not a valid context`);
    }

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
      context = await this.prisma.context.findUnique({
        where: { key: contextKey },
      });
      if (!context) {
        throw new NotFoundException(`'${contextKey}' is not a valid context`);
      }
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
}
