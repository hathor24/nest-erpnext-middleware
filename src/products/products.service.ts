// products.service.ts
import { Injectable } from '@nestjs/common';
import erpApiClient from '../api/erp-api-client';
// import { ShopsService } from '../shops/shops.service';
import axios, { AxiosInstance } from 'axios';
import { ManufacturersService } from '../manufacturers/manufacturers.service';

// import * as _ from 'lodash';
//TODO:
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
  constructor(private readonly manufacturersService: ManufacturersService) {}

  public async syncShopById(erpShopId: any) {
    try {
      const shopApiClient = await this.createShopApiClientByShopId(erpShopId);

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
        const productParent = await this.getParentProductById(
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

          const configuratorId = await this.getProductConfiguratorSetting(
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

  public async getParentProductById(productId: string, shopApiClient: any) {
    const responseProduct = await shopApiClient.get(
      `/api/product/${productId}`,
    );
    const product = responseProduct.data.data;
    const productParent = { parentId: product.parentId, id: product.id };

    return productParent;
  }

  public async getProductByProductNumberFromErp(productNumber: string) {
    try {
      const response = await erpApiClient.get(`/Item/${productNumber}`);
      const erpProduct = response.data.data;
      return erpProduct;
    } catch (error) {
      throw error;
    }
  }

  public async processBulkData(payload: any, action: string) {
    if (action === 'upsert') {
      // const bulkData = prepareCreateBulkData(payload);
      // return bulkData;
    } else if (action === 'delete') {
      // const bulkData = prepareDeleteBulkData(payload);
      // return bulkData;
    } else {
      throw new Error(
        "Ungültige Aktion. Unterstützte Aktionen sind 'upsert' oder 'delete'.",
      );
    }
  }

  public async deleteErpProduct(deletedProduct: any): Promise<any> {
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

      const shopPrice = (type: string) => {
        if (type == 'main') {
          for (const shop of mainArticle.shop_list) {
            if (shop.shop === erpShopId) {
              return shop.preis;
            }
          }
        } else if (type == 'child') {
          for (const shop of modifiedProduct.shop_list) {
            if (shop.shop === erpShopId) {
              return shop.preis;
            }
          }
        }
      };
      const shopDesc = (type: string) => {
        if (type == 'main') {
          for (const shop of mainArticle.shop_list) {
            if (shop.shop === erpShopId) {
              return shop.beschreibung;
            }
          }
        } else if (type == 'child') {
          for (const shop of modifiedProduct.shop_list) {
            if (shop.shop === erpShopId) {
              return shop.beschreibung;
            }
          }
        }
      };
      const parentUuid = modifiedProduct.variant_of
        ? await this.getUuidByProductNumber(
            modifiedProduct.variant_of,
            shopApiClient,
          )
        : null;

      const options = parentUuid
        ? await this.getOptionListUuids(
            modifiedProduct.item_code,
            shopApiClient,
          )
        : null;

      const configuration = () => {
        if (options) {
          const optionObjects = options.map((option) => ({
            optionId: option.id,
          }));

          return optionObjects;
        } else {
          return null;
        }
      };
      const configuratorSettings = async () => {
        const childrenResponse = await children(shopApiClient);
        if (!childrenResponse || childrenResponse[0].id) {
          return null;
        } else {
          return configuration();
        }
      };

      const salesChannelInfo = await this.getSalesChannelInfo(
        erpShopId,
        shopApiClient,
      );

      const mainArticle = modifiedProduct.variant_of
        ? await this.getProductByProductNumberFromErp(
            modifiedProduct.variant_of,
          )
        : modifiedProduct;

      const children = async (shopApiClient) => {
        if (modifiedProduct.variant_of) {
          const child = [
            {
              id: await this.getUuidByProductNumber(
                modifiedProduct.item_code,
                shopApiClient,
              ),
              productNumber: modifiedProduct.item_code,

              stock: modifiedProduct.anzahl,
              active: modifiedProduct.active == 0 ? false : true,
              manufacturer: null,

              weight: modifiedProduct.gewicht,
              price: [
                {
                  currencyId: salesChannelInfo.currencyId,
                  gross: shopPrice('child'),
                  net: (shopPrice('child') / 119) * 100,
                  linked: true,
                },
              ],
              options: options,
              description: shopDesc('child'),
              customFields: {
                br_pim_modified: modifiedProduct.modified,
              },
            },
          ];
          return child;
        } else {
          return null;
        }
      };

      const manufacturerId = async (shopApiClient) => {
        let manufacturerId: string = '';
        const manufacturerName = modifiedProduct.hersteller;
        const allManufacturersData =
          await this.manufacturersService.getShopManufacturers(shopApiClient);
        const manufacturerData = allManufacturersData.find(
          (obj) => obj.name === manufacturerName,
        );
        if (manufacturerData) {
          manufacturerId = manufacturerData.id;
        } else {
          const createdManufacturer =
            await this.manufacturersService.createManufacturer(
              manufacturerName,
              shopApiClient,
            );
          manufacturerId = createdManufacturer.id;
        }
        // console.log(
        //   'Test',
        //   manufacturerId,
        //   manufacturerName,
        //   allManufacturersData,
        // );
        return manufacturerId;
      };

      const processedErpProduct: any = {
        productNumber: mainArticle.item_code,
        name: mainArticle.item_name,

        active: mainArticle.active == 0 ? false : true,
        // manufacturerId: await manufacturerId(),

        manufacturer: {
          id: await manufacturerId(shopApiClient),
          // id: '018cca69d31570c7a4bc0e88c0e3d6cb',
        },
        manufacturerNumber: mainArticle.herstellernummer,
        ean: mainArticle.ean,
        stock: mainArticle.anzahl,
        // unit: modifiedProduct.stock_uom, //TODO: check if unit exists. eigentlich nur id
        packUnit: mainArticle.verpackungseinheit,
        packUnitPlural: mainArticle.verpackungseinheit_mehrzahl,
        weight: mainArticle.gewicht,
        width: mainArticle.breite,
        height: mainArticle.höhe,
        length: mainArticle.länge,
        // tags: tags,
        taxId: await this.getStandardTaxInfo(
          mainArticle.item_code,
          shopApiClient,
        ),
        // shop: modifiedProduct.shop_list[0].shop,
        price: [
          {
            currencyId: salesChannelInfo.currencyId,
            gross: shopPrice('main'),
            net: (shopPrice('main') / 119) * 100,
            linked: true,
          },
        ],
        // options: options,
        children: await children(shopApiClient),
        configuratorSettings: await configuratorSettings(),
        // configuratorSettings: (await children(shopApiClient))
        //   ? null
        //   : configuration(),
        description: shopDesc('main'),
        keywords: mainArticle.keywords,
        // cover: modifiedProduct.image,
        // media: modifiedProduct.image + media,
        customFields: {
          br_pim_modified: mainArticle.modified,
        },
      };
      if (mainArticle.uuid !== null) {
        processedErpProduct.id = await this.getUuidByProductNumber(
          mainArticle.item_code,
          shopApiClient,
        );
      } else {
        processedErpProduct.id = parentUuid;
      }

      console.log(processedErpProduct);
      return processedErpProduct;
    } catch (error) {
      console.log(error.response.data.errors[0]);

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
      if (shopProduct) {
        const uuid: string = shopProduct.id;

        return uuid;
      } else {
        return null;
      }
    } catch (error) {
      throw error;
    }
  }
  public async getProductConfiguratorSetting(
    productParentId: string,
    // productId: string,
    optionId: string,
    erpShopId?: string,
  ) {
    try {
      const shopApiClient = await this.createShopApiClientByShopId(erpShopId);

      const responseConfigurator = await shopApiClient.get(
        `/api/product-configurator-setting`,
      );

      let configuratorSettingId = '';
      const productConfiguratorSettingList = responseConfigurator.data.data;

      const parentId = productParentId;
      for (const productConfiguratorSetting of productConfiguratorSettingList) {
        if (
          productConfiguratorSetting.optionId == optionId &&
          productConfiguratorSetting.productId == parentId
        ) {
          configuratorSettingId = productConfiguratorSetting.id;
        }
      }

      return configuratorSettingId;
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
      const erpProduct =
        await this.getProductByProductNumberFromErp(productNumber);
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
      const erpProduct =
        await this.getProductByProductNumberFromErp(productNumber);
      const shopsProduct = [];

      const productShopList = erpProduct.shop_list;

      for (const shop of productShopList) {
        const erpShopId = shop.shop;

        const shopApiClient = await this.createShopApiClientByShopId(erpShopId);

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
        const erpProductComplete = await this.getProductByProductNumberFromErp(
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
        const erpProductComplete = await this.getProductByProductNumberFromErp(
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
      return deletedProducts;
    } catch (error) {
      throw error;
    }
  }

  public async getSalesChannelInfo(erpShopId: string, shopApiClient: any) {
    try {
      const erpShopData = await this.getShopApiDataByShopId(erpShopId);
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
      const response = await shopApiClient.get(`/api/tax`);
      const taxes = await response.data.data;
      for (const tax of taxes) {
        if (tax.position == 1 && tax.name == 'Standard rate') {
          return tax.id;
        }
      }
    } catch (error) {
      throw error;
    }
  }

  // SHOPSERVICE
  async getShopApiClient(shopApiData: any): Promise<AxiosInstance> {
    try {
      const shopApiClient = this.createShopApiClient(shopApiData);
      return shopApiClient;
    } catch (error) {
      throw error;
    }
  }

  async getShopBearerToken(
    shopUrl: string,
    clientId: string,
    clientSecret: string,
  ): Promise<string> {
    const options = {
      method: 'POST',
      url: shopUrl + '/api/oauth/token',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      data: {
        grant_type: 'client_credentials',
        client_id: clientId,
        client_secret: clientSecret,
      },
    };

    try {
      const { data } = await axios.request(options);
      return data.access_token;
    } catch (error) {
      throw error;
    }
  }

  async createShopApiClient(shopApiData: any): Promise<AxiosInstance> {
    try {
      const { shopurl, apikey, apisecret } = shopApiData;

      const token = await this.getShopBearerToken(shopurl, apikey, apisecret);

      const shopApiClient = axios.create({
        baseURL: shopurl,
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      return shopApiClient;
    } catch (error) {
      throw error;
    }
  }
  async createShopApiClientByShopId(erpShopId: string) {
    const shopApiData = await this.getShopApiDataByShopId(erpShopId);
    return this.createShopApiClient(shopApiData);
  }

  async getShopApiDataByShopId(shopId: string): Promise<any> {
    try {
      const response = await erpApiClient.get(`/Shop/${shopId}`);

      const shopApiData = response.data.data;
      return shopApiData;
    } catch (error) {
      throw error;
    }
  }

  async getShopsFromErp() {
    try {
      const response = await erpApiClient.get('/Shop');
      const erpShops = response.data;
      return erpShops;
    } catch (error) {
      throw error;
    }
  }

  async getShopFromErp(shopNumber: string) {
    try {
      const response = await erpApiClient.get(`/Shop/${shopNumber}`);
      const erpShop = response.data.data;
      return erpShop;
    } catch (error) {
      throw error;
    }
  }
}
