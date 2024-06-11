import { Controller, Get, Param } from '@nestjs/common';
import { ShopsService } from './shops.service';

@Controller('shops')
export class ShopsController {
  constructor(private readonly shopsService: ShopsService) {}

  @Get('/pim')
  async getShopsFromPim() {
    const pimShops = await this.shopsService.getShopsFromPim();
    return pimShops;
  }

  @Get('/pim/:shopNumber')
  async getShopFromPim(@Param('shopNumber') shopNumber: string) {
    const pimShop = await this.shopsService.getShopFromPim(shopNumber);
    return pimShop;
  }
}
