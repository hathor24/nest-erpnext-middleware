import { Module } from '@nestjs/common';
import { GlobalVariableService } from './global-variable.service';
import { ProductsService } from '../products/products.service';
import { ManufacturersService } from '../manufacturers/manufacturers.service';

@Module({
  providers: [GlobalVariableService, ProductsService, ManufacturersService],
})
export class GlobalVariableModule {}
