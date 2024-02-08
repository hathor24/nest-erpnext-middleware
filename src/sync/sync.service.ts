import { Injectable } from '@nestjs/common';
import { ProductsService } from '../products/products.service';
import { MediaService } from '../media/media.service';
import { ShopsService } from '../shops/shops.service';

@Injectable()
export class SyncService {
  constructor(
    private readonly productsService: ProductsService,
    private readonly mediaService: MediaService,
    private readonly shopsService: ShopsService,
  ) {}

  public async syncProductToShopById(productNumber: string, erpShopId: string) {
    try {
      const shopApiClient =
        await this.shopsService.createShopApiClientByShopId(erpShopId);
      const pimProduct =
        await this.productsService.getPimProductByName(productNumber);
      const createdShopProduct = await this.productsService.createShopProduct(
        pimProduct,
        shopApiClient,
        erpShopId,
      );
      return createdShopProduct;
    } catch (error) {
      throw error;
    }
  }
  public async syncProductMediaToShopById(
    productNumber: string,
    pimShopId: string,
    shopApiClient: any,
  ) {
    try {
      // const shopApiClient =
      //   await this.shopsService.createShopApiClientByShopId(pimShopId);
      const pimProduct =
        await this.productsService.getPimProductByName(productNumber);
      const createdShopProductMedia =
        await this.productsService.createShopProductMedia(
          pimProduct,
          shopApiClient,
          pimShopId,
        );
      return createdShopProductMedia;
    } catch (error) {
      throw error;
    }
  }
  public async syncShopById(pimShopId: string) {
    try {
      const shopApiClient =
        await this.shopsService.createShopApiClientByShopId(pimShopId);

      const modifiedMainProducts =
        await this.productsService.getModifiedMainProducts(
          pimShopId,
          shopApiClient,
        );
      const modifiedProducts = await this.productsService.getModifiedProducts(
        pimShopId,
        shopApiClient,
      );

      const completelyCreatedShopProducts = [];

      for (const modifiedMainProduct of modifiedMainProducts) {
        const createdShopProduct = await this.syncProductToShopById(
          modifiedMainProduct,
          pimShopId,
        );
        completelyCreatedShopProducts.push(createdShopProduct);
      }

      for (const modifiedProduct of modifiedProducts) {
        const createdShopProductMedia = await this.syncProductMediaToShopById(
          modifiedProduct,
          pimShopId,
          shopApiClient,
        );
        completelyCreatedShopProducts.push(createdShopProductMedia);
      }
      // throw 'error';
      return completelyCreatedShopProducts;
    } catch (error) {
      throw error;
    }
  }
}
