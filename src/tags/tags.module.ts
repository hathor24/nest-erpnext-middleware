import { Module } from '@nestjs/common';
import { TagsController } from './tags.controller';
import { TagsService } from './tags.service';
import { CommonModule } from 'src/common/common.module';

@Module({
  controllers: [TagsController],
  providers: [TagsService],
  imports: [CommonModule],
})
export class TagsModule {}
