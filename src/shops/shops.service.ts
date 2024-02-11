import { Injectable } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';
import pimApiClient from '../api/pim-api-client';

@Injectable()
export class ShopsService {
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

  async createShopApiClientByShopId(pimShopId: string) {
    const shopApiData = await this.getShopApiDataByShopId(pimShopId);
    return this.createShopApiClient(shopApiData);
  }

  async getShopApiDataByShopId(shopId: string): Promise<any> {
    try {
      const response = await pimApiClient.get(`/Item%20Shop/${shopId}`);

      const shopApiData = response.data.data;
      return shopApiData;
    } catch (error) {
      throw error;
    }
  }

  async getShopsFromPim() {
    try {
      const response = await pimApiClient.get('/Item%20Shop');
      const pimShops = response.data.data;
      return pimShops;
    } catch (error) {
      throw error;
    }
  }

  async getShopFromPim(shopNumber: string) {
    try {
      const response = await pimApiClient.get(`/Item%20Shop/${shopNumber}`);
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
        if (salesChannel.id === pimShopData.storefrontid) {
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
    pimShopId: string,
    shopApiClient: any,
  ) {
    try {
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
      const assignedPimSalesChannels = pimProduct.custom_assigned_shops;
      const pimSalesChannelsPromise = await assignedPimSalesChannels.map(
        async (item) => await this.getShopFromPim(item.shop),
      );
      const pimSalesChannels = await Promise.all(pimSalesChannelsPromise);
      const pimProductStorefrontIds = pimSalesChannels.map(
        (item) => item.storefrontid,
      );

      const removedProductShops = shopProductSalesChannelIds.filter(
        (item) => !pimProductStorefrontIds.includes(item),
      );
      if (removedProductShops.length > 0) {
        const removedProductShopsPromise = removedProductShops.map(
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
      console.log('remove');
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
