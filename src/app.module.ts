import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ProductsModule } from './products/products.module';
import { ShopsModule } from './shops/shops.module';

@Module({
  controllers: [AppController],
  providers: [AppService],
  imports: [ProductsModule, ShopsModule],
})
export class AppModule {}
