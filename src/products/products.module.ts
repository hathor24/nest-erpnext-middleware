import { Module } from '@nestjs/common';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
import { ShopsService } from '../shops/shops.service';
import { ManufacturersService } from '../manufacturers/manufacturers.service';
import { PropertiesService } from '../properties/properties.service';
import { PropertiesModule } from '../properties/properties.module';
import { UnitsService } from '../units/units.service';

@Module({
  controllers: [ProductsController],
  providers: [
    ProductsService,
    ShopsService,
    ManufacturersService,
    PropertiesService,
    UnitsService,
  ],
  imports: [PropertiesModule], // Fügen Sie PropertiesModule zu den Imports hinzu
})
export class ProductsModule {}
