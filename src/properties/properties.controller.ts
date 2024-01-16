import { Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { GlobalVariableService } from '../global-variable/global-variable.service';
import { PropertiesService } from '../properties/properties.service';

@Controller('properties')
export class PropertiesController {
  constructor(
    private readonly propertiesService: PropertiesService,
    private readonly globalVariableService: GlobalVariableService,
  ) {}

  /** Property Groups */
  @Get('groups')
  async getShopPropertyGroups() {
    const shopApiClient = await this.globalVariableService.shopApiClient;
    const allPropertyGroups =
      await this.propertiesService.getShopPropertyGroups(shopApiClient);
    return allPropertyGroups;
  }

  @Get('groups/:propertyGroupId')
  async getShopPropertyGroupById(
    @Param('propertyGroupId') propertyGroupId: string,
  ) {
    const shopApiClient = await this.globalVariableService.shopApiClient;

    const propertyGroup = await this.propertiesService.getShopPropertyGroupById(
      propertyGroupId,
      shopApiClient,
    );
    return propertyGroup;
  }

  @Delete('groups/:propertyGroupId')
  async deleteShopPropertyGroup(
    @Param('propertyGroupId') propertyGroupId: string,
  ) {
    const shopApiClient = await this.globalVariableService.shopApiClient;
    const deletedPropertyGroup =
      await this.propertiesService.deleteShopPropertyGroupById(
        propertyGroupId,
        shopApiClient,
      );
    return deletedPropertyGroup;
  }

  @Post('groups/:propertyGroupName')
  async createShopPropertyGroup(
    @Param('propertyGroupName') propertyGroupName: string,
  ) {
    const shopApiClient = await this.globalVariableService.shopApiClient;
    const createdPropertyGroup =
      await this.propertiesService.createShopPropertyGroup(
        propertyGroupName,
        shopApiClient,
      );
    return createdPropertyGroup;
  }

  @Patch('groups/:propertyGroupId/:propertyGroupName')
  async updateShopPropertyGroup(
    @Param('propertyGroupId') propertyGroupId: string,
    @Param('propertyGroupName') propertyGroupName: string,
  ) {
    const shopApiClient = await this.globalVariableService.shopApiClient;
    const updatedPropertyGroup =
      await this.propertiesService.updateShopPropertyGroup(
        propertyGroupId,
        propertyGroupName,
        shopApiClient,
      );
    return updatedPropertyGroup;
  }

  /** Property Group Options */
  @Get('groupOptions')
  async getShopPropertyGroupOptions() {
    const shopApiClient = await this.globalVariableService.shopApiClient;
    const allPropertyGroupOptions =
      await this.propertiesService.getShopPropertyGroupOptions(shopApiClient);
    return allPropertyGroupOptions;
  }

  @Get('groupOptions/:propertyGroupOptionId')
  async getShopPropertyGroupOptionById(
    @Param('propertyGroupOptionId') propertyGroupOptionId: string,
  ) {
    const shopApiClient = await this.globalVariableService.shopApiClient;

    const propertyGroupOption =
      await this.propertiesService.getShopPropertyGroupOptionById(
        propertyGroupOptionId,
        shopApiClient,
      );
    return propertyGroupOption;
  }

  @Delete('groupOptions/:propertyGroupOptionId')
  async deleteShopPropertyGroupOptionById(
    @Param('propertyGroupOptionId') propertyGroupOptionId: string,
  ) {
    const shopApiClient = await this.globalVariableService.shopApiClient;
    const deletedPropertyGroupOption =
      await this.propertiesService.deleteShopPropertyGroupOptionById(
        propertyGroupOptionId,
        shopApiClient,
      );
    return deletedPropertyGroupOption;
  }

  @Post('groupOptions/:propertyGroupOptionName')
  async createShopPropertyGroupOption(
    @Param('propertyGroupOptionName') propertyGroupOptionName: string,
  ) {
    const shopApiClient = await this.globalVariableService.shopApiClient;
    const createdPropertyGroupOption =
      await this.propertiesService.createShopPropertyGroupOption(
        propertyGroupOptionName,
        shopApiClient,
      );
    return createdPropertyGroupOption;
  }

  @Patch('groupOptions/:propertyGroupOptionId/:propertyGroupOptionName')
  async updateShopPropertyGroupOptionByIdAndGroupId(
    @Param('propertyGroupOptionId') propertyGroupOptionId: string,
    @Param('propertyGroupOptionName') propertyGroupOptionName: string,
  ) {
    const shopApiClient = await this.globalVariableService.shopApiClient;
    const updatedPropertyGroupOption =
      await this.propertiesService.updateShopPropertyGroupOptionById(
        propertyGroupOptionId,
        propertyGroupOptionName,
        shopApiClient,
      );
    return updatedPropertyGroupOption;
  }
}
