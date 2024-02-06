import { Controller, Get, Param } from '@nestjs/common';
import { SyncService } from './sync.service';

@Controller('sync')
export class SyncController {
  constructor(
    private readonly syncService: SyncService, // private readonly manufacturersService: ManufacturersService,
  ) {}

  @Get('/shop/:shopId')
  async syncShopById(@Param('shopId') shopId: string) {
    try {
      const syncedShop = await this.syncService.syncShopById(shopId);
      return syncedShop;
    } catch (error) {
      throw error;
    }
  }

  @Get('/shop/:shopId/:productNumber')
  async syncProductToShopById(
    @Param('shopId') shopId: string,
    @Param('productNumber') productNumber: string,
  ) {
    try {
      const syncedShop = await this.syncService.syncProductToShopById(
        productNumber,
        shopId,
      );
      return syncedShop;
    } catch (error) {
      throw error;
    }
  }
  @Get('/shop/:shopId/:productNumber/media')
  async syncProductMediaToShopById(
    @Param('shopId') shopId: string,
    @Param('productNumber') productNumber: string,
  ) {
    try {
      const syncedShop = await this.syncService.syncProductMediaToShopById(
        productNumber,
        shopId,
      );
      return syncedShop;
    } catch (error) {
      throw error;
    }
  }
}
