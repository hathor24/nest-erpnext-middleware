import { Module } from '@nestjs/common';
import { SyncController } from './sync.controller';
import { SyncService } from './sync.service';
import { CommonModule } from 'src/common/common.module';

@Module({
  controllers: [SyncController],
  providers: [SyncService],
  imports: [CommonModule],
})
export class SyncModule {}
