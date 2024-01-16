import { Controller, Get, Param } from '@nestjs/common';
import { SyncService } from './sync.service';

@Controller('sync')
export class SyncController {
  constructor(
    private readonly syncService: SyncService, // private readonly manufacturersService: ManufacturersService,
  ) {}

  @Get('/shop/:shopId')
  async syncShop(@Param('shopId') shopId: string) {
    try {
      const syncedShop = await this.syncService.syncShopById(shopId);
      return syncedShop;
    } catch (error) {
      throw error;
    }
  }
}
