import { Injectable } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';
import erpApiClient from '../api/erp-api-client';

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
      console.log(error.response.data);
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
