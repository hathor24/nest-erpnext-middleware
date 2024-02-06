import { Module } from '@nestjs/common';
import { GlobalVariableService } from '../global-variable/global-variable.service';
import { ManufacturersService } from '../manufacturers/manufacturers.service';
import { MediaService } from '../media/media.service';
import { ProductsService } from '../products/products.service';
import { PropertiesService } from '../properties/properties.service';
import { ShopsService } from '../shops/shops.service';
import { SyncService } from '../sync/sync.service';
import { TagsService } from '../tags/tags.service';
import { UnitsService } from '../units/units.service';
import { ConfiguratorSettingsService } from '../configurator-settings/configurator-settings.service';

@Module({
  providers: [
    GlobalVariableService,
    ManufacturersService,
    MediaService,
    ProductsService,
    PropertiesService,
    ShopsService,
    SyncService,
    TagsService,
    UnitsService,
    ConfiguratorSettingsService,
  ],
  exports: [
    GlobalVariableService,
    ManufacturersService,
    MediaService,
    ProductsService,
    PropertiesService,
    ShopsService,
    SyncService,
    TagsService,
    UnitsService,
    ConfiguratorSettingsService,
  ],
})
// export { GlobalVariableService, ManufacturersService, MediaService, ProductsService, PropertiesService, ShopsService, SyncService, TagsService, UnitsService,}
export class CommonModule {}
