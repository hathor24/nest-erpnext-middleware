import { Module } from '@nestjs/common';
import { PropertiesService } from './properties.service';
import { PropertiesController } from './properties.controller';
import { SyncService } from '../sync/sync.service';
import { ManufacturersService } from '../manufacturers/manufacturers.service';
import { GlobalVariableService } from '../global-variable/global-variable.service';
import { ProductsService } from '../products/products.service';
import { UnitsService } from '../units/units.service';
import { TagsService } from '../tags/tags.service';
import { MediaService } from '../media/media.service';
import { MediaModule } from 'src/media/media.module';

@Module({
  providers: [
    PropertiesService,
    SyncService,
    ManufacturersService,
    GlobalVariableService,
    ProductsService,
    UnitsService,
    TagsService,
    // MediaService,
  ],
  imports: [MediaModule],
  controllers: [PropertiesController],
  exports: [PropertiesService],
})
export class PropertiesModule {}
