import { Module } from '@nestjs/common';
import { GlobalVariableService } from './global-variable.service';
import { ProductsService } from '../products/products.service';
import { ManufacturersService } from '../manufacturers/manufacturers.service';
import { PropertiesModule } from '../properties/properties.module';
import { UnitsService } from '../units/units.service';
import { TagsService } from '../tags/tags.service';
import { MediaService } from '../media/media.service';
import { MediaModule } from '../media/media.module';

@Module({
  providers: [
    GlobalVariableService,
    ProductsService,
    ManufacturersService,
    UnitsService,
    TagsService,
    // MediaService,
  ],
  imports: [PropertiesModule, MediaModule], // Fügen Sie PropertiesModule zu den Imports hinzu
})
export class GlobalVariableModule {}
