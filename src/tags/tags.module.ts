import { Module } from '@nestjs/common';
import { TagsController } from './tags.controller';
import { CommonModule } from '../common/common.module';

@Module({
  controllers: [TagsController],
  imports: [CommonModule],
})
export class TagsModule {}
