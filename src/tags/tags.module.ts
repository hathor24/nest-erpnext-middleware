import { Module } from '@nestjs/common';
import { TagsController } from './tags.controller';
import { TagsService } from './tags.service';
import { GlobalVariableService } from '../global-variable/global-variable.service';
import { ProductsService } from '../products/products.service';
import { ManufacturersService } from '../manufacturers/manufacturers.service';
import { PropertiesService } from '../properties/properties.service';
import { UnitsService } from '../units/units.service';
import { MediaService } from '../media/media.service';
import { MediaModule } from '../media/media.module';

@Module({
  controllers: [TagsController],
  providers: [
    UnitsService,
    TagsService,
    GlobalVariableService,
    ProductsService,
    ManufacturersService,
    PropertiesService,
    // MediaService,
  ],
  imports: [MediaModule],
})
export class TagsModule {}
