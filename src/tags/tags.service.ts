import { Injectable } from '@nestjs/common';

@Injectable()
export class TagsService {
  public async getShopTags(shopApiClient: any) {
    try {
      const response = await shopApiClient.get(`/api/tag`);

      const allTagsData = await response.data.data;

      return allTagsData;
    } catch (error) {
      throw error;
    }
  }

  public async getShopTagById(tagId: string, shopApiClient: any) {
    const response = await shopApiClient.get(`/api/tag/${tagId}`);
    const tagData = await response.data.data;

    return tagData;
  }

  public async deleteShopTag(tagId: string, shopApiClient: any) {
    const response = await shopApiClient.delete(`/api/tag/${tagId}`);
    const deletedTag = response.data;

    return deletedTag;
  }

  public async createShopTag(tagName: string, shopApiClient: any) {
    const allTagsData = await this.getShopTags(shopApiClient);
    const tagExists = allTagsData.some((obj) => obj.name === tagName);
    if (tagExists) {
      console.log('Tag already exists');
    } else {
      const response = await shopApiClient.post('/api/tag?_response=basic', {
        name: tagName,
      });
      const createdTag = response.data.data;

      return createdTag;
    }
  }

  public async updateShopTag(
    tagId: string,
    tagName: string,
    shopApiClient: any,
  ) {
    const response = await shopApiClient.patch(
      `/api/tag/${tagId}?_response=basic`,
      {
        name: tagName,
      },
    );
    const updatedTag = response.data.data;

    return updatedTag;
  }

  public async getShopTagByName(shopApiClient: any, tagName: string) {
    const response = await shopApiClient.get(`/api/tag`);
    const tags = response.data.data;

    for (const tag of tags) {
      if (tag.name === tagName) {
        return tag;
      }
    }
    return null;
  }

  public async processPimProductTags(
    pimProduct: any,
    shopProduct: any,
    shopApiClient: any,
  ) {
    try {
      const shopProductTags: any = [];
      const pimProductTags: any = {
        frostWarning: pimProduct.custom_frost_warning,
        bucket: pimProduct.custom_bucket,
        floor: pimProduct.custom_floor,
        hauler: pimProduct.custom_hauler,
        bulk: pimProduct.custom_bulk,
        vegan: pimProduct.custom_vegan,
        noDiscount: pimProduct.custom_no_discount,
      };

      if (
        Object.values(pimProductTags).every((value) => value === 0) &&
        shopProduct &&
        shopProduct.tagIds == null
      ) {
        return null;
      }

      for (const pimProductTag in pimProductTags) {
        const tagData: any = await this.getShopTagByName(
          shopApiClient,
          pimProductTag,
        );

        if (pimProductTags[pimProductTag] == 1) {
          if (tagData !== null) {
            const tagInfo = {
              id: tagData.id,
              name: tagData.name,
            };

            shopProductTags.push(tagInfo);
          } else {
            const createdTag = await this.createShopTag(
              pimProductTag,
              shopApiClient,
            );
            const tagInfo = {
              id: createdTag.id,
              name: createdTag.name,
            };

            shopProductTags.push(tagInfo);
          }
        } else if (
          pimProductTags[pimProductTag] == 0 &&
          tagData &&
          shopProduct &&
          shopProduct.tagIds &&
          shopProduct.tagIds.includes(tagData.id)
        ) {
          await this.removeTagsFromProduct(
            shopApiClient,
            shopProduct.id,
            tagData.id,
          );
        }
      }
      return shopProductTags;
    } catch (error) {
      console.log('Error processing tags');
      return null;
    }
  }
  public async removeTagsFromProduct(
    shopApiClient: any,
    productId: string,
    tagId: string,
  ): Promise<any> {
    const response = await shopApiClient.delete(
      `/api/product/${productId}/tags/${tagId}`,
    );
    return response;
  }
}
