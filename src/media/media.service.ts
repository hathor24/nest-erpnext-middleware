import { Injectable } from '@nestjs/common';
import erpFileClient from '../api/erp-file-client';
import axios, { AxiosInstance } from 'axios';
import erpApiClient from '../api/erp-api-client';
import { v5 as uuidv5 } from 'uuid';

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

  public async createProductMediaAssociation(
    productMediaId: string,
    productId: string,
    mediaId: string,
    mediaTitle: string,
    position: number,
    shopApiClient: any,
  ) {
    try {
      const response = await shopApiClient.patch(`/api/product/${productId}`, {
        media: [
          {
            id: productMediaId,

            media: {
              id: mediaId,
              position: position,
              mediaFolderId: '7fd73faecba94c45946f120aff7d5998',
              title: mediaTitle,
            },
          },
        ],
      });
      const createdAssociation = response.data;

      return createdAssociation;
    } catch (error) {
      console.log(error.response.data.errors);
    }
  }

  public async attachMediaRessourceToMediaObject(
    mediaObjectId: string,
    mediaRessourceUrl: string,
    erpShopId: string,
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
    } catch (error) {
      throw error;
      return null;
    }
  }

  async createShopApiFileClient(shopApiData: any): Promise<AxiosInstance> {
    try {
      const { shopurl, apikey, apisecret } = shopApiData;

      const token = await this.getShopBearerToken(shopurl, apikey, apisecret);

      const shopApiFileClient = axios.create({
        baseURL: shopurl,
        headers: {
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
    pimProduct: any,
    shopProduct: any,
    erpShopId: string,
    shopApiClient: any,
  ) {
    try {
      const shopProductMediaList: any = [];
      const pimProductMediaAssignments: any = {
        coverImage: pimProduct.image,
        image01: pimProduct.custom_attachimg01,
        image02: pimProduct.custom_attachimg02,
        image03: pimProduct.custom_attachimg03,
        image04: pimProduct.custom_attachimg04,
        image05: pimProduct.custom_attachimg05,
        image06: pimProduct.custom_attachimg06,
        image07: pimProduct.custom_attachimg07,
        image08: pimProduct.custom_attachimg08,
      };
      const allValuesNull = Object.values(pimProductMediaAssignments).every(
        (value) => value == false,
      );

      if (allValuesNull) {
        return null;
      }
      for (const pimProductMediaAssignment in pimProductMediaAssignments) {
        if (!pimProductMediaAssignments[pimProductMediaAssignment]) {
          continue;
        }

        const productMediaId = uuidv5(
          pimProductMediaAssignments[pimProductMediaAssignment],
          '1b671a64-40d5-491e-99b0-da01ff1f3341',
        ).replace(/-/g, '');
        console.log('generatedProductMediaId:', productMediaId);

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
            const mediaInfo = mediaData.id;

            const imgIndex =
              Object.keys(pimProductMediaAssignments).indexOf(
                pimProductMediaAssignment,
              ) + 1;

            const mediaFileName =
              pimProductMediaAssignments[pimProductMediaAssignment];

            const mediaTitle = mediaFileName.split('/').pop().split('.')[0];
            await this.createProductMediaAssociation(
              productMediaId,
              shopProduct.id,
              mediaId,
              mediaTitle,
              imgIndex,
              shopApiClient,
            );
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

              const mediaFileName =
                pimProductMediaAssignments[pimProductMediaAssignment];

              const mediaTitle = mediaFileName.split('/').pop().split('.')[0];

              await this.createProductMediaAssociation(
                productMediaId,
                shopProduct.id,
                mediaId,
                mediaTitle,
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
        }
      }
      return shopProductMediaList;
    } catch (error) {
      console.log('Error processing media', error);
      return null;
    }
  }

  public async removeShopProductMedia(
    shopProduct: any,
    pimProduct: any,
    shopApiClient: any,
  ) {
    try {
      if (!shopProduct) {
        return null;
      }
      const pimProductMediaAssignments: any = {
        coverImage: pimProduct.image,
        image01: pimProduct.custom_attachimg01,
        image02: pimProduct.custom_attachimg02,
        image03: pimProduct.custom_attachimg03,
        image04: pimProduct.custom_attachimg04,
        image05: pimProduct.custom_attachimg05,
        image06: pimProduct.custom_attachimg06,
        image07: pimProduct.custom_attachimg07,
        image08: pimProduct.custom_attachimg08,
      };
      const productMediaData = await this.getMediaFromProduct(
        shopProduct.id,
        shopApiClient,
      );
      const shopProductMediaIds = productMediaData.map((media) => media.id);

      const pimProductMediaUrls = Object.values(
        pimProductMediaAssignments,
      ).filter((value) => value != false && value !== undefined);

      const pimProductMediaIds = pimProductMediaUrls.map((url) => {
        const productMediaId = uuidv5(
          url,
          '1b671a64-40d5-491e-99b0-da01ff1f3341',
        ).replace(/-/g, '');
        return productMediaId;
      });

      const deletedMediaIds = shopProductMediaIds.filter(
        (media) => !pimProductMediaIds.includes(media),
      );

      for (const deletedMediaId of deletedMediaIds) {
        await shopApiClient.delete(
          `/api/product/${shopProduct.id}/media/${deletedMediaId}`,
        );
      }
    } catch (error) {
      console.log('Error removing media', error);
    }
  }

  public async getMediaFromProduct(productId: string, shopApiClient: any) {
    try {
      const response = await shopApiClient.get(
        `/api/product/${productId}/media`,
      );
      const mediaData = await response.data.data;
      return mediaData;
    } catch (error) {
      throw error;
    }
  }
}
