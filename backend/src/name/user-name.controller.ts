import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { NameService } from './name.service';
import { QueryNameEntryDto } from './dto/query-name-entry.dto';

@ApiTags('user')
@ApiBearerAuth('bearer')
@Controller('user')
export class UserNameController {
  constructor(private readonly nameService: NameService) {}

  @Get(':id/name')
  findByUser(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: QueryNameEntryDto,
  ) {
    return this.nameService.queryByUser(id, query.context);
  }
}
