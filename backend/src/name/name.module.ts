import { Module } from '@nestjs/common';
import { NameController } from './name.controller';
import { ContextController } from './context.controller';
import { NameService } from './name.service';
import { StorageModule } from 'src/storage/storage.module';
import { UserNameController } from './user-name.controller';

@Module({
  imports: [StorageModule],
  controllers: [NameController, ContextController, UserNameController],
  providers: [NameService],
})
export class NameModule {}
