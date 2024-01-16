import { Module } from '@nestjs/common';
import { ManufacturersController } from './manufacturers.controller';
import { ManufacturersService } from './manufacturers.service';
import { GlobalVariableService } from '../global-variable/global-variable.service';
import { ProductsService } from '../products/products.service';
import { PropertiesService } from '../properties/properties.service';
import { UnitsService } from '../units/units.service';

@Module({
  controllers: [ManufacturersController],
  providers: [
    ManufacturersService,
    GlobalVariableService,
    ProductsService,
    PropertiesService,
    UnitsService,
  ],
})
export class ManufacturersModule {}
