import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ProductsModule } from './products/products.module';
import { ShopsModule } from './shops/shops.module';
import { ManufacturersModule } from './manufacturers/manufacturers.module';
import { GlobalVariableModule } from './global-variable/global-variable.module';

@Module({
  controllers: [AppController],
  providers: [AppService],
  imports: [
    ProductsModule,
    ShopsModule,
    ManufacturersModule,
    GlobalVariableModule,
  ],
})
export class AppModule {}
