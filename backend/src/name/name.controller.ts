import { Controller, Post, Body } from '@nestjs/common';
import { NameService } from './name.service';
import { CurrentUser } from 'src/auth/current-user.decorator';
import type { JwtUser } from 'src/auth/current-user.decorator';
import { CreateNameEntryDto } from './dto/create-name-entry.dto';

@Controller('me/name')
export class NameController {
  constructor(private readonly nameService: NameService) {}

  @Post()
  create(@CurrentUser() user: JwtUser, @Body() dto: CreateNameEntryDto) {
    return this.nameService.create(user.sub, dto);
  }
}
