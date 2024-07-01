import { Injectable } from '@nestjs/common';
import pimFileClient from '../api/pim-file-client';
import axios, { AxiosInstance } from 'axios';
import pimApiClient from '../api/pim-api-client';
import { CommonService } from '../common/common.service';

@Injectable()
export class MediaService {
  constructor(private readonly commonService: CommonService) {}
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
  public async getShopProductMediaFolderId(shopApiClient: any) {
    const response = await shopApiClient.get('/api/media-folder');
    const shopFolders = response.data.data;
    const shopProductMediaFolder = shopFolders.find(
      (item) => item.name === 'Product Media',
    );
    return shopProductMediaFolder.id;
  }
  public async getShopProductMedia(shopApiClient: any) {
    const response = await shopApiClient.get('/api/product-media');
    const productMedia = await response.data.data;
    // throw 'end';
    return productMedia;
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
      const mediaFolderId =
        await this.getShopProductMediaFolderId(shopApiClient);
      const response = await shopApiClient.patch(`/api/product/${productId}`, {
        media: [
          {
            id: productMediaId,
            position: position,
            media: {
              id: mediaId,
              mediaFolderId: mediaFolderId,
              title: mediaTitle,
            },
          },
        ],
      });
      const createdAssociation = response.data;

      return createdAssociation;
    } catch (error) {}
  }

  public async attachMediaRessourceToMediaObject(
    mediaObjectId: string,
    mediaRessourceUrl: string,
    pimShopId: string,
  ) {
    try {
      const imgUrl = mediaRessourceUrl.replace(/ /g, '%20');
      const fileResponse = await pimFileClient.get(imgUrl, {
        responseType: 'arraybuffer',
      });
      const binaryFileData = Buffer.from(fileResponse.data, 'binary');

      const shopApiFileClient =
        await this.createShopApiFileClientByShopId(pimShopId);
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
      const { shop_url, api_id, api_secret } = shopApiData;

      const token = await this.getShopBearerToken(shop_url, api_id, api_secret);

      const shopApiFileClient = axios.create({
        baseURL: shop_url,
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

  async createShopApiFileClientByShopId(pimShopId: string) {
    const shopApiData = await this.getShopApiDataByShopId(pimShopId);
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
      const response = await pimApiClient.get(`/Shop/${shopId}`);

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
    pimShopId: string,
    shopApiClient: any,
  ) {
    try {
      let pimProductMediaAssignments: any = {};

      for (const shop of pimProduct.custom_item_shop_list) {
        if (shop.shopname === pimShopId) {
          if (
            typeof shop.individual_attachcover === 'string' &&
            shop.individual_attachcover.length > 0
          ) {
            pimProductMediaAssignments = {
              coverImage: shop.individual_attachcover,
              image01: shop.individual_attachimg01,
              image02: shop.individual_attachimg02,
              image03: shop.individual_attachimg03,
              image04: shop.individual_attachimg04,
              image05: shop.individual_attachimg05,
              image06: shop.individual_attachimg06,
              image07: shop.individual_attachimg07,
              image08: shop.individual_attachimg08,
            };
          } else {
            pimProductMediaAssignments = {
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
          }
        }
      }

      const shopProductMediaList: any = [];

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
        const productMediaId = await this.commonService.generateUUID(
          pimProductMediaAssignments[pimProductMediaAssignment] +
            pimProduct.item_code,
        );

        const mediaId = await this.commonService.generateUUID(
          pimProductMediaAssignments[pimProductMediaAssignment],
        );

        // const productMediaId = await this.commonService.generateUUID(
        //   pimProductMediaAssignments[pimProductMediaAssignment] +
        //     pimProduct.item_code,
        // );

        // const mediaId = await this.commonService.generateUUID(productMediaId);

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
        // const responseProductMedia = await shopApiClient.get(`/api/media`);

        // const productMedia = responseProductMedia.data.data;

        // const productMediaIdExists = await productMedia.find(
        //   async (item) => item.id == productMediaId,
        // );
        // if (productMediaIdExists) {
        //   continue;
        // }
        if (pimProductMediaAssignments[pimProductMediaAssignment] != null) {
          if (mediaData != null) {
            const mediaInfo = mediaData.id;

            const imgIndex = Object.keys(pimProductMediaAssignments).indexOf(
              pimProductMediaAssignment,
            );
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
              const imgIndex = Object.keys(pimProductMediaAssignments).indexOf(
                pimProductMediaAssignment,
              );

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
              pimShopId,
            );
          }
        }
      }
      return shopProductMediaList;
    } catch (error) {
      console.log('Error processing media', error.response.data.errors[0]);
      return null;
    }
  }

  public async removeShopProductMedia(
    shopProduct: any,
    pimProduct: any,
    pimShopId: string,
    shopApiClient: any,
  ) {
    try {
      // console.log('remove wird ausgeführt');
      // console.log('shopProduct', shopProduct.productNumber);
      if (!shopProduct) {
        return null;
      }

      let pimProductMediaAssignments: any = {};
      for (const shop of pimProduct.custom_item_shop_list) {
        if (shop.shopname === pimShopId) {
          if (
            typeof shop.individual_attachcover === 'string' &&
            shop.individual_attachcover.length > 0
          ) {
            pimProductMediaAssignments = {
              coverImage: shop.individual_attachcover,
              image01: shop.individual_attachimg01,
              image02: shop.individual_attachimg02,
              image03: shop.individual_attachimg03,
              image04: shop.individual_attachimg04,
              image05: shop.individual_attachimg05,
              image06: shop.individual_attachimg06,
              image07: shop.individual_attachimg07,
              image08: shop.individual_attachimg08,
            };
          } else {
            pimProductMediaAssignments = {
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
          }
        }
      }

      const productMediaData = await this.getMediaFromProduct(
        shopProduct.id,
        shopApiClient,
      );
      // console.log('productMediaData', productMediaData);
      const shopProductMediaIds = productMediaData.map((media) => media.id);

      // Generiere UUIDs für alle Medien-URLs in pimProductMediaAssignments
      const pimProductMediaUrls = Object.values(
        pimProductMediaAssignments,
      ).filter(Boolean);
      const pimProductMediaIds = await Promise.all(
        pimProductMediaUrls.map((url) =>
          this.commonService.generateUUID(url + pimProduct.item_code),
        ),
      );

      //TODO Entferne nur die Medien, die nicht in den generierten UUIDs enthalten sind UND nicht dem spezifischen Produkt zugeordnet sind:

      const mediaIdsToRemove = shopProductMediaIds.filter(
        (id) => !pimProductMediaIds.includes(id),
      );

      for (const mediaId of mediaIdsToRemove) {
        await shopApiClient.delete(
          `/api/product/${shopProduct.id}/media/${mediaId}`,
        );
      }

      // const pimProductMediaUrls = Object.values(
      //   pimProductMediaAssignments,
      // ).filter((value) => value != false && value !== undefined);

      // const pimProductMediaIds = pimProductMediaUrls.map(async (url) => {
      //   const productMediaId = await this.commonService.generateUUID(url);
      //   return productMediaId;
      // });

      // const deletedMediaIds = shopProductMediaIds.filter(
      //   (media) => !pimProductMediaIds.includes(media),
      // );

      // for (const deletedMediaId of deletedMediaIds) {
      //   await shopApiClient.delete(
      //     `/api/product/${shopProduct.id}/media/${deletedMediaId}`,
      //   );
      // }
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
