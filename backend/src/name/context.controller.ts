import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { NameService } from './name.service';
import { Public } from 'src/auth/public.decorator';

@ApiTags('contexts')
@Public()
@Controller('contexts')
export class ContextController {
  constructor(private readonly nameService: NameService) {}

  @Get()
  getAllContexts() {
    return this.nameService.getAllContexts();
  }
}
