import { Module } from '@nestjs/common';
import { SyncController } from './sync.controller';
import { SyncService } from './sync.service';
import { ManufacturersService } from '../manufacturers/manufacturers.service';
import { GlobalVariableService } from '../global-variable/global-variable.service';
import { ProductsService } from '../products/products.service';
import { PropertiesModule } from '../properties/properties.module';
import { UnitsService } from '../units/units.service';

@Module({
  controllers: [SyncController],
  providers: [
    SyncService,
    ManufacturersService,
    GlobalVariableService,
    ProductsService,
    UnitsService,
  ],
  imports: [PropertiesModule], // Fügen Sie PropertiesModule zu den Imports hinzu
})
export class SyncModule {}
