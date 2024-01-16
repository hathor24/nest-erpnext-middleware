import { Injectable } from '@nestjs/common';
import erpApiClient from '../api/erp-api-client';

interface ShopApiClient {
  get(path: string): Promise<any>;
  post(path: string, data: any): Promise<any>;
}

interface PropertyGroup {
  id: string;
  name: string;
}

interface PropertyValue {
  id: string;
  name: string;
  groupId: string;
}

@Injectable()
export class PropertiesService {
  constructor() {}
  public async getPimPropertyDataById(propertyId: string) {
    const response = await erpApiClient.get(`/Property/${propertyId}`);

    const propertyData = await response.data.data;

    return propertyData;
  }
  public async getPimPropertyValueDataById(propertyValueId: string) {
    const response = await erpApiClient.get(
      `/Property%20Value/${propertyValueId}`,
    );

    const propertyValueData = await response.data.data;

    return propertyValueData;
  }

  public async getOrCreatePropertyGroupAndValue(
    shopApiClient: ShopApiClient,
    propertyGroupName: string,
    propertyValueName: string,
  ): Promise<any> {
    let propertyGroup = await this.getShopPropertyGroupByName(
      shopApiClient,
      propertyGroupName,
    );

    if (!propertyGroup) {
      await this.createShopPropertyGroup(propertyGroupName, shopApiClient);
      propertyGroup = await this.getShopPropertyGroupByName(
        shopApiClient,
        propertyGroupName,
      );
    }

    let propertyValue = await this.getShopPropertyGroupOptionByName(
      shopApiClient,
      propertyValueName,
      propertyGroup.id,
    );

    if (!propertyValue) {
      await this.createShopPropertyGroupOptionByGroupId(
        shopApiClient,
        propertyValueName,
        propertyGroup.id,
      );
      propertyValue = await this.getShopPropertyGroupOptionByName(
        shopApiClient,
        propertyValueName,
        propertyGroup.id,
      );
    }

    return propertyValue;
  }

  /** Property Groups */
  public async getShopPropertyGroups(shopApiClient: any) {
    try {
      const response = await shopApiClient.get(`/api/property-group`);

      const allPropertyGroupsData = await response.data.data;

      return allPropertyGroupsData;
    } catch (error) {
      throw error;
    }
  }

  public async getShopPropertyGroupById(
    propertyGroupId: string,
    shopApiClient: any,
  ) {
    const response = await shopApiClient.get(
      `/api/property-group/${propertyGroupId}`,
    );
    const propertyGroupData = await response.data.data;

    return propertyGroupData;
  }

  public async getShopPropertyGroupByName(
    shopApiClient: ShopApiClient,
    propertyGroupName: string,
  ): Promise<PropertyGroup | null> {
    const response = await shopApiClient.get('/api/property-group');
    const propertyGroups = response.data.data;

    for (const propertyGroup of propertyGroups) {
      if (propertyGroup.name === propertyGroupName) {
        return propertyGroup;
      }
    }

    return null;
  }

  public async deleteShopPropertyGroupById(
    propertyGroupId: string,
    shopApiClient: any,
  ) {
    const response = await shopApiClient.delete(
      `/api/property-group/${propertyGroupId}`,
    );
    const deletedPropertyGroup = response.data;

    return deletedPropertyGroup;
  }

  public async createShopPropertyGroup(
    propertyGroupName: string,
    shopApiClient: any,
  ) {
    const allPropertyGroupsData =
      await this.getShopPropertyGroups(shopApiClient);
    const propertyGroupExists = allPropertyGroupsData.some(
      (obj) => obj.name === propertyGroupName,
    );
    if (propertyGroupExists) {
      console.log('PropertyGroup already exists');
    } else {
      const response = await shopApiClient.post(
        '/api/property-group?_response=basic',
        {
          name: propertyGroupName,
          displayType: 'text',
          sortingType: 'name',
        },
      );
      const createdPropertyGroup = response.data.data;

      return createdPropertyGroup;
    }
  }

  public async updateShopPropertyGroup(
    propertyGroupId: string,
    propertyGroupName: string,
    shopApiClient: any,
  ) {
    const response = await shopApiClient.patch(
      `/api/property-group/${propertyGroupId}?_response=basic`,
      {
        name: propertyGroupName,
      },
    );
    const updatedPropertyGroup = response.data.data;

    return updatedPropertyGroup;
  }

  /** Property Group Options */

  public async getShopPropertyGroupOptions(shopApiClient: any) {
    try {
      const response = await shopApiClient.get(`/api/property-group-option`);

      const allPropertyGroupOptionsData = await response.data.data;

      return allPropertyGroupOptionsData;
    } catch (error) {
      throw error;
    }
  }

  public async getShopPropertyGroupOptionById(
    propertyGroupOptionId: string,
    shopApiClient: any,
  ) {
    const response = await shopApiClient.get(
      `/api/property-group-option/${propertyGroupOptionId}`,
    );
    const propertyGroupOptionData = await response.data.data;

    return propertyGroupOptionData;
  }

  public async getShopPropertyGroupOptionByName(
    shopApiClient: ShopApiClient,
    propertyValueName: string,
    propertyGroupId: string,
  ): Promise<PropertyValue | null> {
    const response = await shopApiClient.get('/api/property-group-option');
    const propertyValues = response.data.data;

    for (const propertyValue of propertyValues) {
      if (
        propertyValue.name === propertyValueName &&
        propertyValue.groupId === propertyGroupId
      ) {
        return propertyValue;
      }
    }

    return null;
  }

  public async deleteShopPropertyGroupOptionById(
    propertyGroupOptionId: string,
    shopApiClient: any,
  ) {
    const response = await shopApiClient.delete(
      `/api/property-group-option/${propertyGroupOptionId}`,
    );
    const deletedPropertyGroupOption = response.data;

    return deletedPropertyGroupOption;
  }

  public async createShopPropertyGroupOption(
    propertyGroupOptionName: string,
    shopApiClient: any,
  ) {
    const allPropertyGroupOptionsData =
      await this.getShopPropertyGroupOptions(shopApiClient);
    const propertyGroupOptionExists = allPropertyGroupOptionsData.some(
      (obj) => obj.name === propertyGroupOptionName,
    );
    if (propertyGroupOptionExists) {
      console.log('PropertyGroupOption already exists');
    } else {
      const response = await shopApiClient.post(
        '/api/property-group-option?_response=basic',
        {
          groupId: '018cedce81bc739bac374124fc0213af',
          name: propertyGroupOptionName,
        },
      );
      const createdPropertyGroupOption = response.data.data;

      return createdPropertyGroupOption;
    }
  }

  public async createShopPropertyGroupOptionByGroupId(
    shopApiClient: any,
    propertyGroupOptionName: string,
    propertyGroupId: string,
  ): Promise<any> {
    const data = {
      name: propertyGroupOptionName,
      groupId: propertyGroupId,
    };

    const response = await shopApiClient.post(
      '/api/property-group-option?_response=basic',
      data,
    );
    const createdPropertyGroup = response.data.data;
    return createdPropertyGroup;
  }

  public async updateShopPropertyGroupOptionById(
    propertyGroupOptionId: string,
    propertyGroupOptionName: string,
    shopApiClient: any,
  ) {
    try {
      const response = await shopApiClient.patch(
        `/api/property-group-option/${propertyGroupOptionId}?_response=basic`,
        {
          groupId: '018cedce81bc739bac374124fc0213af',
          name: propertyGroupOptionName,
        },
      );
      const updatedPropertyGroupOption = response.data.data;

      return updatedPropertyGroupOption;
    } catch (error) {
      console.log(error.response.data);
      throw error;
    }
  }
}
