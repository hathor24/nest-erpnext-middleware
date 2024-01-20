import { Module } from '@nestjs/common';
import { UnitsService } from './units.service';
import { UnitsController } from './units.controller';
import { GlobalVariableService } from '../global-variable/global-variable.service';
import { ProductsService } from '../products/products.service';
import { ManufacturersService } from '../manufacturers/manufacturers.service';
import { PropertiesService } from '../properties/properties.service';
import { PropertiesModule } from '../properties/properties.module';
import { TagsService } from '../tags/tags.service';
import { MediaService } from '../media/media.service';
import { MediaModule } from '../media/media.module';
// import { GlobalVariableModule } from '../global-variable/global-variable.module';

@Module({
  providers: [
    UnitsService,
    GlobalVariableService,
    ProductsService,
    ManufacturersService,
    PropertiesService,
    TagsService,
    // MediaService,
  ],
  controllers: [UnitsController],
  imports: [PropertiesModule, MediaModule], // Fügen Sie PropertiesModule zu den Imports hinzu
})
export class UnitsModule {}
