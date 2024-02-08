import { Injectable } from '@nestjs/common';
import erpFileClient from '../api/erp-file-client';
import axios, { AxiosInstance } from 'axios';
import erpApiClient from '../api/erp-api-client';
import { v5 as uuidv5 } from 'uuid';
//TODO Fix mediaRemoveFromProduct
@Injectable()
export class MediaService {
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
  public async setCoverImage(
    imageId: string,
    productId: string,
    shopApiClient: any,
  ) {
    try {
      const response = await shopApiClient.patch(
        `/api/product/${productId}?_response=basic`,
        {
          coverId: imageId,
        },
      );
      const coverImage = response.data;
      return coverImage;
    } catch (error) {
      console.log('Error setting cover image');
      return null;
    }
  }

  // public async getCoverImage(imageId: string, shopApiClient: any) {
  //   return null;
  // }

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
      await shopApiFileClient.post(
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
  public async removeMediaFromProduct(
    shopApiClient: any,
    productId: string,
    mediaId: string,
  ) {
    const response = await shopApiClient.patch(`/api/product/${productId}`, {
      media: [
        {
          id: mediaId,
          remove: true,
        },
      ],
    });
    const removedMedia = response.data;

    return removedMedia;
  }

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
  public async processPimProductMedia(
    productData: any,
    shopProduct: any,
    erpShopId: string,
    shopApiClient: any,
  ) {
    try {
      const shopProductMediaList: any = [];
      const pimProductMediaAssignments: any = {
        coverImage: productData.image,
        image01: productData.custom_attachimg01,
        image02: productData.custom_attachimg02,
        image03: productData.custom_attachimg03,
        image04: productData.custom_attachimg04,
        image05: productData.custom_attachimg05,
        image06: productData.custom_attachimg06,
        image07: productData.custom_attachimg07,
        image08: productData.custom_attachimg08,
      };

      const allValuesNull = Object.values(pimProductMediaAssignments).every(
        (value) => value === null,
      );

      if (allValuesNull) {
        return null;
      }
      for (const pimProductMediaAssignment in pimProductMediaAssignments) {
        if (
          pimProductMediaAssignments[pimProductMediaAssignment] == undefined
        ) {
          continue;
        }
        const productMediaId = uuidv5(
          pimProductMediaAssignments[pimProductMediaAssignment],
          '1b671a64-40d5-491e-99b0-da01ff1f3341',
        ).replace(/-/g, '');

        const mediaId = uuidv5(
          productMediaId,
          '1b671a64-40d5-491e-99b0-da01ff1f3341',
        ).replace(/-/g, '');
        const mediaData: any = await this.getShopMediaById(
          mediaId,
          shopApiClient,
        );
        if (pimProductMediaAssignment === 'coverImage') {
          await this.setCoverImage(
            productMediaId,
            shopProduct.id,
            shopApiClient,
          );
        }

        if (pimProductMediaAssignments[pimProductMediaAssignment] != null) {
          if (mediaData != null) {
            const mediaInfo = {
              id: mediaData.id,
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
              await this.createProductMediaAssociation(
                productMediaId,
                shopProduct.id,
                mediaId,
                imgIndex,
                shopApiClient,
              );

              shopProductMediaList.push(mediaId);
            }

            await this.attachMediaRessourceToMediaObject(
              mediaId,
              pimProductMediaAssignments[pimProductMediaAssignment],
              erpShopId,
            );
          }
        } else if (
          pimProductMediaAssignments[pimProductMediaAssignment] == null &&
          mediaData &&
          shopProduct &&
          shopProduct.mediaIds &&
          shopProduct.mediaIds.includes(mediaData.id)
        ) {
          await this.removeMediaFromProduct(
            shopApiClient,
            shopProduct.id,
            mediaData.id,
          );
        }
      }
      return shopProductMediaList;
    } catch (error) {
      console.log('Error processing media', error);
      return null;
    }
  }
}
