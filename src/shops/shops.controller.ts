import { Controller, Get, Param } from '@nestjs/common';
import { ShopsService } from './shops.service';

@Controller('shops')
export class ShopsController {
  constructor(private readonly shopsService: ShopsService) {}

  @Get('/erp')
  async getShopsFromPim() {
    const erpShops = await this.shopsService.getShopsFromPim();
    return erpShops;
  }

  @Get('/erp/:shopNumber')
  async getShopFromPim(@Param('shopNumber') shopNumber: string) {
    const erpShop = await this.shopsService.getShopFromPim(shopNumber);
    return erpShop;
  }
}
