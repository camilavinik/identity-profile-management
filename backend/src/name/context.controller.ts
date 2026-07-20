import { Controller, Get } from '@nestjs/common';
import { NameService } from './name.service';
import { Public } from 'src/auth/public.decorator';

@Public()
@Controller('contexts')
export class ContextController {
  constructor(private readonly nameService: NameService) {}

  @Get()
  getAllContexts() {
    return this.nameService.getAllContexts();
  }
}
