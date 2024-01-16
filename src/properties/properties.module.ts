import { Module } from '@nestjs/common';
import { PropertiesService } from './properties.service';
import { PropertiesController } from './properties.controller';
import { SyncService } from '../sync/sync.service';
import { ManufacturersService } from '../manufacturers/manufacturers.service';
import { GlobalVariableService } from '../global-variable/global-variable.service';
import { ProductsService } from '../products/products.service';
import { UnitsService } from '../units/units.service';

@Module({
  providers: [
    PropertiesService,
    SyncService,
    ManufacturersService,
    GlobalVariableService,
    ProductsService,
    UnitsService,
  ],
  controllers: [PropertiesController],
  exports: [PropertiesService],
})
export class PropertiesModule {}
