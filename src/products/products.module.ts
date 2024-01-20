import { Module } from '@nestjs/common';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
import { ShopsService } from '../shops/shops.service';
import { ManufacturersService } from '../manufacturers/manufacturers.service';
import { PropertiesService } from '../properties/properties.service';
import { PropertiesModule } from '../properties/properties.module';
import { UnitsService } from '../units/units.service';
import { TagsService } from '../tags/tags.service';
import { MediaService } from '../media/media.service';
import { MediaModule } from '../media/media.module';

@Module({
  controllers: [ProductsController],
  providers: [
    ProductsService,
    ShopsService,
    ManufacturersService,
    PropertiesService,
    UnitsService,
    TagsService,
    // MediaService,
  ],
  imports: [PropertiesModule, MediaModule], // Fügen Sie PropertiesModule zu den Imports hinzu
})
export class ProductsModule {}
