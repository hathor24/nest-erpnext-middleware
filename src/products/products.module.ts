import { Module } from '@nestjs/common';
import { ProductsController } from './products.controller';
import { CommonModule } from '../common/common.module';

@Module({
  controllers: [ProductsController],
  imports: [CommonModule],
})
export class ProductsModule {}
