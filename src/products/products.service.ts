// products.service.ts
import { Injectable } from '@nestjs/common';
import erpApiClient from '../api/erp-api-client';
import { ManufacturersService } from '../manufacturers/manufacturers.service';
import { PropertiesService } from '../properties/properties.service';
import { UnitsService } from '../units/units.service';
import { TagsService } from '../tags/tags.service';
import { MediaService } from '../media/media.service';
import { ShopsService } from '../shops/shops.service';
import { ConfiguratorSettingsService } from '../configurator-settings/configurator-settings.service';

@Injectable()
export class ProductsService {
  constructor(
    private readonly manufacturersService: ManufacturersService,
    private readonly propertiesService: PropertiesService,
    private readonly unitsService: UnitsService,
    private readonly tagsService: TagsService,
    private readonly mediaService: MediaService,
    private readonly shopsService: ShopsService,
    private readonly configuratorSettingsService: ConfiguratorSettingsService,
  ) {}

  public async getShopProducts(shopApiClient: any) {
    try {
      const response = await shopApiClient.get(`/api/product`);

      const allProductsData = await response.data.data;

      return allProductsData;
    } catch (error) {
      throw error;
    }
  }

  public async getShopProductById(productId: string, shopApiClient: any) {
    const response = await shopApiClient.get(`/api/product/${productId}`);
    const productData = await response.data.data;

    return productData;
  }
  public async getShopProductByProductNumber(
    productNumber: string,
    shopApiClient: any,
  ) {
    try {
      const response = await shopApiClient.get(
        `/api/product?filter[productNumber]=${productNumber}`,
      );
      const productData = response.data.data;
      if (productData.length === 0) {
        return { id: null };
      }
      return productData[0];
    } catch (error) {
      console.log('Shop product not found');
      return { id: null };
    }
  }

  public async deleteShopProduct(productId: string, shopApiClient: any) {
    const response = await shopApiClient.delete(`/api/product/${productId}`);
    const deletedProduct = response.data;

    return deletedProduct;
  }

  public async createShopProduct(
    productData: any,
    shopApiClient: any,
    erpShopId: string,
  ) {
    try {
      const allProductsData = await this.getShopProducts(shopApiClient);
      const shopProduct = allProductsData.find(
        (obj) => obj.productNumber === productData.item_code,
      );
      const data = {
        parentId: (
          await this.getShopProductByProductNumber(
            productData.variant_of,
            shopApiClient,
          )
        ).id,
        manufacturerId: (
          await this.manufacturersService.getOrCreateShopManufacturer(
            productData.brand,
            shopApiClient,
          )
        ).id,
        unitId: (
          await this.unitsService.processPimProductUnit(
            productData,
            shopApiClient,
          )
        ).id,
        /* required */
        taxId: (await this.shopsService.getShopStandardTaxInfo(shopApiClient))
          .id,
        /* required */
        price: [
          {
            currencyId: (
              await this.shopsService.getShopSalesChannelInfo(
                erpShopId,
                shopApiClient,
              )
            ).currencyId,
            gross: await this.getPimProductPrice(productData, erpShopId),
            net:
              ((await this.getPimProductPrice(productData, erpShopId)) / 119) *
              100,
            linked: true,
          },
        ],
        visibilities: await this.processPimProductVisibilities(
          productData,
          erpShopId,
          shopApiClient,
        ),
        /* required */
        productNumber: productData.item_code,
        active: productData.custom_active == 0 ? false : true,
        variantListingConfig: await this.getVariantListingConfig(
          productData,
          shopApiClient,
        ),
        manufacturerNumber: productData.custom_manufacturer_number,
        ean: productData.custom_ean,
        purchaseUnit: productData.custom_purchase_unit,
        referenceUnit: productData.custom_reference_unit,
        markAsTopseller:
          productData.custom_mark_as_topseller == 0 ? false : true,
        weight: productData.custom_weight,
        width: productData.custom_width,
        height: productData.custom_height,
        length: productData.custom_length,
        /* required */
        name: productData.item_name,
        keywords: productData.custom_keywords,
        description: await this.getPimProductDescription(
          productData,
          erpShopId,
        ),
        packUnit: productData.custom_pack_unit,
        packUnitPlural: productData.custom_pack_unit_plural,
        customFields: {
          br_pim_modified: productData.modified,
        },
        availableStock: productData.custom_stock,
        /* required */
        stock: productData.custom_stock,

        ///////////////////
        // RELATIONSHIPS //
        ///////////////////

        children: await this.getChildrenBulk(
          productData,
          erpShopId,
          shopApiClient,
        ),

        configuratorSettings: await this.processPimProductConfiguratorSettings(
          productData,
          shopApiClient,
        ),
        //für parent
        options: await this.propertiesService.processPimProductPropertyOptions(
          productData,
          shopApiClient,
        ), //für children zugehörige option
        properties: await this.propertiesService.processPimProductProperties(
          productData,
          shopProduct,
          shopApiClient,
        ),
        tags: await this.tagsService.processPimProductTags(
          productData,
          shopProduct,
          shopApiClient,
        ),
      };
      // console.log(data);
      // throw 'end of createShopProduct';
      if (shopProduct !== undefined) {
        const response = await shopApiClient.patch(
          `/api/product/${shopProduct.id}?_response=basic`,
          data,
        );

        const updatedProduct = response.data.data;

        return updatedProduct;
      } else {
        const response = await shopApiClient.post(
          '/api/product?_response=basic',
          data,
        );

        const createdProduct = response.data.data;

        return createdProduct;
      }
    } catch (error) {
      console.log(error.response.data);
    }
  }
  public async updateShopProduct(
    shopApiClient: any,
    productId: string,
    productData: any,
  ) {
    try {
      const response = await shopApiClient.patch(
        `/api/product/${productId}?_response=basic`,
        productData,
      );
      const updatedProduct = response.data.data;
      return updatedProduct;
    } catch (error) {
      throw error;
    }
  }
  public async getPimProductPrice(productData: any, erpShopId: string) {
    try {
      for (const shop of productData.custom_assigned_shops) {
        if (shop.shop === erpShopId) {
          return shop.product_price
            ? shop.product_price
            : productData.custom_price;
        }
      }
    } catch (error) {
      console.log('Product price not found');
      return null;
    }
  }
  public async getPimProductDescription(productData: any, erpShopId: string) {
    try {
      for (const shop of productData.custom_assigned_shops) {
        if (shop.shop === erpShopId) {
          return shop.product_description
            ? shop.product_description
            : productData.description;
        }
      }
    } catch (error) {
      console.log('Product description not found');
      return null;
    }
  }
  public async getPimProductShops(productData: any) {
    try {
      const shopsIds = [];
      for (const shop of productData.custom_assigned_shops) {
        shopsIds.push(shop.shop);
      }
      return shopsIds;
    } catch (error) {
      console.log('Product shops not found');
      return null;
    }
  }

  //überprüfen, war nur autovervollständigung
  public async getShopProductParent(productData: any, shopApiClient: any) {
    try {
      const response = await shopApiClient.get(
        `/api/product/${productData.parentId}`,
      );
      const parentProduct = response.data.data;
      return parentProduct;
    } catch (error) {
      console.log('Parent shop product not found');
      return null;
    }
  }

  public async getPimProductParent(productData: any) {
    try {
      const response = await erpApiClient.get(
        `/Item/${productData.variant_of}`,
      );
      const parentProduct = response.data.data;
      return parentProduct;
    } catch (error) {
      console.log('Parent pim product not found');
      return null;
    }
  }
  public async getPimProducts() {
    try {
      const response = await erpApiClient.get('/Item');
      const pimProducts = response.data.data;
      return pimProducts;
    } catch (error) {
      throw error;
    }
  }
  public async getPimProductByName(productName: string) {
    try {
      const response = await erpApiClient.get(`/Item/${productName}`);
      const pimProduct = response.data.data;
      return pimProduct;
    } catch (error) {
      throw error;
    }
  }

  public async processPimProductConfiguratorSettings(
    productData: any,
    shopApiClient: any,
  ) {
    //return optionIds oder configuratorSettingIds
    try {
      const shopProductPropertyOptions: any = [];
      if (productData.has_variants === 1) {
        const pimProducts = await this.getPimProducts();

        for (const item of pimProducts) {
          const variantPimProduct = await this.getPimProductByName(item.name);

          if (variantPimProduct.variant_of === productData.item_code) {
            const shopProduct = await this.getShopProductByProductNumber(
              productData.item_code,
              shopApiClient,
            );

            for (const attribute of variantPimProduct.attributes) {
              const option: any =
                await this.propertiesService.getShopProductPropertyOption(
                  attribute,
                  shopApiClient,
                );
              if (shopProduct && option) {
                const configuratorSetting: any =
                  await this.configuratorSettingsService.getShopProductConfiguratorSettingByOptionId(
                    shopProduct.id,
                    option.id,
                    shopApiClient,
                  );
                if (configuratorSetting) {
                  shopProductPropertyOptions.push({
                    id: configuratorSetting.id,
                    optionId: option.id,
                  });
                } else {
                  shopProductPropertyOptions.push({
                    optionId: option.id,
                  });
                }
              } else {
                shopProductPropertyOptions.push({
                  optionId: option.id,
                });
              }
            }
          }
        }
        return shopProductPropertyOptions;
      }
    } catch (error) {
      console.log('Configurator Settings not found');
      return null;
    }
  }
  public async getChildrenBulk(
    productData: any,
    erpShopId: string,
    shopApiClient: any,
  ) {
    try {
      const pimProducts = await this.getPimProducts();
      const children = [];
      for (const item of pimProducts) {
        const variantPimProduct = await this.getPimProductByName(item.name);
        if (variantPimProduct.variant_of === productData.item_code) {
          const shopProduct = await this.getShopProductByProductNumber(
            variantPimProduct.item_code,
            shopApiClient,
          );
          const child = {
            id: (
              await this.getShopProductByProductNumber(
                variantPimProduct.item_code,
                shopApiClient,
              )
            ).id,
            price: [
              {
                currencyId: (
                  await this.shopsService.getShopSalesChannelInfo(
                    erpShopId,
                    shopApiClient,
                  )
                ).currencyId,
                gross: await this.getPimProductPrice(
                  variantPimProduct,
                  erpShopId,
                ),
                net:
                  ((await this.getPimProductPrice(
                    variantPimProduct,
                    erpShopId,
                  )) /
                    119) *
                  100,
                linked: true,
              },
            ],
            productNumber: variantPimProduct.name,
            active: variantPimProduct.custom_active == 0 ? false : true,
            manufacturerNumber: variantPimProduct.custom_manufacturer_number,
            ean: variantPimProduct.custom_ean,
            purchaseUnit: variantPimProduct.custom_purchase_unit,
            // referenceUnit: variantPimProduct.custom_reference_unit,
            markAsTopseller:
              variantPimProduct.custom_mark_as_topseller == 0 ? false : true,
            weight: variantPimProduct.custom_weight,
            width: variantPimProduct.custom_width,
            height: variantPimProduct.custom_height,
            length: variantPimProduct.custom_length,
            name: variantPimProduct.item_name,
            keywords: variantPimProduct.custom_keywords,
            description: variantPimProduct.description,
            // packUnit: variantPimProduct.custom_pack_unit,
            // packUnitPlural: variantPimProduct.custom_pack_unit_plural,
            customFields: {
              br_pim_modified: variantPimProduct.modified,
            },
            availableStock: variantPimProduct.custom_stock,
            stock: variantPimProduct.custom_stock,
            options:
              await this.propertiesService.processPimProductPropertyOptions(
                variantPimProduct,
                shopApiClient,
              ),
            tags: await this.tagsService.processPimProductTags(
              variantPimProduct,
              shopProduct,
              shopApiClient,
            ),
          };
          children.push(child);
        }
      }
      return children;
    } catch (error) {
      console.log('Children not found');
      return null;
    }
  }

  public async processPimProductVisibilities(
    productData: any,
    erpShopId: string,
    shopApiClient: any,
  ) {
    try {
      const shopProduct = await this.getShopProductByProductNumber(
        productData.item_code,
        shopApiClient,
      );

      if (shopProduct.id !== null) {
        const shopProductVisibilitiesResponse = await shopApiClient.get(
          `/api/product/${shopProduct.id}/visibilities`,
        );
        const shopProductVisibilities =
          shopProductVisibilitiesResponse.data.data;

        const salesChannel = await this.shopsService.getShopSalesChannelInfo(
          erpShopId,
          shopApiClient,
        );
        for (const shopProductVisibility of shopProductVisibilities) {
          if (shopProductVisibility.salesChannelId === salesChannel.id) {
            return [
              {
                id: shopProductVisibility.id,
                salesChannelId: salesChannel.id,
                visibility: shopProductVisibility.visibility,
              },
            ];
          } else {
            return [
              {
                salesChannelId: salesChannel.id,
                visibility: 30,
              },
            ];
          }
        }
      } else {
        const salesChannel = await this.shopsService.getShopSalesChannelInfo(
          erpShopId,
          shopApiClient,
        );
        return [
          {
            salesChannelId: salesChannel.id,
            visibility: 30,
          },
        ];
      }
    } catch (error) {
      console.log('Visibilities not found');
      return null;
    }
  }

  public async getVariantListingConfig(productData: any, shopApiClient: any) {
    try {
      if (productData.has_variants === 1) {
        const shopProduct = await this.getShopProductByProductNumber(
          productData.item_code,
          shopApiClient,
        );
        if (shopProduct.id !== null) {
          return {
            displayParent: shopProduct.variantListingConfig.displayParent,
            mainVariantId: shopProduct.variantListingConfig.mainVariantId,
            configuratorGroupConfig:
              shopProduct.variantListingConfig.configuratorGroupConfig,
          };
        } else {
          return {
            displayParent: true,
            mainVariantId: null,
          };
        }
      }
    } catch (error) {
      console.log('Variant Listing Config not found');
      return null;
    }
  }
  public async createShopProductMedia(
    pimProduct: any,
    shopApiClient: any,
    erpShopId: string,
  ) {
    try {
      const shopProduct = await this.getShopProductByProductNumber(
        pimProduct.item_code,
        shopApiClient,
      );
      const media = await this.mediaService.processPimProductMedia(
        pimProduct,
        shopProduct,
        erpShopId,
        shopApiClient,
      );
      return media;
    } catch (error) {
      console.log('Media not found');
      return null;
    }
  }
  public async getModifiedProducts(erpShopId: string, shopApiClient: any) {
    try {
      const response = await erpApiClient.get('/Item');
      const pimProducts = response.data.data;

      const modifiedProducts: any = [];
      for (const pimProduct of pimProducts) {
        const pimProductComplete = await this.getPimProductByName(
          pimProduct.name,
        );

        const response = await shopApiClient.get(
          `/api/product?filter[productNumber]=${pimProduct.name}`,
        );
        const shopProduct = response.data.data[0];

        pimProductComplete.uuid =
          shopProduct != undefined ? shopProduct.id : null;

        const assignedShop = pimProductComplete.custom_assigned_shops.some(
          (objekt) => objekt.shop === erpShopId,
        );

        if (
          (shopProduct == undefined ||
            pimProductComplete.modified !==
              shopProduct?.customFields?.br_pim_modified) &&
          assignedShop
        ) {
          modifiedProducts.push(pimProductComplete.name);
        }
      }
      return modifiedProducts;
    } catch (error) {
      throw error;
    }
  }

  public async getModifiedMainProducts(erpShopId: string, shopApiClient: any) {
    try {
      const response = await erpApiClient.get('/Item');
      const pimProducts = response.data.data;

      const modifiedMainProducts: Set<string> = new Set();
      for (const pimProduct of pimProducts) {
        let pimProductComplete = await this.getPimProductByName(
          pimProduct.name,
        );

        const response = await shopApiClient.get(
          `/api/product?filter[productNumber]=${pimProduct.name}`,
        );

        const shopProduct = response.data.data[0];
        if (
          shopProduct === undefined ||
          pimProductComplete.modified !==
            shopProduct?.customFields?.br_pim_modified
        ) {
          if (pimProductComplete.variant_of) {
            pimProductComplete = await this.getPimProductByName(
              pimProductComplete.variant_of,
            );
          }
          pimProductComplete.uuid =
            shopProduct !== undefined ? shopProduct.id : null;

          const assignedShop = pimProductComplete.custom_assigned_shops.find(
            (objekt) => objekt.shop === erpShopId,
          );

          if (assignedShop) {
            modifiedMainProducts.add(pimProductComplete.name);
          }
        }
      }
      return Array.from(modifiedMainProducts);
    } catch (error) {
      throw error;
    }
  }
}
