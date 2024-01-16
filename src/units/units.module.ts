import { Module } from '@nestjs/common';
import { UnitsService } from './units.service';
import { UnitsController } from './units.controller';
import { GlobalVariableService } from '../global-variable/global-variable.service';
import { ProductsService } from '../products/products.service';
import { ManufacturersService } from '../manufacturers/manufacturers.service';
import { PropertiesService } from '../properties/properties.service';
import { PropertiesModule } from '../properties/properties.module';
// import { GlobalVariableModule } from '../global-variable/global-variable.module';

@Module({
  providers: [
    UnitsService,
    GlobalVariableService,
    ProductsService,
    ManufacturersService,
    PropertiesService,
  ],
  controllers: [UnitsController],
  imports: [PropertiesModule], // Fügen Sie PropertiesModule zu den Imports hinzu
})
export class UnitsModule {}
