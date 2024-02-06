import { Module } from '@nestjs/common';
import { ProductsController } from './products.controller';
// import { ProductsService } from './products.service';
import { CommonModule } from '../common/common.module';

@Module({
  controllers: [ProductsController],
  // providers: [ProductsService],
  imports: [CommonModule],
})
export class ProductsModule {}
