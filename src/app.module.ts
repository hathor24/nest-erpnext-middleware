import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ProductsModule } from './products/products.module';
import { ShopsModule } from './shops/shops.module';
import { ManufacturersModule } from './manufacturers/manufacturers.module';
import { GlobalVariableModule } from './global-variable/global-variable.module';
import { SyncModule } from './sync/sync.module';
import { PropertiesModule } from './properties/properties.module';
import { UnitsModule } from './units/units.module';

@Module({
  controllers: [AppController],
  providers: [AppService],
  imports: [
    ProductsModule,
    ShopsModule,
    ManufacturersModule,
    GlobalVariableModule,
    SyncModule,
    PropertiesModule,
    UnitsModule,
  ],
})
export class AppModule {}
