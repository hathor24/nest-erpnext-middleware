import { Controller, Get, Param } from '@nestjs/common';
import { SyncService } from './sync.service';
import { ShopsService } from '../shops/shops.service';
import { ProductsService } from '../products/products.service';

@Controller('sync')
export class SyncController {
  constructor(
    private readonly syncService: SyncService,
    private readonly shopsService: ShopsService,
    private readonly productService: ProductsService,
  ) {}
  @Get('/product/:productNumber')
  async syncProduct(@Param('productNumber') productNumber: string) {
    const productData =
      await this.productService.getPimProductByName(productNumber);

    const pimProductShopsIds =
      await this.productService.getPimProductShops(productData);

    const syncPromises = pimProductShopsIds.map((shopId) =>
      this.syncProductToShopById(shopId, productNumber),
    );

    await Promise.all(syncPromises);
    return 'Product synchronization processes have been initiated';
  }

  @Get('/shop/all')
  async syncAllShops() {
    const pimShopIds = (await this.shopsService.getShopsFromPim()).map(
      (shop) => shop.name,
    );
    const syncPromises = pimShopIds.map((shopId) => this.syncShopById(shopId));

    await Promise.all(syncPromises);
    return 'All synchronization processes have been initiated';
  }

  @Get('/shop/:shopId/')
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
      const shopApiClient =
        await this.shopsService.createShopApiClientByShopId(shopId);
      const syncedShop = await this.syncService.syncProductMediaToShopById(
        productNumber,
        shopId,
        shopApiClient,
      );
      return syncedShop;
    } catch (error) {
      throw error;
    }
  }
}
