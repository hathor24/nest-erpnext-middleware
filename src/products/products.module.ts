import { Module } from '@nestjs/common';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
import { ShopsService } from '../shops/shops.service';

@Module({
  controllers: [ProductsController],
  providers: [ProductsService, ShopsService],
})
export class ProductsModule {}
