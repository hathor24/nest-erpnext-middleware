import { Module } from '@nestjs/common';
import { MediaService } from './media.service';
import { MediaController } from './media.controller';
import { CommonModule } from '../common/common.module';

@Module({
  providers: [MediaService],
  controllers: [MediaController],
  imports: [CommonModule],
})
export class MediaModule {}
