import { Module } from '@nestjs/common';
import { MediaController } from './media.controller';
import { CommonModule } from '../common/common.module';

@Module({
  controllers: [MediaController],
  imports: [CommonModule],
})
export class MediaModule {}
