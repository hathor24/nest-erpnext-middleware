import { Module } from '@nestjs/common';
import { ShopsController } from './shops.controller';
import { CommonModule } from '../common/common.module';

@Module({
  controllers: [ShopsController],
  imports: [CommonModule],
})
export class ShopsModule {}
