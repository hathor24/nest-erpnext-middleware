import { Module, forwardRef } from '@nestjs/common';
import { MediaService } from './media.service';
import { MediaController } from './media.controller';
import { ProductsService } from '../products/products.service';
import { ManufacturersService } from '../manufacturers/manufacturers.service';
import { PropertiesService } from '../properties/properties.service';
import { UnitsService } from '../units/units.service';
import { TagsService } from '../tags/tags.service';
import { ProductsModule } from '../products/products.module';

@Module({
  providers: [
    MediaService,
    // ProductsService,
    ManufacturersService,
    PropertiesService,
    UnitsService,
    TagsService,
  ],
  controllers: [MediaController],
  exports: [MediaService],
  imports: [forwardRef(() => ProductsModule)],
})
export class MediaModule {}
