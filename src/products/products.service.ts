// products.service.ts
import { Injectable } from '@nestjs/common';
import erpApiClient from '../api/erp-api-client';
import { ShopsService } from '../shops/shops.service';

// import * as _ from 'lodash';
//TODO: 1. variantenzuweisung !!
//2. mehr Produkteigenschaften mappen
//3. mehrere alle Shops syncen
interface ShopApiClient {
  get(path: string): Promise<any>;
  post(path: string, data: any): Promise<any>;
}

interface PropertyGroup {
  id: string;
  name: string;
}

interface PropertyValue {
  id: string;
  name: string;
  groupId: string;
}

@Injectable()
export class ProductsService {
  constructor(private readonly shopsService: ShopsService) {}

  /**
   *
   * @param shopApiClient
   * @param processedErpProduct
   *
   * sync of all shops executed in controller
   */
  public async syncShop(erpShopId: any) {
    try {
      const shopApiClient =
        await this.shopsService.createShopApiClientByShopId(erpShopId);

      const processedProducts = await this.createProductsBulk(
        erpShopId,
        shopApiClient,
      );
      const deletedShopProduct = await this.createDeletedProductsBulk(
        erpShopId,
        shopApiClient,
      );
      const syncedShop: any[] = [];

      const upsertPayload = {
        write: {
          entity: 'product',
          action: 'upsert',
          payload: [...processedProducts],
          criteria: ['write-product'],
        },
      };

      const deletePayload = {
        delete: {
          entity: 'product',
          action: 'delete',
          payload: [...deletedShopProduct],
        },
      };

      if (upsertPayload.write.payload.length != 0) {
        const modShopProductResponse = await shopApiClient.post(
          '/api/_action/sync',
          upsertPayload,
        );
        const modShopProduct = modShopProductResponse.data;

        syncedShop.push(modShopProduct);
      }

      if (deletePayload.delete.payload.length != 0) {
        const delShopProductResponse = await shopApiClient.post(
          '/api/_action/sync',
          deletePayload,
        );
        const delShopProduct = delShopProductResponse.data;
        syncedShop.push(delShopProduct);
      }

      return syncedShop;
    } catch (error) {
      console.log(error.response.data);

      throw error;
    }
  }

  // public async syncProductToShop(
  //   productNumber: string,
  //   shopApiClient: any,
  // ): Promise<any[]> {
  //   const erpProduct = await this.getProductFromErp(productNumber);

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
  //     const erpProduct = await this.getProductFromErp(productNumber);
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

  public async getProductFromErp(productNumber: string) {
    try {
      const response = await erpApiClient.get(`/Item/${productNumber}`);
      const erpProduct = response.data.data;
      return erpProduct;
    } catch (error) {
      throw error;
    }
  }

  public async deleteErpProduct(
    // erpShopId: string,
    // shopApiClient: any,
    deletedProduct: any,
  ): Promise<any> {
    try {
      const deletedErpProduct: any = {
        id: deletedProduct.id,
      };

      return deletedErpProduct;
    } catch (error) {
      throw error;
    }
  }

  public async processErpProduct(
    erpShopId: string,
    shopApiClient: any,
    modifiedProduct: any,
    // shopProduct: any | null,
  ): Promise<any> {
    try {
      // const tags = [
      //   modifiedProduct.frost,
      //   modifiedProduct.eimer,
      //   modifiedProduct.boden,
      //   modifiedProduct.spedition,
      //   modifiedProduct.sperr,
      //   modifiedProduct.vegan,
      //   modifiedProduct.rabattfrei,
      // ];

      const shopPrice = () => {
        for (const shop of modifiedProduct.shop_list) {
          if (shop.shop === erpShopId) {
            return shop.preis;
          }
        }
      };
      const shopDesc = () => {
        for (const shop of modifiedProduct.shop_list) {
          if (shop.shop === erpShopId) {
            return shop.beschreibung;
          }
        }
      };
      const parentUuid = modifiedProduct.variant_of
        ? await this.getUuidByProductNumber(
            modifiedProduct.variant_of,
            shopApiClient,
          )
        : null;

      let options = null;
      if (parentUuid) {
        options = await this.getOptionListUuids(
          modifiedProduct.item_code,
          shopApiClient,
        );
      }

      const salesChannelInfo = await this.getSalesChannelInfo(
        erpShopId,
        shopApiClient,
      );

      const mainArticle = modifiedProduct.variant_of
        ? await this.getProductFromErp(modifiedProduct.variant_of)
        : modifiedProduct;

      const processedErpProduct: any = {
        parentId: parentUuid, //TODO: check if parent exists
        productNumber: modifiedProduct.item_code,
        name: modifiedProduct.item_name,
        active: true, //TODO: check if active
        // manufacturer: modifiedProduct.hersteller, //TODO: check if manufacturer exists. eigentlich nur id
        manufacturerNumber: modifiedProduct.herstellernummer,
        ean: modifiedProduct.ean,
        stock: modifiedProduct.anzahl,
        // unit: modifiedProduct.stock_uom, //TODO: check if unit exists. eigentlich nur id
        packUnit: modifiedProduct.verpackungseinheit,
        packUnitPlural: modifiedProduct.verpackungseinheit_mehrzahl,
        weight: modifiedProduct.gewicht,
        width: modifiedProduct.breite,
        height: modifiedProduct.höhe,
        length: modifiedProduct.länge,
        // tags: tags,
        taxId: await this.getStandardTaxInfo(
          modifiedProduct.item_code,
          shopApiClient,
        ),
        // shop: modifiedProduct.shop_list[0].shop,
        price: [
          {
            currencyId: salesChannelInfo.currencyId,
            gross: shopPrice(),
            net: (shopPrice() / 119) * 100,
            linked: true,
          },
        ],
        options: options,
        description: shopDesc(),
        keywords: modifiedProduct.keywords,
        // cover: modifiedProduct.image,
        // media: modifiedProduct.image + media,
        customFields: {
          br_pim_modified: modifiedProduct.modified,
        },
      };
      if (modifiedProduct.uuid !== null) {
        processedErpProduct.id = modifiedProduct.uuid;
      }

      return processedErpProduct;
    } catch (error) {
      // console.log(error);
      throw error;
    }
  }
  public async createProductsBulk(erpShopId: string, shopApiClient: any) {
    const modifiedProducts = await this.getModifiedProducts(
      erpShopId,
      shopApiClient,
    );

    const productsBulk = [];
    for (const modifiedProduct of modifiedProducts) {
      const processedErpProduct = await this.processErpProduct(
        erpShopId,
        shopApiClient,
        modifiedProduct,
      );
      productsBulk.push(processedErpProduct);
    }

    return productsBulk;
  }
  public async createDeletedProductsBulk(
    erpShopId: string,
    shopApiClient: any,
  ) {
    const deletedProducts = await this.getDeletedProducts(
      erpShopId,
      shopApiClient,
    );

    const productsBulk = [];
    for (const deletedProduct of deletedProducts) {
      const processedErpProduct = await this.deleteErpProduct(deletedProduct);
      productsBulk.push(processedErpProduct);
    }

    return productsBulk;
  }

  public async getUuidByProductNumber(
    productNumber: string,
    shopApiClient: any,
  ) {
    try {
      const shopProduct = await this.getProductFromShop(
        productNumber,
        shopApiClient,
      );

      const uuid: string = shopProduct.id;

      return uuid;
    } catch (error) {
      throw error;
    }
  }

  public async getOptionListUuids(productNumber: string, shopApiClient: any) {
    const productOptions = await this.getErpProductOptions(productNumber);
    const result = [];

    for (const option of productOptions) {
      const propertyValue = await this.getOrCreatePropertyGroupAndValue(
        shopApiClient,
        option.attribute,
        option.attribute_value,
      );

      result.push({
        id: propertyValue.id,
        property_value: propertyValue.name,
      });
    }

    return result;
  }

  public async getErpProductOptions(productNumber: string): Promise<any> {
    try {
      const erpProduct = await this.getProductFromErp(productNumber);
      const optionsList = erpProduct.attributes;
      const options = optionsList.map((item) => ({
        attribute: item.attribute,
        attribute_value: item.attribute_value,
      }));
      return options;
    } catch (error) {
      throw error;
    }
  }

  public async getProductsFromErp() {
    try {
      const response = await erpApiClient.get('/Item');
      const erpProducts = response.data;
      return erpProducts;
    } catch (error) {
      throw error;
    }
  }

  public async getProductFromShops(productNumber: string) {
    try {
      const erpProduct = await this.getProductFromErp(productNumber);
      const shopsProduct = [];

      const productShopList = erpProduct.shop_list;

      for (const shop of productShopList) {
        const erpShopId = shop.shop;

        const shopApiClient =
          await this.shopsService.createShopApiClientByShopId(erpShopId);

        const response = await shopApiClient.get(
          `/api/product?filter[productNumber]=${productNumber}`,
        );

        const shopProduct = await response.data;
        shopsProduct.push(shopProduct);
      }

      return shopsProduct;
    } catch (error) {
      throw error;
    }
  }
  public async getProductFromShop(productNumber: string, shopApiClient: any) {
    try {
      const response = await shopApiClient.get(
        `/api/product?filter[productNumber]=${productNumber}`,
      );

      const shopProduct = await response.data.data;
      // console.log(shopProduct);
      return shopProduct[0];
    } catch (error) {
      throw error;
    }
  }

  public async createPropertyGroup(
    shopApiClient: any,
    propertyGroupName: string,
  ): Promise<any> {
    const data = {
      name: propertyGroupName,
    };

    const response = await shopApiClient.post('/api/property-group', data);
    return response;
  }

  public async createPropertyValue(
    shopApiClient: any,
    propertyValueName: string,
    propertyGroupId: string,
  ): Promise<any> {
    const data = {
      name: propertyValueName,
      groupId: propertyGroupId,
    };

    const response = await shopApiClient.post(
      '/api/property-group-option',
      data,
    );
    return response;
  }

  public async getOrCreatePropertyGroupAndValue(
    shopApiClient: ShopApiClient,
    propertyGroupName: string,
    propertyValueName: string,
  ): Promise<any> {
    let propertyGroup = await this.getPropertyGroup(
      shopApiClient,
      propertyGroupName,
    );

    if (!propertyGroup) {
      await this.createPropertyGroup(shopApiClient, propertyGroupName);
      propertyGroup = await this.getPropertyGroup(
        shopApiClient,
        propertyGroupName,
      );
    }

    let propertyValue = await this.getPropertyValue(
      shopApiClient,
      propertyValueName,
      propertyGroup.id,
    );

    if (!propertyValue) {
      await this.createPropertyValue(
        shopApiClient,
        propertyValueName,
        propertyGroup.id,
      );
      propertyValue = await this.getPropertyValue(
        shopApiClient,
        propertyValueName,
        propertyGroup.id,
      );
    }

    return propertyValue;
  }

  public async getPropertyGroup(
    shopApiClient: ShopApiClient,
    propertyGroupName: string,
  ): Promise<PropertyGroup | null> {
    const response = await shopApiClient.get('/api/property-group');
    const propertyGroups = response.data.data;

    for (const propertyGroup of propertyGroups) {
      if (propertyGroup.name === propertyGroupName) {
        return propertyGroup;
      }
    }

    return null;
  }

  public async getPropertyValue(
    shopApiClient: ShopApiClient,
    propertyValueName: string,
    propertyGroupId: string,
  ): Promise<PropertyValue | null> {
    const response = await shopApiClient.get('/api/property-group-option');
    const propertyValues = response.data.data;

    for (const propertyValue of propertyValues) {
      if (
        propertyValue.name === propertyValueName &&
        propertyValue.groupId === propertyGroupId
      ) {
        return propertyValue;
      }
    }

    return null;
  }

  public async getEntity(
    shopApiClient: any,
    entityName: string,
    apiPath: string,
  ): Promise<boolean> {
    const response = await shopApiClient.get(apiPath);
    const entities = await response.data;

    for (const entity of entities) {
      if (entity.name === entityName) {
        return entity;
      }
    }

    return null;
  }

  public async assignPropertyGroupIdToPropertyValue(
    shopApiClient: any,
    propertyValueId: string,
    propertyGroupId: string,
  ): Promise<any> {
    const data = {
      groupId: propertyGroupId,
    };

    const response = await shopApiClient.patch(
      `/api/property-group-option/${propertyValueId}`,
      data,
    );
    return response;
  }

  public async assignPropertyValueIdToProduct(
    shopApiClient: any,
    productId: string,
    propertyValueId: string,
  ): Promise<any> {
    const data = {
      propertyValueId: propertyValueId,
    };

    const response = await shopApiClient.patch(
      `/api/product/${productId}`,
      data,
    );
    return response;
  }

  public async getModifiedProducts(erpShopId: string, shopApiClient: any) {
    try {
      const responseERP = await erpApiClient.get('/Item');
      const erpProducts = responseERP.data.data;

      const modifiedProducts: any = [];

      for (const erpProduct of erpProducts) {
        const erpProductComplete = await this.getProductFromErp(
          erpProduct.name,
        );

        const response = await shopApiClient.get(
          `/api/product?filter[productNumber]=${erpProduct.name}`,
        );

        const shopProduct = response.data.data;

        erpProductComplete.uuid =
          shopProduct.length !== 0 ? shopProduct[0].id : null;

        const assignedShop = erpProductComplete.shop_list.some(
          (objekt) => objekt.shop === erpShopId,
        );

        if (
          (shopProduct.length === 0 ||
            erpProductComplete.modified !==
              shopProduct[0].customFields?.br_pim_modified) &&
          assignedShop
        ) {
          modifiedProducts.push(erpProductComplete);
        }
      }
      // console.log('MODIFIED', modifiedProducts);

      return modifiedProducts;
    } catch (error) {
      throw error;
    }
  }
  public async getDeletedProducts(erpShopId: string, shopApiClient: any) {
    try {
      const responseShop = await shopApiClient.get(`/api/product`);
      const shopProducts = responseShop.data.data;

      const responseERP = await erpApiClient.get('/Item');
      const erpProducts = responseERP.data.data;
      const unassignedProducts = [];
      // const deletedProducts: any = [];

      for (const erpProduct of erpProducts) {
        const erpProductComplete = await this.getProductFromErp(
          erpProduct.name,
        );
        const assignedShop = erpProductComplete.shop_list.some(
          (objekt) => objekt.shop === erpShopId,
        );
        if (!assignedShop) {
          unassignedProducts.push(erpProduct);
        }
      }

      // Funktion, die überprüft, ob zwei Objekte unterschiedlich sind
      const isDeleted = (obj1, obj2) => obj1.productNumber === obj2.name;

      // Filtert die Objekte, die in array1, aber nicht in array2 vorhanden sind
      const deletedProducts = shopProducts.filter((obj1) =>
        unassignedProducts.some((obj2) => isDeleted(obj1, obj2)),
      );
      // console.log('DELETE', deletedProducts);
      return deletedProducts;
    } catch (error) {
      throw error;
    }
  }

  public async getSalesChannelInfo(erpShopId: string, shopApiClient: any) {
    try {
      const erpShopData =
        await this.shopsService.getShopApiDataByShopId(erpShopId);
      const response = await shopApiClient.get(`/api/sales-channel`);
      const salesChannels = await response.data.data;
      for (const salesChannel of salesChannels) {
        if (salesChannel.id === erpShopData.shopid) {
          return salesChannel;
        }
      }
    } catch (error) {
      throw error;
    }
  }

  //TODO nicht für jeden shop sondern nur für DEN shop
  public async getStandardTaxInfo(productNumber: string, shopApiClient: any) {
    try {
      // const erpProduct = await this.getProductFromErp(productNumber);
      // const productShopList = erpProduct.shop_list;

      // for (const shop of productShopList) {
      //   const erpShopId = shop.shop;

      //   const shopApiClient =
      //     await this.shopsService.createShopApiClientByShopId(erpShopId);

      //   const response = await shopApiClient.get(`/api/tax`);

      //   const taxes = await response.data.data;
      //   for (const tax of taxes) {
      //     if (tax.position == 1 && tax.name == 'Standard rate') {
      //       console.log(tax);
      //       return tax.id;
      //     }
      //   }
      // }
      const response = await shopApiClient.get(`/api/tax`);
      const taxes = await response.data.data;
      for (const tax of taxes) {
        if (tax.position == 1 && tax.name == 'Standard rate') {
          return tax.id;
        }
      }
    } catch (error) {
      // console.log(error);
      throw error;
    }
  }
}
