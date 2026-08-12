import {
  Controller,
  Post,
  Body,
  Get,
  Query,
  Param,
  Patch,
  Delete,
  UseInterceptors,
  BadRequestException,
  ParseUUIDPipe,
  UploadedFile,
} from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { NameService } from './name.service';
import { CurrentUser } from 'src/auth/current-user.decorator';
import type { JwtUser } from 'src/auth/current-user.decorator';
import { CreateNameEntryDto } from './dto/create-name-entry.dto';
import { QueryNameEntryDto } from './dto/query-name-entry.dto';
import { HistoryQueryDto } from './dto/history-query.dto';
import { UpdateNameEntryDto } from './dto/update-name-entry.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import 'multer';

@ApiTags('me/name')
@ApiBearerAuth('bearer')
@Controller('me/name')
export class NameController {
  constructor(private readonly nameService: NameService) {}

  @Post()
  create(@CurrentUser() user: JwtUser, @Body() dto: CreateNameEntryDto) {
    return this.nameService.create(user.sub, dto);
  }

  @Get()
  findAll(@CurrentUser() user: JwtUser, @Query() query: QueryNameEntryDto) {
    return this.nameService.query(user.sub, query.context);
  }

  @Get('history')
  queryHistory(@CurrentUser() user: JwtUser, @Query() query: HistoryQueryDto) {
    return this.nameService.queryHistory(user.sub, query);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: JwtUser,
    @Param('id') id: string,
    @Body() dto: UpdateNameEntryDto,
  ) {
    return this.nameService.update(user.sub, id, dto);
  }

  @Post(':nameId/audio')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file'],
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 1024 * 1024 * 5 }, // 5MB
    }),
  )
  uploadAudio(
    @CurrentUser() user: JwtUser,
    @Param('nameId', ParseUUIDPipe) nameId: string,
    @UploadedFile() file: Express.Multer.File | undefined,
  ) {
    if (!file) {
      throw new BadRequestException('Audio file is required');
    }
    const allowedMimeTypes = [
      'audio/mpeg',
      'audio/mp3',
      'audio/mp4',
      'audio/wav',
      'audio/webm',
      'audio/ogg',
    ];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(`Invalid file type: ${file.mimetype}`);
    }
    return this.nameService.uploadAudio(user.sub, nameId, file);
  }

  @Delete(':nameId/audio')
  removeAudio(
    @CurrentUser() user: JwtUser,
    @Param('nameId', ParseUUIDPipe) nameId: string,
  ) {
    return this.nameService.removeAudio(user.sub, nameId);
  }

  @Delete(':id')
  remove(
    @CurrentUser() user: JwtUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.nameService.remove(user.sub, id);
  }
}
