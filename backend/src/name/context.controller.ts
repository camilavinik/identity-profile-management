import { Controller, Get } from '@nestjs/common';
import { NameService } from './name.service';

@Controller('contexts')
export class ContextController {
  constructor(private readonly nameService: NameService) {}

  @Get()
  getAllContexts() {
    return this.nameService.getAllContexts();
  }
}
