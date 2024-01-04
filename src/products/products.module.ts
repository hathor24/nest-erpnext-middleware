import { Module } from '@nestjs/common';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
import { ShopsService } from '../shops/shops.service';
import { ManufacturersService } from '../manufacturers/manufacturers.service';

@Module({
  controllers: [ProductsController],
  providers: [ProductsService, ShopsService, ManufacturersService],
})
export class ProductsModule {}
