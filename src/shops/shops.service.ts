import { Injectable } from '@nestjs/common';
import pimApiClient from '../api/pim-api-client';
import { CommonService } from '../common/common.service';

@Injectable()
export class ShopsService {
  constructor(private readonly commonService: CommonService) {}

  async createShopApiClientByShopId(pimShopId: string) {
    const shopApiData = await this.getShopApiDataByShopId(pimShopId);

    return this.commonService.createShopApiClient(shopApiData);
  }

  async getShopApiDataByShopId(shopId: string): Promise<any> {
    try {
      const response = await pimApiClient.get(`/Shop/${shopId}`);

      const shopApiData = response.data.data;
      return shopApiData;
    } catch (error) {
      throw error;
    }
  }

  async getShopsFromPim() {
    try {
      const response = await pimApiClient.get(
        '/Shop?limit_start=0&limit_page_length=None',
      );
      const pimShops = response.data.data;
      return pimShops;
    } catch (error) {
      throw error;
    }
  }

  async getShopFromPim(pimShopId: string) {
    try {
      const response = await pimApiClient.get(`/Shop/${pimShopId}`);
      const pimShop = response.data.data;
      return pimShop;
    } catch (error) {
      throw error;
    }
  }

  public async getShopSalesChannelInfo(pimShopId: string, shopApiClient: any) {
    try {
      const pimShopData = await this.getShopApiDataByShopId(pimShopId);

      const response = await shopApiClient.get(`/api/sales-channel`);

      const salesChannels = await response.data.data;

      for (const salesChannel of salesChannels) {
        if (salesChannel.id === pimShopData.sales_channel_id) {
          return salesChannel;
        }
      }
    } catch (error) {
      console.log('Sales channel not found');
      return null;
    }
  }

  public async getShopStandardTaxInfo(shopApiClient: any) {
    try {
      const response = await shopApiClient.get(`/api/tax`);

      const taxes = await response.data.data;

      for (const tax of taxes) {
        if (tax.position == 1 && tax.name == 'Standard rate') {
          return tax;
        }
      }
    } catch (error) {
      console.log('Standard tax not found');
      return null;
    }
  }

  public async processPimProductVisibilities(
    shopProduct: any,
    pimProduct: any,
    pimShopId: string,
    shopApiClient: any,
  ) {
    try {
      const assignedPimSalesChannels = pimProduct.custom_item_shop_list;
      const shopDeactivated = assignedPimSalesChannels.find((item) => {
        // return item.active == 0 && item.name== pimShopId;
        return item.active == 0 && item.shopname == pimShopId;
      });
      if (shopDeactivated) {
        return null;
      }
      const salesChannel = await this.getShopSalesChannelInfo(
        pimShopId,
        shopApiClient,
      );
      if (shopProduct === undefined) {
        return [
          {
            salesChannelId: salesChannel.id,
            visibility: 30,
          },
        ];
      }
      const productSalesChannels = await this.getSalesChannelsFromProduct(
        shopProduct.id,
        shopApiClient,
      );
      const shopProductSalesChannelIds = productSalesChannels.map(
        (item) => item.salesChannelId,
      );
      if (shopProductSalesChannelIds.includes(salesChannel.id)) {
        return null;
      }
      if (!shopProductSalesChannelIds.includes(salesChannel.id)) {
        return [
          {
            salesChannelId: salesChannel.id,
            visibility: 30,
          },
        ];
      }
    } catch (error) {
      throw error;
    }
  }

  public async removeShopProductVisibilities(
    shopProduct: any,
    pimProduct: any,
    pimShopId: string,
    shopApiClient: any,
  ) {
    try {
      const productSalesChannels = await this.getSalesChannelsFromProduct(
        shopProduct.id,
        shopApiClient,
      );
      const shopProductSalesChannelIds = productSalesChannels.map(
        (item) => item.salesChannelId,
      );
      const assignedPimSalesChannels = pimProduct.custom_item_shop_list;
      const pimSalesChannelsPromise = await assignedPimSalesChannels.map(
        // async (item) => await this.getShopFromPim(item.shop),
        async (item) => await this.getShopFromPim(item.shopname),
      );
      const pimSalesChannels = await Promise.all(pimSalesChannelsPromise);
      const pimProductStorefrontIds = pimSalesChannels.map(
        (item) => item.sales_channel_id,
      );

      const removedProductShopIds = shopProductSalesChannelIds.filter(
        (item) => !pimProductStorefrontIds.includes(item),
      );

      const shopDeactivated = assignedPimSalesChannels.find((item) => {
        return item.active == 0 && item.shopname == pimShopId;
      });
      const pimShopData = await this.getShopFromPim(shopDeactivated.shopname);
      removedProductShopIds.push(pimShopData.sales_channel_id);

      if (removedProductShopIds.length > 0) {
        const removedProductShopsPromise = removedProductShopIds.map(
          async (item) =>
            await this.removeSalesChannelFromProduct(
              shopProduct.id,
              productSalesChannels.find(
                (element) => element.salesChannelId === item,
              ).id,
              shopApiClient,
            ),
        );
        await Promise.all(removedProductShopsPromise);
      }
    } catch (error) {
      return null;
    }
  }

  public async getSalesChannelsFromProduct(
    productId: string,
    shopApiClient: any,
  ) {
    try {
      const response = await shopApiClient.get(
        `/api/product/${productId}/visibilities/`,
      );

      const productData = await response.data.data;

      return productData;
    } catch (error) {
      throw error;
    }
  }

  public async removeSalesChannelFromProduct(
    productId: string,
    visibilityId: string,
    shopApiClient: any,
  ) {
    try {
      const response = await shopApiClient.delete(
        `/api/product/${productId}/visibilities/${visibilityId}`,
      );

      return response;
    } catch (error) {
      throw error;
    }
  }

  public async getSalesChannelFromProductBySalesChannelId(
    productId: string,
    salesChannelId: string,
    shopApiClient: any,
  ) {
    try {
      const response = await shopApiClient.get(
        `/api/product/${productId}/visibilities?filter[salesChannelId]=${salesChannelId}`,
      );

      const productData = await response.data.data[0];

      return productData;
    } catch (error) {
      throw error;
    }
  }
}
