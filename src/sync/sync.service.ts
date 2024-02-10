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

  public async syncProductToShopById(pimProduct: any, pimShopId: string) {
    try {
      const completelyCreatedShopProduct = { info: {}, media: {} };
      const shopApiClient =
        await this.shopsService.createShopApiClientByShopId(pimShopId);

      const isModified = await this.productsService.getModifiedProduct(
        pimProduct,
        shopApiClient,
      );

      if (!isModified) {
        return null;
      }

      if (pimProduct.hasOwnProperty('variant_of')) {
        const pimProductParent = await this.productsService.getPimProductByName(
          pimProduct.variant_of,
        );
        const createdShopProduct = await this.productsService.createShopProduct(
          pimProductParent,
          pimShopId,
          shopApiClient,
        );
        completelyCreatedShopProduct.info = createdShopProduct;
      } else {
        const createdShopProduct = await this.productsService.createShopProduct(
          pimProduct,
          pimShopId,
          shopApiClient,
        );
        completelyCreatedShopProduct.info = createdShopProduct;
      }

      const createdShopProductMedia =
        await this.productsService.createShopProductMedia(
          pimProduct,
          pimShopId,
          shopApiClient,
        );
      completelyCreatedShopProduct.media = createdShopProductMedia;

      return completelyCreatedShopProduct;
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
      const completelyCreatedShopProducts = [];
      const shopApiClient =
        await this.shopsService.createShopApiClientByShopId(pimShopId);

      const pimShopProducts = await this.productsService.getPimShopProducts(
        pimShopId,
        shopApiClient,
      );

      for (const pimShopProduct of pimShopProducts) {
        const createdShopProduct = await this.syncProductToShopById(
          pimShopProduct,
          pimShopId,
        );
        console.log(createdShopProduct);
        completelyCreatedShopProducts.push(createdShopProduct);
      }

      return completelyCreatedShopProducts;
    } catch (error) {
      throw error;
    }
  }
}
