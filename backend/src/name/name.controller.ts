import {
  Controller,
  Post,
  Body,
  Get,
  Query,
  Param,
  Patch,
} from '@nestjs/common';
import { NameService } from './name.service';
import { CurrentUser } from 'src/auth/current-user.decorator';
import type { JwtUser } from 'src/auth/current-user.decorator';
import { CreateNameEntryDto } from './dto/create-name-entry.dto';
import { QueryNameEntryDto } from './dto/query-name-entry.dto';
import { HistoryQueryDto } from './dto/history-query.dto';
import { UpdateNameEntryDto } from './dto/update-name-entry.dto';

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
}
