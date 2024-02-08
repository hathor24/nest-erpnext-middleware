import { Module } from '@nestjs/common';
import { SyncController } from './sync.controller';
import { CommonModule } from '../common/common.module';

@Module({
  controllers: [SyncController],
  imports: [CommonModule],
})
export class SyncModule {}
