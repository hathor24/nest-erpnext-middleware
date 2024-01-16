import { Injectable } from '@nestjs/common';
import { ProductsService } from '../products/products.service';

@Injectable()
export class SyncService {
  constructor(private readonly productsService: ProductsService) {}

  public async syncShopById(erpShopId: any) {
    try {
      const shopApiClient =
        await this.productsService.createShopApiClientByShopId(erpShopId);

      const processedProducts = await this.productsService.createProductsBulk(
        erpShopId,
        shopApiClient,
      );
      const deletedShopProduct =
        await this.productsService.createDeletedProductsBulk(
          erpShopId,
          shopApiClient,
        );
      const syncedShop: any[] = [];

      const upsertPayload = {
        'write-products': {
          entity: 'product',
          action: 'upsert',
          payload: [...processedProducts],
        },
      };

      const deletePayload = {
        'delete-products': {
          entity: 'product',
          action: 'delete',
          payload: [...deletedShopProduct],
        },
      };

      if (upsertPayload['write-products'].payload.length != 0) {
        const modShopProductResponse = await shopApiClient.post(
          '/api/_action/sync',
          upsertPayload,
        );
        const modShopProduct = modShopProductResponse.data;

        syncedShop.push(modShopProduct);
      }
      const deletedProductIds = deletePayload['delete-products'].payload;
      const delParentProductList = [];
      for (const deletedProductId of deletedProductIds) {
        const productParent = await this.productsService.getParentProductById(
          deletedProductId.id,
          shopApiClient,
        );
        delParentProductList.push(productParent);
      }

      if (deletePayload['delete-products'].payload.length != 0) {
        const delShopProductResponse = await shopApiClient.post(
          '/api/_action/sync',
          deletePayload,
        );
        const delShopProduct = delShopProductResponse.data;
        syncedShop.push(delShopProduct);

        const deletedOptions = syncedShop[0].deleted.product_option;
        let productParent = '';
        for (const deletedOption of deletedOptions) {
          for (const delParentProduct of delParentProductList) {
            if (delParentProduct.id == deletedOption.productId) {
              productParent = delParentProduct.parentId;
            }
          }

          const configuratorId =
            await this.productsService.getProductConfiguratorSetting(
              productParent,
              deletedOption.optionId,
              erpShopId,
            );

          await shopApiClient.delete(
            `/api/product-configurator-setting/${configuratorId}`,
          );
        }
      }

      return syncedShop;
    } catch (error) {
      console.log(error.response.data.errors[0]);
      throw error;
    }
  }

  // public async syncProductToShop(
  //   productNumber: string,
  //   shopApiClient: any,
  // ): Promise<any[]> {
  //   const erpProduct = await this.getProductByProductNumberFromErp(productNumber);

  //   const shopProductResponse = await shopApiClient.get(
  //     `/api/product?filter[productNumber]=${productNumber}`,
  //   );

  //   const shopProducts = shopProductResponse.data.data;

  //   const processedShopProduct = await this.processErpProduct(
  //     shopApiClient,
  //     erpProduct,
  //     shopProducts[0] ? shopProducts[0] : null,
  //     //modifiedProducts?
  //   );

  //   const upsertPayload = {
  //     write: {
  //       entity: 'product',
  //       action: 'upsert',
  //       payload: [
  //         {
  //           ...processedShopProduct,
  //         },
  //       ],
  //       criteria: ['write-product'],
  //     },
  //   };
  // }

  // public async syncProductToShops(productNumber: string): Promise<any[]> {
  //   try {
  //     const erpProduct = await this.getProductByProductNumberFromErp(productNumber);
  //     const productShopList = erpProduct.shop_list;
  //     const syncedShopsProduct: any[] = [];

  //     for (const shop of productShopList) {
  //       const erpShopId = shop.shop;
  //       const shopApiClient =
  //         await this.shopsService.createShopApiClientByShopId(erpShopId);

  //       const shopProductResponse = await shopApiClient.get(
  //         `/api/product?filter[productNumber]=${productNumber}`,
  //       );

  //       const shopProducts = shopProductResponse.data.data;

  //       const processedShopProduct = await this.processErpProduct(
  //         erpShopId,
  //         shopApiClient,
  //         erpProduct,
  //       );

  //       const deletedShopProduct = await this.deleteErpProduct(
  //         erpShopId,
  //         shopApiClient,
  //         erpProduct,
  //       );

  //       const upsertPayload = {
  //         write: {
  //           entity: 'product',
  //           action: 'upsert',
  //           payload: [
  //             {
  //               ...processedShopProduct,
  //             },
  //           ],
  //           criteria: ['write-product'],
  //         },
  //       };

  //       const deletePayload = {
  //         delete: {
  //           entity: 'product',
  //           action: 'delete',
  //           payload: [
  //             {
  //               ...deletedShopProduct,
  //             },
  //           ],
  //         },
  //       };

  //       if (shopProducts && shopProducts.length > 0) {
  //         const shopProductData = shopProducts[0];

  //         upsertPayload.write.payload[0].id = shopProductData.id;
  //       }

  //       const modShopProductResponse = await shopApiClient.post(
  //         '/api/_action/sync',
  //         upsertPayload,
  //       );

  //       const delShopProductResponse = await shopApiClient.post(
  //         '/api/_action/sync',
  //         deletePayload,
  //       );

  //       const modShopProduct = modShopProductResponse.data;

  //       syncedShopsProduct.push(modShopProduct);
  //     }

  //     return syncedShopsProduct;
  //   } catch (error) {
  //     // console.log(error);
  //     throw error;
  //   }
  // }
}
