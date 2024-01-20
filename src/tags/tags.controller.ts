import { Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { TagsService } from './tags.service';
import { GlobalVariableService } from '../global-variable/global-variable.service';

@Controller('tags')
export class TagsController {
  constructor(
    private readonly tagsService: TagsService,
    private readonly globalVariableService: GlobalVariableService,
  ) {}
  @Get('')
  async getShopTags() {
    const shopApiClient = await this.globalVariableService.shopApiClient;
    const allTags = await this.tagsService.getShopTags(shopApiClient);
    return allTags;
  }
  @Get(':tagId')
  async getShopTagById(@Param('tagId') tagId: string) {
    const shopApiClient = await this.globalVariableService.shopApiClient;

    const tag = await this.tagsService.getShopTagById(tagId, shopApiClient);
    return tag;
  }
  @Delete(':tagId')
  async deleteShopTag(@Param('tagId') tagId: string) {
    const shopApiClient = await this.globalVariableService.shopApiClient;
    const deletedTag = await this.tagsService.deleteShopTag(
      tagId,
      shopApiClient,
    );
    return deletedTag;
  }
  @Post(':tagShortCode/:tagName')
  async createShopTag(
    @Param('tagShortCode') tagShortCode: string,
    @Param('tagName') tagName: string,
  ) {
    const shopApiClient = await this.globalVariableService.shopApiClient;
    const createdTag = await this.tagsService.createShopTag(
      tagName,
      shopApiClient,
    );
    return createdTag;
  }
  @Patch(':tagId/:tagName')
  async updateTag(
    @Param('tagId') tagId: string,
    @Param('tagName') tagName: string,
  ) {
    const shopApiClient = await this.globalVariableService.shopApiClient;
    const updatedTag = await this.tagsService.updateShopTag(
      tagId,
      tagName,
      shopApiClient,
    );
    return updatedTag;
  }
}
