// products.service.ts
import { Injectable } from '@nestjs/common';
import erpApiClient from '../api/erp-api-client';
// import { ShopsService } from '../shops/shops.service';
import axios, { AxiosInstance } from 'axios';
import { ManufacturersService } from '../manufacturers/manufacturers.service';
import { PropertiesService } from '../properties/properties.service';
import { UnitsService } from '../units/units.service';
import { TagsService } from '../tags/tags.service';
import { MediaService } from '../media/media.service';
import { v5 as uuidv5 } from 'uuid';
import * as fs from 'fs';
//TODO:
//1. Media und Tags
//2. mehr Produkteigenschaften mappen
//3. mehrere alle Shops syncen
// interface ShopApiClient {
//   get(path: string): Promise<any>;
//   post(path: string, data: any): Promise<any>;
// }

@Injectable()
export class ProductsService {
  constructor(
    private readonly manufacturersService: ManufacturersService,
    private readonly propertiesService: PropertiesService,
    private readonly unitsService: UnitsService,
    private readonly tagsService: TagsService,
    private readonly mediaService: MediaService,
  ) {}

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
      // const shopPrice = (type: string) => {
      //   const shops = type === 'main' ? mainArticle : modifiedProduct;

      //   for (const shop of shops.custom_assigned_shops) {
      //     if (shop.shop === erpShopId) {
      //       return shop.product_price || shops.price;
      //     }
      //   }
      // };

      // const shopDesc = (type: string) => {
      //   const shops = type === 'main' ? mainArticle : modifiedProduct;

      //   for (const shop of shops.custom_assigned_shops) {
      //     if (shop.shop === erpShopId) {
      //       return shop.product_description || shops.description;
      //     }
      //   }
      // };

      const shopPrice = (type: string) => {
        if (type == 'main') {
          for (const shop of mainArticle.custom_assigned_shops) {
            if (shop.shop === erpShopId) {
              if (shop.product_price) {
                return shop.product_price;
              } else {
                return mainArticle.custom_price;
              }
            }
          }
        } else if (type == 'child') {
          for (const shop of modifiedProduct.custom_assigned_shops) {
            if (shop.shop === erpShopId) {
              if (shop.product_price) {
                return shop.product_price;
              } else {
                return modifiedProduct.custom_price;
              }
            }
          }
        }
      };
      const shopDesc = (type: string) => {
        if (type == 'main') {
          for (const shop of mainArticle.custom_assigned_shops) {
            if (shop.shop === erpShopId) {
              if (shop.product_description) {
                return shop.product_description;
              } else {
                return mainArticle.description;
              }
            }
          }
        } else if (type == 'child') {
          for (const shop of modifiedProduct.custom_assigned_shops) {
            if (shop.shop === erpShopId) {
              if (shop.product_description) {
                return shop.product_description;
              } else {
                return modifiedProduct.description;
              }
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
          const tagArr = [
            modifiedProduct.custom_frost_warning,
            modifiedProduct.custom_bucket,
            modifiedProduct.custom_floor,
            modifiedProduct.custom_hauler,
            modifiedProduct.custom_bulk,
            modifiedProduct.custom_vegan,
            modifiedProduct.custom_no_discount,
          ];

          const child = [
            {
              id: await this.getUuidByProductNumber(
                modifiedProduct.item_code,
                shopApiClient,
              ),
              price: [
                {
                  currencyId: salesChannelInfo.currencyId,
                  gross: shopPrice('child'),
                  net: (shopPrice('child') / 119) * 100,
                  linked: true,
                },
              ],
              productNumber: modifiedProduct.item_code,
              active: modifiedProduct.custom_active == 0 ? false : true,
              purchaseUnit:
                modifiedProduct.custom_purchase_unit !== 0
                  ? modifiedProduct.custom_purchase_unit
                  : null,
              weight:
                modifiedProduct.custom_weight !== 0
                  ? modifiedProduct.custom_weight
                  : null,
              width:
                modifiedProduct.custom_width !== 0
                  ? modifiedProduct.custom_width
                  : null,
              height:
                modifiedProduct.custom_height !== 0
                  ? modifiedProduct.custom_height
                  : null,
              length:
                modifiedProduct.custom_length !== 0
                  ? modifiedProduct.custom_length
                  : null,
              options: options,
              description: shopDesc('child'),
              customFields: {
                br_pim_modified: modifiedProduct.modified,
              },
              stock: modifiedProduct.custom_stock,
              tags: tagArr.includes(1)
                ? await tags(shopApiClient, modifiedProduct)
                : null,
            },
          ];
          return child;
        } else {
          return null;
        }
      };

      const manufacturer: any = async (shopApiClient) => {
        let manufacturer: any = null;
        const manufacturerName = mainArticle.brand;
        const allManufacturersData =
          await this.manufacturersService.getShopManufacturers(shopApiClient);
        const manufacturerData = allManufacturersData.find(
          (obj) => obj.name === manufacturerName,
        );
        if (manufacturerData) {
          manufacturer = manufacturerData;
        } else {
          const createdManufacturer =
            await this.manufacturersService.createShopManufacturer(
              manufacturerName,
              shopApiClient,
            );
          manufacturer = createdManufacturer;
        }
        return manufacturer;
      };
      const unit: any = async (shopApiClient) => {
        let unit: any = null;
        const unitName = mainArticle.stock_uom;
        const pimUnitData =
          await this.unitsService.getPimUnitDataByUnitName(unitName);
        let unitShortCode = null;
        if (!pimUnitData.custom_uom_short_code) {
          unitShortCode = 'NA';
        } else {
          unitShortCode = pimUnitData.custom_uom_short_code;
        }

        const allUnitsData =
          await this.unitsService.getShopUnits(shopApiClient);
        const unitData = allUnitsData.find((obj) => obj.name === unitName);
        if (unitData) {
          unit = unitData;
        } else {
          const createdUnit = await this.unitsService.createShopUnit(
            unitShortCode,
            unitName,
            shopApiClient,
          );
          unit = createdUnit;
        }
        return unit;
      };

      const properties: any = async (shopApiClient) => {
        const shopProductPropertyList: any = [];
        const pimProductPropertyIds: any = [];
        const pimProductPropertiesAssignments: any =
          mainArticle.custom_properties;
        const shopProduct = await this.getProductFromShop(
          modifiedProduct.item_code,
          shopApiClient,
        );
        for (const pimProductPropertyAssignment of pimProductPropertiesAssignments) {
          const shopPropertyGroupData =
            await this.propertiesService.getShopPropertyGroupByName(
              shopApiClient,
              pimProductPropertyAssignment.property,
            );

          if (shopPropertyGroupData != null) {
            const shopPropertyGroupOptionData =
              await this.propertiesService.getShopPropertyGroupOptionByName(
                shopApiClient,
                pimProductPropertyAssignment.property_value,
                shopPropertyGroupData.id,
              );
            if (shopPropertyGroupOptionData != null) {
              const shopPropertyOption = {
                id: shopPropertyGroupOptionData.id,
                name: shopPropertyGroupOptionData.name,
                groupId: shopPropertyGroupOptionData.groupId,
              };

              shopProductPropertyList.push(shopPropertyOption);
              pimProductPropertyIds.push(shopPropertyGroupOptionData.id);
            } else {
              const createdPropertyGroupOption =
                await this.propertiesService.createShopPropertyGroupOptionByGroupId(
                  shopApiClient,
                  pimProductPropertyAssignment.property_value,
                  shopPropertyGroupData.id,
                );

              const shopPropertyOption = {
                id: createdPropertyGroupOption.id,
                name: createdPropertyGroupOption.name,
                groupId: createdPropertyGroupOption.groupId,
              };
              shopProductPropertyList.push(shopPropertyOption);
            }
          } else {
            const createdPropertyGroup =
              await this.propertiesService.createShopPropertyGroup(
                pimProductPropertyAssignment.property,
                shopApiClient,
              );

            const createdPropertyGroupOption =
              await this.propertiesService.createShopPropertyGroupOptionByGroupId(
                shopApiClient,
                pimProductPropertyAssignment.property_value,
                createdPropertyGroup.id,
              );

            const shopPropertyOption = {
              id: createdPropertyGroupOption.id,
              name: createdPropertyGroupOption.name,
              groupId: createdPropertyGroup.id,
            };
            shopProductPropertyList.push(shopPropertyOption);
          }
        }

        for (const shopProductPropertyId of shopProduct.propertyIds) {
          if (
            !pimProductPropertyIds.includes(shopProductPropertyId) &&
            shopProduct.parentId == null
          ) {
            await this.removePropertiesFromProduct(
              shopApiClient,
              shopProduct.id,
              shopProductPropertyId,
            );
          }
        }

        return shopProductPropertyList;
      };

      const tags: any = async (shopApiClient: any, productType: any) => {
        const shopProductTagList: any = [];
        const pimProductTagsAssignments: any = {
          frostWarning: productType.custom_frost_warning,
          bucket: productType.custom_bucket,
          floor: productType.custom_floor,
          hauler: productType.custom_hauler,
          bulk: productType.custom_bulk,
          vegan: productType.custom_vegan,
          noDiscount: productType.custom_no_discount,
        };
        const shopProduct = await this.getProductFromShop(
          modifiedProduct.item_code,
          shopApiClient,
        );

        for (const pimProductTagAssignment in pimProductTagsAssignments) {
          const tagData: any = await this.tagsService.getShopTagByName(
            shopApiClient,
            pimProductTagAssignment,
          );

          if (pimProductTagsAssignments[pimProductTagAssignment] == 1) {
            if (tagData !== null) {
              const tagInfo = {
                id: tagData.id,
                name: tagData.name,
              };
              shopProductTagList.push(tagInfo);
              continue;
            } else {
              const createdTag = await this.tagsService.createShopTag(
                pimProductTagAssignment,
                shopApiClient,
              );
              const tagInfo = {
                id: createdTag.id,
                name: createdTag.name,
              };

              shopProductTagList.push(tagInfo);
              continue;
            }
          } else if (
            pimProductTagsAssignments[pimProductTagAssignment] == 0 &&
            tagData &&
            shopProduct &&
            shopProduct.tagIds &&
            shopProduct.tagIds.includes(tagData.id)
          ) {
            await this.removeTagsFromProduct(
              shopApiClient,
              shopProduct.id,
              tagData.id,
            );
          }
        }

        return shopProductTagList;
      };

      const media: any = async (shopApiClient: any, productType: any) => {
        /**
         * 1 Medien Entität erstellen, die dem Produkt zugeordnet wird
         * 2 Image der Medienentität hinzufügen
         */
        const shopProductMediaList: any = [];
        const pimProductMediaAssignments: any = {
          coverImage: productType.image,
          image01: productType.custom_attachimg01,
          image02: productType.custom_attachimg02,
          image03: productType.custom_attachimg03,
          image04: productType.custom_attachimg04,
          image05: productType.custom_attachimg05,
          image06: productType.custom_attachimg06,
          image07: productType.custom_attachimg07,
          image08: productType.custom_attachimg08,
        };

        const shopProduct = await this.getProductFromShop(
          modifiedProduct.item_code,
          shopApiClient,
        );

        for (const pimProductMediaAssignment in pimProductMediaAssignments) {
          const productMediaId = uuidv5(
            pimProductMediaAssignments[pimProductMediaAssignment],
            '1b671a64-40d5-491e-99b0-da01ff1f3341',
          ).replace(/-/g, '');
          const mediaId = uuidv5(
            productMediaId,
            '1b671a64-40d5-491e-99b0-da01ff1f3341',
          ).replace(/-/g, '');
          const mediaData: any = await this.mediaService.getShopMediaById(
            mediaId,
            shopApiClient,
          );

          if (pimProductMediaAssignments[pimProductMediaAssignment] != null) {
            if (mediaData != null) {
              const mediaInfo = {
                id: mediaData.id,
                //         name: mediaData.name,
              };
              shopProductMediaList.push(mediaInfo);
              continue;
            } else {
              if (
                pimProductMediaAssignments.hasOwnProperty(
                  pimProductMediaAssignment,
                )
              ) {
                const imgIndex =
                  Object.keys(pimProductMediaAssignments).indexOf(
                    pimProductMediaAssignment,
                  ) + 1;
                const createdAssociation =
                  await this.mediaService.createProductMediaAssociation(
                    productMediaId,
                    shopProduct.id,
                    mediaId,
                    imgIndex,
                    shopApiClient,
                  );

                shopProductMediaList.push(mediaId);
              }

              await this.mediaService.attachMediaRessourceToMediaObject(
                mediaId,
                pimProductMediaAssignments[pimProductMediaAssignment],
                erpShopId,
              );
            }
            //   } else if (
            //     pimProductMediaAssignments[pimProductMediaAssignment] == null &&
            //     mediaData &&
            //     shopProduct &&
            //     shopProduct.mediaIds &&
            //     shopProduct.mediaIds.includes(mediaData.id)
            //   ) {
            //     await this.removeMediaFromProduct(
            //       shopApiClient,
            //       shopProduct.id,
            //       mediaData.id,
            //     );
          }
        }

        return shopProductMediaList;
      };
      const processedErpProduct: any = {
        ////////////////
        // ATTRIBUTES //
        ////////////////

        // parentId
        manufacturerId: (await manufacturer(shopApiClient)).id,
        unitId: (await unit(shopApiClient)).id,
        taxId: await this.getStandardTaxInfo(
          mainArticle.item_code,
          shopApiClient,
        ),
        // coverId
        price: [
          {
            currencyId: salesChannelInfo.currencyId,
            gross: shopPrice('main'),
            net: (shopPrice('main') / 119) * 100,
            linked: true,
          },
        ],
        productNumber: mainArticle.item_code,
        active: mainArticle.custom_active == 0 ? false : true,
        manufacturerNumber: mainArticle.custom_manufacturer_number,
        ean: mainArticle.custom_ean,
        purchaseUnit: mainArticle.custom_purchase_unit,
        referenceUnit: mainArticle.custom_reference_unit,
        markAsTopseller:
          mainArticle.custom_mark_as_topseller == 0 ? false : true,
        weight: mainArticle.custom_weight,
        width: mainArticle.custom_width,
        height: mainArticle.custom_height,
        length: mainArticle.custom_length,
        // metaDescription
        name: mainArticle.item_name,
        keywords: mainArticle.keywords,
        description: shopDesc('main'),
        // metaTitle
        packUnit: mainArticle.custom_pack_unit,
        packUnitPlural: mainArticle.custom_pack_unit_plural,
        customFields: {
          br_pim_modified: mainArticle.modified,
        },
        availableStock: mainArticle.custom_stock,
        stock: mainArticle.custom_stock,

        ///////////////////
        // RELATIONSHIPS //
        ///////////////////

        children: await children(shopApiClient),
        // coverId: await coverId(),
        // media: await media(shopApiClient, mainArticle),
        configuratorSettings: await configuratorSettings(),
        properties: await properties(shopApiClient),
        tags: await tags(shopApiClient, mainArticle),
      };
      if (mainArticle.uuid !== null) {
        processedErpProduct.id = await this.getUuidByProductNumber(
          mainArticle.item_code,
          shopApiClient,
        );
      } else {
        processedErpProduct.id = parentUuid;
      }
      console.log(shopApiClient, mainArticle);
      if (shopApiClient && mainArticle) {
        await media(shopApiClient, mainArticle);
      } else {
        console.log('shopApiClient oder mainArticle ist undefined');
      }

      console.log('WEITER', processedErpProduct);
      return processedErpProduct;
    } catch (error) {
      console.log('FEHLER, mein Lieber', error.response.data);
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
    // productsBulk.forEach((product) => {
    //   console.log(product);
    // });
    // throw new Error('test');

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
      const propertyValue =
        await this.propertiesService.getOrCreatePropertyGroupAndValue(
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

      const productShopList = erpProduct.custom_assigned_shops;

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

        const assignedShop = erpProductComplete.custom_assigned_shops.some(
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
        const assignedShop = erpProductComplete.custom_assigned_shops.some(
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
        if (salesChannel.id === erpShopData.storefrontid) {
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

  public async removeTagsFromProduct(
    shopApiClient: any,
    productId: string,
    tagId: string,
  ): Promise<any> {
    const response = await shopApiClient.delete(
      `/api/product/${productId}/tags/${tagId}`,
    );
    return response;
  }

  // TODO Hier weitermachen

  public async removePropertiesFromProduct(
    shopApiClient: any,
    productId: string,
    propertyId: string,
  ): Promise<any> {
    const response = await shopApiClient.delete(
      `/api/product/${productId}/properties/${propertyId}`,
    );
    return response;
  }

  // SHOPSERVICE
  async getShopApiFileClient(shopApiData: any): Promise<AxiosInstance> {
    try {
      const shopApiFileClient = this.createShopApiFileClient(shopApiData);
      return shopApiFileClient;
    } catch (error) {
      throw error;
    }
  }
  async createShopApiFileClient(shopApiData: any): Promise<AxiosInstance> {
    try {
      const { shopurl, apikey, apisecret } = shopApiData;

      const token = await this.getShopBearerToken(shopurl, apikey, apisecret);

      const shopApiFileClient = axios.create({
        baseURL: shopurl,
        headers: {
          Accept: 'application/json',
          'Content-Type': 'image/jpg',
          Authorization: `Bearer ${token}`,
          extension: 'jpg',
        },
      });

      return shopApiFileClient;
    } catch (error) {
      throw error;
    }
  }
  async createShopApiFileClientByShopId(erpShopId: string) {
    const shopApiData = await this.getShopApiDataByShopId(erpShopId);
    return this.createShopApiFileClient(shopApiData);
  }

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
      const response = await erpApiClient.get(`/Item%20Shop/${shopId}`);

      const shopApiData = response.data.data;
      return shopApiData;
    } catch (error) {
      throw error;
    }
  }

  async getShopsFromErp() {
    try {
      const response = await erpApiClient.get('/Item%20Shop');
      const erpShops = response.data;
      return erpShops;
    } catch (error) {
      throw error;
    }
  }

  async getShopFromErp(shopNumber: string) {
    try {
      const response = await erpApiClient.get(`/Item%20Shop/${shopNumber}`);
      const erpShop = response.data.data;
      return erpShop;
    } catch (error) {
      throw error;
    }
  }
  //TODO SEHR WICHTIG
  async patchShopProduct(shopApiClient: any, productId: string, data: any) {
    try {
      const response = await shopApiClient.patch(
        `/api/product/${productId}`,
        data,
      );
      const shopProduct = response.data.data;
      return shopProduct;
    } catch (error) {
      throw error;
    }
  }
}
