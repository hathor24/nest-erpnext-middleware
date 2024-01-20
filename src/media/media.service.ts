import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import erpFileClient from '../api/erp-file-client';
import { ProductsService } from '../products/products.service';
import axios, { AxiosInstance } from 'axios';
import erpApiClient from '../api/erp-api-client';

@Injectable()
export class MediaService {
  //   constructor(private readonly productsService: ProductsService) {}
  public async getShopMedia(shopApiClient: any) {
    try {
      const response = await shopApiClient.get(`/api/media`);

      const allMediaData = await response.data.data;

      return allMediaData;
    } catch (error) {
      throw error;
    }
  }

  public async getShopMediaById(mediaId: string, shopApiClient: any) {
    try {
      const response = await shopApiClient.get(`/api/media/${mediaId}`);
      const mediaData = await response.data.data;

      return mediaData;
    } catch (error) {
      return null;
    }
  }

  public async deleteShopMedia(mediaId: string, shopApiClient: any) {
    const response = await shopApiClient.delete(`/api/media/${mediaId}`);
    const deletedMedia = response.data;

    return deletedMedia;
  }

  public async createShopMedia(
    mediaShortCode: string,
    mediaName: string,
    shopApiClient: any,
  ) {
    const allMediaData = await this.getShopMedia(shopApiClient);
    const mediaExists = allMediaData.some((obj) => obj.name === mediaName);
    if (mediaExists) {
      console.log('Media already exists');
    } else {
      const response = await shopApiClient.post('/api/media?_response=basic', {
        shortCode: mediaShortCode,
        name: mediaName,
      });
      const createdMedia = response.data.data;

      return createdMedia;
    }
  }
  public async createProductMediaAssociation(
    productMediaId: string,
    productId: string,
    mediaId: string,
    position: number,
    shopApiClient: any,
  ) {
    const response = await shopApiClient.patch(`/api/product/${productId}`, {
      media: [
        {
          id: productMediaId,
          //   productId: productId,

          media: {
            id: mediaId,
            position: position,
          },
        },
      ],
    });
    const createdAssociation = response.data;

    return createdAssociation;
  }
  public async attachMediaRessourceToMediaObject(
    mediaObjectId: string,
    mediaRessourceUrl: string,
    erpShopId: string,
    // shopApiClient: any,
  ) {
    try {
      const imgUrl = mediaRessourceUrl.replace(/ /g, '%20');
      const fileResponse = await erpFileClient.get(imgUrl, {
        responseType: 'arraybuffer',
      });
      const binaryFileData = Buffer.from(fileResponse.data, 'binary');

      const shopApiFileClient =
        await this.createShopApiFileClientByShopId(erpShopId);
      const response = await shopApiFileClient.post(
        `/api/_action/media/${mediaObjectId}/upload?_response=basic&extension=jpg`,
        binaryFileData,
      );
      //   const responseData = response.config.data;
      //   console.log('responseData', responseData);
      //   return responseData;
    } catch (error) {
      throw error;
      return null;
    }
  }
  public async removeMediaFromProduct() {}

  async createShopApiFileClient(shopApiData: any): Promise<AxiosInstance> {
    try {
      const { shopurl, apikey, apisecret } = shopApiData;

      const token = await this.getShopBearerToken(shopurl, apikey, apisecret);

      const shopApiFileClient = axios.create({
        baseURL: shopurl,
        headers: {
          //   Accept: 'application/json',
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
      const shopApiClient = this.createShopApiFileClient(shopApiData);
      return shopApiClient;
    } catch (error) {
      throw error;
    }
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
}
