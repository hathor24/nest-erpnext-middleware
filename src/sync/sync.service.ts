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
      const completelyCreatedShopProduct = {
        info: {},
        media: { created: {}, removed: {} },
        files: { created: {}, removed: {} },
      };

      const shopApiClient =
        await this.shopsService.createShopApiClientByShopId(pimShopId);

      const isModified = await this.productsService.getModifiedProduct(
        pimProduct,
        shopApiClient,
      );

      const isSyncActive =
        pimProduct.custom_item_shop_list
          .filter((shop) => shop.shopname === pimShopId)
          .map((shop) => shop.shop_sync_active)
          .pop() === 1 || false;

      // if (!isSyncActive) {
      //   return null;
      // }
      if (!isModified || !isSyncActive) {
        return null;
      }

      // if (pimProduct.hasOwnProperty('variant_of')) {
      //   const pimProductParent = await this.productsService.getPimProductByName(
      //     pimProduct.variant_of,
      //   );
      //   const createdShopProduct = await this.productsService.createShopProduct(
      //     pimProductParent,
      //     pimShopId,
      //     shopApiClient,
      //   );
      //   completelyCreatedShopProduct.info = createdShopProduct;
      // } else {
      //   const createdShopProduct = await this.productsService.createShopProduct(
      //     pimProduct,
      //     pimShopId,
      //     shopApiClient,
      //   );
      //   completelyCreatedShopProduct.info = createdShopProduct;
      // }
      const createdShopProduct = await this.productsService.createShopProduct(
        pimProduct,
        pimShopId,
        shopApiClient,
      );
      completelyCreatedShopProduct.info = createdShopProduct;

      // Image upload
      const createdShopProductMedia =
        await this.productsService.createShopProductMedia(
          pimProduct,
          pimShopId,
          shopApiClient,
        );
      const removedShopProductMedia =
        await this.productsService.removeShopProductMedia(
          pimProduct,
          pimShopId,
          shopApiClient,
        );
      completelyCreatedShopProduct.media.created = createdShopProductMedia;
      completelyCreatedShopProduct.media.removed = removedShopProductMedia;

      // File upload
      const createdShopProductFile =
        await this.productsService.createShopProductFile(
          pimProduct,
          pimShopId,
          shopApiClient,
        );
      const removedShopProductFile =
        await this.productsService.removeShopProductFile(
          pimProduct,
          pimShopId,
          shopApiClient,
        );
      completelyCreatedShopProduct.files.created = createdShopProductFile;
      completelyCreatedShopProduct.files.removed = removedShopProductFile;

      // console.log('flo dotmedia', completelyCreatedShopProduct);

      return completelyCreatedShopProduct;
    } catch (error) {
      console.log('Error in syncProductToShopById', error.response.data);
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
      // console.log('flo', pimShopProducts);

      for (const pimShopProduct of pimShopProducts) {
        const createdShopProduct = await this.syncProductToShopById(
          pimShopProduct,
          pimShopId,
        );
        completelyCreatedShopProducts.push(createdShopProduct);
      }

      return completelyCreatedShopProducts;
    } catch (error) {
      throw error;
    }
  }
  public async syncShopStock(pimShopId: string) {
    try {
      const shopApiClient =
        await this.shopsService.createShopApiClientByShopId(pimShopId);

      const pimShopProducts = await this.productsService.getPimShopProducts(
        pimShopId,
        shopApiClient,
      );

      const shopProducts = await shopApiClient.post(`/api/search/product`, {
        includes: {
          product: ['id', 'productNumber'],
        },
      });

      const productPayload = async () => {
        const payload = [];
        for (const pimShopProduct of pimShopProducts) {
          for (const shopProduct of shopProducts.data.data) {
            if (pimShopProduct.item_code === shopProduct.productNumber) {
              const product = {
                id: shopProduct.id,
                stock: pimShopProduct.custom_stock,
              };
              payload.push(product);
            }
          }
        }
        return payload;
      };

      const pimShopStock = {
        'shop-stock-updates': {
          entity: 'product',
          action: 'upsert',
          payload: await productPayload(),
        },
      };
      if (pimShopStock['shop-stock-updates'].payload.length === 0) {
        return null;
      }
      const updatedShopStock = await shopApiClient.post(
        `/api/_action/sync`,
        pimShopStock,
      );

      return updatedShopStock;
    } catch (error) {
      console.log('Error in syncShopStock', error.response.data);
      throw error;
    }
  }
  public async syncShopPrices(pimShopId: string) {
    try {
      const shopApiClient =
        await this.shopsService.createShopApiClientByShopId(pimShopId);

      const pimShopProducts = await this.productsService.getPimShopProducts(
        pimShopId,
        shopApiClient,
      );

      const shopProducts = await shopApiClient.post(`/api/search/product`, {
        includes: {
          product: ['id', 'productNumber', 'price'],
        },
      });

      const productPayload = async () => {
        const payload = [];
        for (const pimShopProduct of pimShopProducts) {
          for (const shopProduct of shopProducts.data.data) {
            if (pimShopProduct.item_code === shopProduct.productNumber) {
              const price = await this.productsService.getPimProductPrice(
                pimShopProduct,
                pimShopId,
              );
              const product = {
                id: shopProduct.id,
                price: [
                  {
                    currencyId: shopProduct.price[0].currencyId,
                    gross: price,
                    net: (price / 119) * 100,
                    linked: true,
                  },
                ],
              };
              payload.push(product);
            }
          }
        }
        return payload;
      };

      const pimShopPrices = {
        'shop-price-updates': {
          entity: 'product',
          action: 'upsert',
          payload: await productPayload(),
        },
      };

      const updatedShopPrices = await shopApiClient.post(
        `/api/_action/sync`,
        pimShopPrices,
      );

      return updatedShopPrices;
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
}
