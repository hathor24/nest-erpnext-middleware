import { Controller, Get, Param } from '@nestjs/common';
import { ShopsService } from './shops.service';

@Controller('shops')
export class ShopsController {
  constructor(private readonly shopsService: ShopsService) {}

  @Get('/erp')
  async getShopsFromErp() {
    const erpShops = await this.shopsService.getShopsFromErp();
    return erpShops;
  }

  @Get('/erp/:shopNumber')
  async getShopFromERP(@Param('shopNumber') shopNumber: string) {
    const erpShop = await this.shopsService.getShopFromErp(shopNumber);
    return erpShop;
  }
}
