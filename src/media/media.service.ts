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
  public async getShopProductFileFolderId(shopApiClient: any) {
    const response = await shopApiClient.get('/api/media-folder');
    const shopFolders = response.data.data;
    const shopProductMediaFolder = shopFolders.find(
      (item) => item.name === 'Product Downloads',
    );
    return shopProductMediaFolder.id;
  }
  public async getShopProductMedia(shopApiClient: any) {
    const response = await shopApiClient.get('/api/product-media');
    const productMedia = await response.data.data;
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
    fileName: string,
    pimShopId: string,
  ) {
    try {
      const imgUrl = mediaRessourceUrl.replace(/ /g, '%20');
      const fileResponse = await pimFileClient.get(imgUrl, {
        responseType: 'arraybuffer',
      });
      const binaryFileData = Buffer.from(fileResponse.data, 'binary');
      const webSafeFileName = fileName
        .trim() // Entfernt führende und nachfolgende Leerzeichen
        .replace(/\s+/g, '_') // Ersetzt Leerzeichen durch Unterstriche
        .replace(/[\/:?#&=]/g, '') // Entfernt problematische Zeichen
        .replace(/[^a-zA-Z0-9_\-]/g, ''); // Entfernt alle nicht-alphanumerischen Zeichen außer Unterstrich und Bindestrich

      const shopApiFileClient =
        await this.createShopApiMediaClientByShopId(pimShopId);
      await shopApiFileClient.post(
        // `/api/_action/media/${mediaObjectId}/upload?_response=basic&extension=jpg`,
        `/api/_action/media/${mediaObjectId}/upload?_response=basic&extension=jpg&fileName=${webSafeFileName}`,
        binaryFileData,
      );
    } catch (error) {
      throw error;
      return null;
    }
  }
  public async createFileObject(
    fileId: string,
    fileTitle: string,
    pimProductName: string,
    shopApiClient: any,
  ) {
    try {
      const fileFolderId = await this.getShopProductFileFolderId(shopApiClient);
      const response = await shopApiClient.post(`/api/media`, {
        id: fileId,
        mediaFolderId: fileFolderId,
        title: fileTitle + ' - ' + pimProductName,
      });
      const createdObject = response;

      return createdObject;
    } catch (error) {}
  }

  public async createProductFileAssociation(
    productId: string,
    fileId: string,
    fileNumber: string,
    shopApiClient: any,
  ) {
    try {
      const formattedKey = 'custom_fields_product_' + fileNumber;
      const response = await shopApiClient.patch(`/api/product/${productId}`, {
        customFields: {
          [formattedKey]: fileId,
        },
      });
      const createdAssociation = response.data;

      return createdAssociation;
    } catch (error) {}
  }

  public async attachFileRessourceToFileObject(
    fileObjectId: string,
    fileTitle: string,
    pimProductName: string,
    fileRessourceUrl: string,
    pimShopId: string,
  ) {
    try {
      const imgUrl = fileRessourceUrl.replace(/ /g, '%20');
      const fileResponse = await pimFileClient.get(imgUrl, {
        responseType: 'arraybuffer',
      });
      const binaryFileData = Buffer.from(fileResponse.data, 'binary');

      const shopApiFileClient =
        await this.createShopApiFileClientByShopId(pimShopId);

      const fileName = fileTitle + '-' + pimProductName;
      const webSafeFileName = fileName
        .trim() // Entfernt führende und nachfolgende Leerzeichen
        .replace(/\s+/g, '_') // Ersetzt Leerzeichen durch Unterstriche
        .replace(/[\/:?#&=]/g, '') // Entfernt problematische Zeichen
        .replace(/[^a-zA-Z0-9_\-]/g, ''); // Entfernt alle nicht-alphanumerischen Zeichen außer Unterstrich und Bindestrich

      await shopApiFileClient.post(
        // `/api/_action/media/${fileObjectId}/upload?_response=basic&extension=pdf`,
        `/api/_action/media/${fileObjectId}/upload?_response=basic&extension=pdf&fileName=${webSafeFileName}`,

        binaryFileData,
      );
    } catch (error) {
      console.log(
        'Error attaching file ressource to file object',
        error.response.data.errors[0],
      );
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
          'Content-Type': 'application/pdf',
          Authorization: `Bearer ${token}`,
          extension: 'pdf',
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

  async createShopApiMediaClient(shopApiData: any): Promise<AxiosInstance> {
    try {
      const { shop_url, api_id, api_secret } = shopApiData;

      const token = await this.getShopBearerToken(shop_url, api_id, api_secret);

      const shopApiFileClient = axios.create({
        baseURL: shop_url,
        headers: {
          'Content-Type': 'image/jpeg',
          Authorization: `Bearer ${token}`,
          extension: 'jpg',
        },
      });

      return shopApiFileClient;
    } catch (error) {
      throw error;
    }
  }

  async createShopApiMediaClientByShopId(pimShopId: string) {
    const shopApiData = await this.getShopApiDataByShopId(pimShopId);
    return this.createShopApiMediaClient(shopApiData);
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
    const baseUrl = shopUrl.endsWith('/') ? shopUrl.slice(0, -1) : shopUrl;

    const options = {
      method: 'POST',
      url: baseUrl + '/api/oauth/token',
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
          let mediaTitle = '';
          if (mediaData != null) {
            const mediaInfo = mediaData.id;

            const imgIndex = Object.keys(pimProductMediaAssignments).indexOf(
              pimProductMediaAssignment,
            );
            const mediaFileName =
              pimProductMediaAssignments[pimProductMediaAssignment];

            mediaTitle = mediaFileName.split('/').pop().split('.')[0];
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

              mediaTitle = mediaFileName.split('/').pop().split('.')[0];
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
              mediaTitle,
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
      const shopProductMediaIds = productMediaData.map((media) => media.id);

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

  public async getFileFromProduct(productId: string, shopApiClient: any) {
    try {
      const response = await shopApiClient.get(`/api/product/${productId}`);
      const customFields = await response.data.data.customFields;

      const productFiles = Object.keys(customFields)
        .filter((key) => {
          const value = customFields[key];
          return (
            key.startsWith('custom_fields_product_file') &&
            value !== null &&
            value !== '' &&
            value !== undefined
          );
        })
        .reduce((obj, key) => {
          obj[key] = customFields[key];
          return obj;
        }, {});

      return productFiles;
    } catch (error) {
      throw error;
    }
  }

  public async processPimProductFile(
    pimProduct: any,
    shopProduct: any,
    pimShopId: string,
    shopApiClient: any,
  ) {
    try {
      let pimProductFileAssignments: any = {};
      let pimProductFileLabelAssignments: any = {};

      for (const shop of pimProduct.custom_item_shop_list) {
        if (shop.shopname === pimShopId) {
          pimProductFileAssignments = {
            file01: pimProduct.custom_file01,
            file02: pimProduct.custom_file02,
            file03: pimProduct.custom_file03,
            file04: pimProduct.custom_file04,
            file05: pimProduct.custom_file05,
            file06: pimProduct.custom_file06,
            file07: pimProduct.custom_file07,
            file08: pimProduct.custom_file08,
          };
          pimProductFileLabelAssignments = {
            file01: pimProduct.custom_label_file01,
            file02: pimProduct.custom_label_file02,
            file03: pimProduct.custom_label_file03,
            file04: pimProduct.custom_label_file04,
            file05: pimProduct.custom_label_file05,
            file06: pimProduct.custom_label_file06,
            file07: pimProduct.custom_label_file07,
            file08: pimProduct.custom_label_file08,
          };
        }
      }

      const shopProductFileList: any = [];

      const allValuesNull = Object.values(pimProductFileAssignments).every(
        (value) => value == false,
      );

      if (allValuesNull) {
        return null;
      }
      for (const pimProductFileAssignment in pimProductFileAssignments) {
        if (!pimProductFileAssignments[pimProductFileAssignment]) {
          continue;
        }

        const fileId = await this.commonService.generateUUID(
          pimProductFileAssignments[pimProductFileAssignment],
        );

        const fileData: any = await this.getShopMediaById(
          fileId,
          shopApiClient,
        );

        if (pimProductFileAssignments[pimProductFileAssignment] != null) {
          if (fileData != null) {
            const fileInfo = fileData.id;
            const fileLabel =
              pimProductFileLabelAssignments[pimProductFileAssignment];

            await this.createFileObject(
              fileId,
              fileLabel,
              pimProduct.item_name,
              shopApiClient,
            );
            await this.createProductFileAssociation(
              shopProduct.id,
              fileId,
              pimProductFileAssignment,
              shopApiClient,
            );
            shopProductFileList.push(fileInfo);
            continue;
          } else {
            const fileLabel =
              pimProductFileLabelAssignments[pimProductFileAssignment];
            if (
              pimProductFileAssignments.hasOwnProperty(pimProductFileAssignment)
            ) {
              // const fileLabel =
              //   pimProductFileLabelAssignments[pimProductFileAssignment];

              await this.createFileObject(
                fileId,
                fileLabel,
                pimProduct.item_name,
                shopApiClient,
              );
              await this.createProductFileAssociation(
                shopProduct.id,
                fileId,
                pimProductFileAssignment,
                shopApiClient,
              );
              shopProductFileList.push(fileId);
            }

            await this.attachFileRessourceToFileObject(
              fileId,
              fileLabel,
              pimProduct.item_name,
              pimProductFileAssignments[pimProductFileAssignment],
              pimShopId,
            );
          }
        }
      }
      return shopProductFileList;
    } catch (error) {
      console.log('Error processing file', error.response.data.errors[0]);
      return null;
    }
  }

  public async removeShopProductFile(
    shopProduct: any,
    pimProduct: any,
    pimShopId: string,
    shopApiClient: any,
  ) {
    try {
      if (!shopProduct) {
        return null;
      }

      let pimProductFileAssignments: any = {};
      for (const shop of pimProduct.custom_item_shop_list) {
        if (shop.shopname === pimShopId) {
          pimProductFileAssignments = {
            file01: pimProduct.custom_file01,
            file02: pimProduct.custom_file02,
            file03: pimProduct.custom_file03,
            file04: pimProduct.custom_file04,
            file05: pimProduct.custom_file05,
            file06: pimProduct.custom_file06,
            file07: pimProduct.custom_file07,
            file08: pimProduct.custom_file08,
          };
          break;
        }
      }

      const productFileData = await this.getFileFromProduct(
        shopProduct.id,
        shopApiClient,
      );

      const updatedPimProductFileAssignments = {};

      for (const [key, value] of Object.entries(pimProductFileAssignments)) {
        if (typeof value === 'string' && value.trim() !== '') {
          const uuid = await this.commonService.generateUUID(value);
          updatedPimProductFileAssignments[key] = uuid;
        } else {
          updatedPimProductFileAssignments[key] = value;
        }
      }

      const mismatchedFiles = {};

      for (const [key, value] of Object.entries(productFileData)) {
        const fileNumber = key.replace('custom_fields_product_file', '');
        const pimValue = pimProductFileAssignments[`file${fileNumber}`];

        if (
          value !== pimValue &&
          (pimValue === '' || pimValue === undefined || pimValue === null)
        ) {
          mismatchedFiles[key] = '';
        }
      }

      if (
        Object.keys(mismatchedFiles).length !== 0 &&
        mismatchedFiles.constructor === Object
      ) {
        await shopApiClient.patch(`/api/product/${shopProduct.id}`, {
          customFields: mismatchedFiles,
        });
      }
    } catch (error) {
      console.log('Error removing file', error.response.data.errors[0]);
    }
  }
}
