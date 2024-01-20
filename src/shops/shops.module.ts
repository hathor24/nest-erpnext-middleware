import { Module } from '@nestjs/common';
import { ShopsController } from './shops.controller';
import { ShopsService } from './shops.service';
import { CommonModule } from '../common/common.module';

@Module({
  controllers: [ShopsController],
  providers: [ShopsService],
  imports: [CommonModule],
})
export class ShopsModule {}
