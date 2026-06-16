import { Module } from '@nestjs/common';
import { NameController } from './name.controller';
import { NameService } from './name.service';

@Module({
  controllers: [NameController],
  providers: [NameService],
})
export class NameModule {}
