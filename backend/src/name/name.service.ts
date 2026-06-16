import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateNameEntryDto } from './dto/create-name-entry.dto';

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
}
