import { Injectable } from '@nestjs/common';
import pimApiClient from '../api/pim-api-client';
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

      const allShopProductsData = await response.data.data;

      return allShopProductsData;
    } catch (error) {
      throw error;
    }
  }

  public async getShopProductById(productId: string, shopApiClient: any) {
    const response = await shopApiClient.get(`/api/product/${productId}`);
    const shopProduct = await response.data.data;

    return shopProduct;
  }

  public async getShopProductByProductNumber(
    productNumber: string,
    shopApiClient: any,
  ) {
    try {
      const response = await shopApiClient.get(
        `/api/product?filter[productNumber]=${productNumber}`,
      );
      const shopProduct = response.data.data;
      if (shopProduct.length === 0) {
        return { id: null };
      }
      return shopProduct[0];
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

  public async removeShopProduct(
    shopProduct: any,
    pimProduct: any,
    // pimShopId: string,
    shopApiClient: any,
  ) {
    try {
      if (shopProduct !== undefined) {
        //wenn keiner der pimProduct.custom_assigned_shops.shop === pimShopId ist, dann lösche das Produkt
        const existingShops = [];
        for (const shop of pimProduct.custom_assigned_shops) {
          const shopExists = await this.shopsService.getShopSalesChannelInfo(
            shop.shop,
            shopApiClient,
          );
          existingShops.push(shopExists);
        }
        if (existingShops.length === 0) {
          return this.deleteShopProduct(shopProduct.id, shopApiClient);
        }
      }
    } catch (error) {
      console.log('Shop product not found');
      return null;
    }
  }

  public async createShopProduct(
    pimProduct: any,
    pimShopId: string,
    shopApiClient: any,
  ) {
    try {
      const allShopProductsData = await this.getShopProducts(shopApiClient);
      const shopProduct = allShopProductsData.find(
        (obj) => obj.productNumber === pimProduct.item_code,
      );
      const data = {
        parentId: (
          await this.getShopProductByProductNumber(
            pimProduct.variant_of,
            shopApiClient,
          )
        ).id,
        manufacturerId: (
          await this.manufacturersService.getOrCreateShopManufacturer(
            pimProduct.brand,
            shopApiClient,
          )
        ).id,
        unitId: (
          await this.unitsService.processPimProductUnit(
            pimProduct,
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
                pimShopId,
                shopApiClient,
              )
            ).currencyId,
            gross: await this.getPimProductPrice(pimProduct, pimShopId),
            net:
              ((await this.getPimProductPrice(pimProduct, pimShopId)) / 119) *
              100,
            linked: true,
          },
        ],
        visibilities: await this.shopsService.processPimProductVisibilities(
          shopProduct,
          pimProduct,
          pimShopId,
          shopApiClient,
        ),
        /* required */
        productNumber: pimProduct.item_code,
        active: pimProduct.custom_active == 0 ? false : true,
        variantListingConfig: await this.getVariantListingConfig(
          pimProduct,
          shopApiClient,
        ),
        manufacturerNumber: pimProduct.custom_manufacturer_number,
        ean: pimProduct.custom_ean,
        purchaseUnit: pimProduct.custom_purchase_unit,
        referenceUnit: pimProduct.custom_reference_unit,
        markAsTopseller:
          pimProduct.custom_mark_as_topseller == 0 ? false : true,
        weight: pimProduct.custom_weight,
        width: pimProduct.custom_width,
        height: pimProduct.custom_height,
        length: pimProduct.custom_length,
        /* required */
        name: pimProduct.item_name,
        keywords: pimProduct.custom_keywords,
        description: await this.getPimProductDescription(pimProduct, pimShopId),
        packUnit: pimProduct.custom_pack_unit,
        packUnitPlural: pimProduct.custom_pack_unit_plural,
        customFields: {
          br_pim_modified: pimProduct.modified,
        },
        availableStock: pimProduct.custom_stock,
        /* required */
        stock: pimProduct.custom_stock,

        ///////////////////
        // RELATIONSHIPS //
        ///////////////////

        children: await this.getChildrenBulk(
          pimProduct,
          pimShopId,
          shopApiClient,
        ),

        configuratorSettings: await this.processPimProductConfiguratorSettings(
          pimProduct,
          shopApiClient,
        ),
        options: await this.propertiesService.processPimProductPropertyOptions(
          pimProduct,
          shopApiClient,
        ),
        properties: await this.propertiesService.processPimProductProperties(
          pimProduct,
          shopProduct,
          shopApiClient,
        ),
        tags: await this.tagsService.processPimProductTags(
          pimProduct,
          shopProduct,
          shopApiClient,
        ),
      };
      await this.shopsService.removeShopProductVisibilities(
        shopProduct,
        pimProduct,
        pimShopId,
        shopApiClient,
      );
      await this.mediaService.removeShopProductMedia(
        shopProduct,
        pimProduct,
        shopApiClient,
      );
      // await this.removeShopProduct(shopProduct, pimProduct, shopApiClient);

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
      //console.log(error.response.data);
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

  public async getPimProductPrice(pimProduct: any, pimShopId: string) {
    try {
      for (const shop of pimProduct.custom_assigned_shops) {
        if (shop.shop === pimShopId) {
          return shop.product_price
            ? shop.product_price
            : pimProduct.custom_price;
        }
      }
    } catch (error) {
      console.log('Product price not found');
      return null;
    }
  }

  public async getPimProductDescription(pimProduct: any, pimShopId: string) {
    try {
      for (const shop of pimProduct.custom_assigned_shops) {
        if (shop.shop === pimShopId) {
          return shop.product_description
            ? shop.product_description
            : pimProduct.description;
        }
      }
    } catch (error) {
      console.log('Product description not found');
      return null;
    }
  }

  public async getPimProductShops(pimProduct: any) {
    try {
      const shopsIds = [];
      for (const shop of pimProduct.custom_assigned_shops) {
        shopsIds.push(shop.shop);
      }
      return shopsIds;
    } catch (error) {
      console.log('Product shops not found');
      return null;
    }
  }

  public async getShopProductParent(pimProduct: any, shopApiClient: any) {
    try {
      const response = await shopApiClient.get(
        `/api/product/${pimProduct.variant_of}`,
      );
      const parentProduct = response.data.data;
      return parentProduct;
    } catch (error) {
      console.log('Parent shop product not found');
      return null;
    }
  }

  public async getPimProductParent(pimProduct: any) {
    try {
      const response = await pimApiClient.get(`/Item/${pimProduct.variant_of}`);
      const parentProduct = response.data.data;
      return parentProduct;
    } catch (error) {
      console.log('Parent pim product not found');
      return null;
    }
  }

  public async getPimProducts() {
    try {
      const response = await pimApiClient.get('/Item');
      const pimProducts = response.data.data;
      return pimProducts;
    } catch (error) {
      throw error;
    }
  }

  public async getPimProductByName(productName: string) {
    try {
      const response = await pimApiClient.get(`/Item/${productName}`);
      const pimProduct = response.data.data;
      return pimProduct;
    } catch (error) {
      throw error;
    }
  }

  public async processPimProductConfiguratorSettings(
    pimProduct: any,
    shopApiClient: any,
  ) {
    try {
      const shopProductPropertyOptions: any = [];
      if (pimProduct.has_variants === 1) {
        const pimProducts = await this.getPimProducts();

        for (const item of pimProducts) {
          const variantPimProduct = await this.getPimProductByName(item.name);

          if (variantPimProduct.variant_of === pimProduct.item_code) {
            const shopProduct = await this.getShopProductByProductNumber(
              pimProduct.item_code,
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
    pimProduct: any,
    pimShopId: string,
    shopApiClient: any,
  ) {
    try {
      const pimProducts = await this.getPimProducts();
      const children = [];
      for (const item of pimProducts) {
        const variantPimProduct = await this.getPimProductByName(item.name);
        if (variantPimProduct.variant_of === pimProduct.item_code) {
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
                    pimShopId,
                    shopApiClient,
                  )
                ).currencyId,
                gross: await this.getPimProductPrice(
                  variantPimProduct,
                  pimShopId,
                ),
                net:
                  ((await this.getPimProductPrice(
                    variantPimProduct,
                    pimShopId,
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

  public async getVariantListingConfig(pimProduct: any, shopApiClient: any) {
    try {
      if (pimProduct.has_variants === 1) {
        const shopProduct = await this.getShopProductByProductNumber(
          pimProduct.item_code,
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
    pimShopId: string,
    shopApiClient: any,
  ) {
    try {
      const shopProduct = await this.getShopProductByProductNumber(
        pimProduct.item_code,
        shopApiClient,
      );
      const media = await this.mediaService.processPimProductMedia(
        pimProduct,
        shopProduct,
        pimShopId,
        shopApiClient,
      );
      return media;
    } catch (error) {
      console.log('Media not found');
      return null;
    }
  }

  public async getModifiedProducts(pimShopId: string, shopApiClient: any) {
    try {
      const response = await pimApiClient.get('/Item');
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
          (objekt) => objekt.shop === pimShopId,
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

  public async getModifiedMainProducts(pimShopId: string, shopApiClient: any) {
    try {
      const response = await pimApiClient.get('/Item');
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
            (objekt) => objekt.shop === pimShopId,
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

  public async getModifiedProduct(pimProduct: any, shopApiClient: any) {
    try {
      const response = await shopApiClient.get(
        `/api/product?filter[productNumber]=${pimProduct.item_code}`,
      );
      const shopProduct = response.data.data[0];
      if (
        shopProduct === undefined ||
        pimProduct.modified !== shopProduct?.customFields?.br_pim_modified
      ) {
        return true;
      }
      return false;
    } catch (error) {
      throw error;
    }
  }

  public async getPimShopProducts(pimShopId: string, shopApiClient: any) {
    try {
      const pimShopProducts = [];
      const response = await pimApiClient.get('/Item');
      const pimProducts = response.data.data;
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
          (objekt) => objekt.shop === pimShopId,
        );
        if (assignedShop) {
          pimShopProducts.push(pimProductComplete);
        }
      }

      return pimShopProducts;
    } catch (error) {
      throw error;
    }
  }
}
