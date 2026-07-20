import { Module } from '@nestjs/common';
import { NameController } from './name.controller';
import { ContextController } from './context.controller';
import { NameService } from './name.service';
import { StorageModule } from 'src/storage/storage.module';

@Module({
  imports: [StorageModule],
  controllers: [NameController, ContextController],
  providers: [NameService],
})
export class NameModule {}
