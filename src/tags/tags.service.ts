import { Injectable } from '@nestjs/common';

@Injectable()
export class TagsService {
  constructor() {}
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
}
