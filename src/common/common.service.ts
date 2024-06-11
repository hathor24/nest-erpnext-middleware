import { Injectable } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';
import { v5 as uuidv5 } from 'uuid';

@Injectable()
export class CommonService {
  public async generateUUID(input: any) {
    return uuidv5(input, '1b671a64-40d5-491e-99b0-da01ff1f3341').replace(
      /-/g,
      '',
    );
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
  // async getShopApiClient(shopApiData: any): Promise<AxiosInstance> {
  //   try {
  //     const shopApiClient = this.createShopApiClient(shopApiData);
  //     return shopApiClient;
  //   } catch (error) {
  //     throw error;
  //   }
  // }
  async createShopApiClient(shopApiData: any): Promise<AxiosInstance> {
    try {
      const { shop_url, api_id, api_secret } = shopApiData;

      const token = await this.getShopBearerToken(shop_url, api_id, api_secret);

      const shopApiClient = axios.create({
        baseURL: shop_url,
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
}
