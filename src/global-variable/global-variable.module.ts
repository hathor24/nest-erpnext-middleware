import { Module } from '@nestjs/common';
import { GlobalVariableService } from './global-variable.service';
import { ProductsService } from '../products/products.service';
import { ManufacturersService } from '../manufacturers/manufacturers.service';
import { PropertiesModule } from '../properties/properties.module';
import { UnitsService } from '../units/units.service';

@Module({
  providers: [
    GlobalVariableService,
    ProductsService,
    ManufacturersService,
    UnitsService,
  ],
  imports: [PropertiesModule], // Fügen Sie PropertiesModule zu den Imports hinzu
})
export class GlobalVariableModule {}
