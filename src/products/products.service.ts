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
      // console.log('productNumber', productNumber);
      const response = await shopApiClient.get(
        `/api/product?filter[productNumber]=${productNumber}`,
      );
      const shopProduct = response.data.data;
      // console.log('shopProduct', shopProduct);
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
        //wenn keiner der pimProduct.custom_item_shop_list.name === pimShopId ist, dann lösche das Produkt
        const existingShops = [];
        for (const shop of pimProduct.custom_item_shop_list) {
          const shopExists = await this.shopsService.getShopSalesChannelInfo(
            // shop.shop,
            shop.shopname,
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

  public async createShopProductShell(
    variantProduct: any,
    taxId: string,
    currencyId: string,
    pimShopId: string,
    shopApiClient: any,
  ) {
    try {
      const data = {
        taxId: taxId,
        price: [
          {
            currencyId: currencyId,
            gross: 0,
            net: 0,
            linked: true,
          },
        ],
        productNumber: variantProduct.item_code,
        name: 'dummy',
        stock: 0,
      };
      const response = await shopApiClient.post(
        '/api/product?_response=basic',
        data,
      );

      return response.data.data;
    } catch (error) {
      console.log('Shell Creation Error', error.response.data);
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
        active: await this.getPimProductActive(pimProduct, pimShopId),
        // active: pimProduct.custom_active == 0 ? false : true,
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
        // metaDescription: pimProduct.custom_metadescription_short_description,
        description: await this.getPimProductDescription(pimProduct, pimShopId),
        packUnit: pimProduct.custom_pack_unit,
        packUnitPlural: pimProduct.custom_pack_unit_plural,
        customFields: {
          br_pim_modified: pimProduct.modified,
          bioraum_benefit_field: pimProduct.custom_benefits,
          bioraum_short_desc:
            pimProduct.custom_metadescription_short_description,
          bioraum_youtube_ids: pimProduct.custom_youtubeids,
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
      // await this.mediaService.removeShopProductMedia(
      //   shopProduct,
      //   pimProduct,
      //   pimShopId,
      //   shopApiClient,
      // );
      // console.log('data', data);
      // await this.removeShopProduct(shopProduct, pimProduct, shopApiClient);
      if (shopProduct !== undefined) {
        // throw error;
        const response = await shopApiClient.patch(
          `/api/product/${shopProduct.id}?_response=basic`,
          data,
        );
        console.log(
          `updated: ${pimProduct.item_name} - ${pimProduct.item_code} (${pimShopId})`,
        );

        const updatedProduct = response.data.data;

        return updatedProduct;
      } else {
        // throw error;
        const response = await shopApiClient.post(
          '/api/product?_response=basic',
          data,
        );
        console.log(
          `created: ${pimProduct.item_name} - ${pimProduct.item_code} (${pimShopId})`,
        );

        const createdProduct = response.data.data;

        return createdProduct;
      }
    } catch (error) {
      console.log(
        `Creation Error of Product: ${pimProduct.item_name} - ${pimProduct.item_code} (${pimShopId})`,
        error.response.data,
      );
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
      for (const shop of pimProduct.custom_item_shop_list) {
        if (shop.shopname === pimShopId) {
          return shop.individual_price
            ? shop.individual_price
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
      for (const shop of pimProduct.custom_item_shop_list) {
        if (shop.shopname === pimShopId) {
          return shop.individual_description
            ? shop.individual_description
            : pimProduct.custom_long_description;
        }
      }
    } catch (error) {
      console.log('Product description not found');
      return null;
    }
  }
  public async getPimProductActive(pimProduct: any, pimShopId: string) {
    try {
      for (const shop of pimProduct.custom_item_shop_list) {
        if (shop.shopname === pimShopId) {
          return shop.active == 0 ? false : true;
        }
      }
    } catch (error) {
      console.log('Product activation not found');
      return null;
    }
  }

  public async getPimProductShops(pimProduct: any) {
    try {
      const shopsIds = [];
      for (const shop of pimProduct.custom_item_shop_list) {
        shopsIds.push(shop.shopname);
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
      const response = await pimApiClient.get(
        '/Item?limit_start=0&limit_page_length=None',
      );
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
        // const pimProducts = await this.getPimProducts();
        // console.log('pimProducts', pimProducts);
        const pimProductsFiltered = await pimApiClient.get(
          `/Item?filters=[["Item","variant_of","=","${pimProduct.item_code}"]]&limit_start=0&limit_page_length=None`,
        );
        // console.log('pimProductsFiltered', pimProductsFiltered.data.data, 'FLORIAN');
        // throw error;

        for (const item of pimProductsFiltered.data.data) {
          const variantPimProduct = await this.getPimProductByName(item.name);

          // if (variantPimProduct.variant_of === pimProduct.item_code) {
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
              // console.log('configuratorSetting', configuratorSetting);

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
          // }
        }
        const uniqueShopProductPropertyOptions =
          shopProductPropertyOptions.filter(
            (v, i, a) => a.findIndex((t) => t.optionId === v.optionId) === i,
          );
        // console.log('shopProductPropertyOptions', shopProductPropertyOptions);
        // console.log(
        //   'uniqueShopProductPropertyOptions',
        //   uniqueShopProductPropertyOptions,
        // );
        // return shopProductPropertyOptions;
        return uniqueShopProductPropertyOptions;
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
      // const pimProducts = await this.getPimProducts();
      const children = [];
      //NEW
      const pimProductsFiltered = await pimApiClient.get(
        `/Item?filters=[["Item","variant_of","=","${pimProduct.item_code}"]]&limit_start=0&limit_page_length=None`,
      );
      //NEW END

      for (const item of pimProductsFiltered.data.data) {
        const variantPimProduct = await this.getPimProductByName(item.name);

        const shopProduct = await this.getShopProductByProductNumber(
          variantPimProduct.item_code,
          shopApiClient,
        );
        const currencyId = (
          await this.shopsService.getShopSalesChannelInfo(
            pimShopId,
            shopApiClient,
          )
        ).currencyId;
        const taxId = (
          await this.shopsService.getShopStandardTaxInfo(shopApiClient)
        ).id;
        let id = (
          await this.getShopProductByProductNumber(
            variantPimProduct.item_code,
            shopApiClient,
          )
        ).id;
        const parentExists = await this.getShopProductByProductNumber(
          pimProduct.item_code,
          shopApiClient,
        );
        if (id === null && parentExists.id !== null) {
          const createdVariant = await this.createShopProductShell(
            variantPimProduct,
            taxId,
            currencyId,
            pimShopId,
            shopApiClient,
          );
          id = createdVariant.id;
        }
        const child = {
          id: id,
          price: [
            {
              currencyId: currencyId,
              gross: await this.getPimProductPrice(
                variantPimProduct,
                pimShopId,
              ),
              net:
                ((await this.getPimProductPrice(variantPimProduct, pimShopId)) /
                  119) *
                100,
              linked: true,
            },
          ],
          productNumber: variantPimProduct.name,
          active: await this.getPimProductActive(variantPimProduct, pimShopId),
          // active: variantPimProduct.custom_active == 0 ? false : true,
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
          description: await this.getPimProductDescription(
            variantPimProduct,
            pimShopId,
          ),
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
        // await this.mediaService.removeShopProductMedia(
        //   shopProduct,
        //   variantPimProduct,
        //   pimShopId,
        //   shopApiClient,
        // );
        children.push(child);
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
      console.log('Media not found - createShopProductMedia');
      return null;
    }
  }
  public async removeShopProductMedia(
    pimProduct: any,
    pimShopId: string,
    shopApiClient: any,
  ) {
    try {
      const shopProduct = await this.getShopProductByProductNumber(
        pimProduct.item_code,
        shopApiClient,
      );
      await this.mediaService.removeShopProductMedia(
        shopProduct,
        pimProduct,
        pimShopId,
        shopApiClient,
      );
    } catch (error) {
      console.log('Media not found - removeShopProductMedia');
      return null;
    }
  }

  public async createShopProductFile(
    pimProduct: any,
    pimShopId: string,
    shopApiClient: any,
  ) {
    try {
      const shopProduct = await this.getShopProductByProductNumber(
        pimProduct.item_code,
        shopApiClient,
      );
      const media = await this.mediaService.processPimProductFile(
        pimProduct,
        shopProduct,
        pimShopId,
        shopApiClient,
      );

      return media;
    } catch (error) {
      console.log('File not found - createShopProductFile');
      return null;
    }
  }
  public async removeShopProductFile(
    pimProduct: any,
    pimShopId: string,
    shopApiClient: any,
  ) {
    try {
      const shopProduct = await this.getShopProductByProductNumber(
        pimProduct.item_code,
        shopApiClient,
      );
      await this.mediaService.removeShopProductFile(
        shopProduct,
        pimProduct,
        pimShopId,
        shopApiClient,
      );
    } catch (error) {
      console.log('File not found - removeShopProductFile');
      return null;
    }
  }

  public async getFamilyProductNumbers(pimProduct: any) {
    try {
      let parentProduct: any = {};
      if (pimProduct.variant_of) {
        parentProduct = await this.getPimProductByName(pimProduct.variant_of);
      } else {
        parentProduct = pimProduct;
      }

      const response = await pimApiClient.get(
        `Item?or_filters=[["Item","variant_of","=","${parentProduct.item_code}"],["Item","item_code","=","${parentProduct.item_code}"]]`,
      );
      const family = response.data.data;

      const familyItemCodes = family.map((obj) => obj.name);
      return familyItemCodes;
    } catch (error) {
      console.log('Family not found');
      return null;
    }
  }

  public async getModifiedProducts(pimShopId: string, shopApiClient: any) {
    try {
      const response = await pimApiClient.get(
        '/Item?limit_start=0&limit_page_length=None',
      );
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

        const assignedShop = pimProductComplete.custom_item_shop_list.some(
          (objekt) => objekt.shopname === pimShopId,
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
      // const response = await pimApiClient.get(
      //   '/Item?limit_start=0&limit_page_length=None',
      // );
      // const pimProducts = response.data.data;

      const pimProductsFiltered = await pimApiClient.get(
        `/Item?filters=[["Item%20Shop","shopname","=","${pimShopId}"]]&limit_start=0&limit_page_length=None`,
      );

      const modifiedMainProducts: Set<string> = new Set();

      for (const pimProduct of pimProductsFiltered.data.data) {
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

          // const assignedShop = pimProductComplete.custom_item_shop_list.find(
          //   (objekt) => objekt.shopname === pimShopId,
          // );

          // if (assignedShop) {
          modifiedMainProducts.add(pimProductComplete.name);
          // }
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
      // const response = await pimApiClient.get(
      //   '/Item?limit_start=0&limit_page_length=None',
      // );
      // const pimProducts = response.data.data;

      const pimProductsFiltered = await pimApiClient.get(
        `/Item?filters=[["Item%20Shop","shopname","=","${pimShopId}"]]&limit_start=0&limit_page_length=None`,
      );
      for (const pimProduct of pimProductsFiltered.data.data) {
        const pimProductComplete = await this.getPimProductByName(
          pimProduct.name,
        );
        const response = await shopApiClient.get(
          `/api/product?filter[productNumber]=${pimProduct.name}`,
        );
        const shopProduct = response.data.data[0];

        pimProductComplete.uuid =
          shopProduct != undefined ? shopProduct.id : null;
        // const assignedShop = pimProductComplete.custom_item_shop_list.some(
        //   (objekt) => objekt.shopname === pimShopId,
        // );
        // if (assignedShop) {
        pimShopProducts.push(pimProductComplete);
        // }
      }

      return pimShopProducts;
    } catch (error) {
      throw error;
    }
  }
}
