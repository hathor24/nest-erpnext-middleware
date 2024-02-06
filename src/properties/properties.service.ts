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

  public async getShopProductPropertyOption(
    attribute: any,
    shopApiClient: any,
  ) {
    try {
      let shopPropertyGroupData = await this.getShopPropertyGroupByName(
        shopApiClient,
        attribute.attribute,
      );
      if (!shopPropertyGroupData) {
        shopPropertyGroupData = await this.createShopPropertyGroup(
          attribute.attribute,
          shopApiClient,
        );
      }
      let shopPropertyGroupOptionData =
        await this.getShopPropertyGroupOptionByName(
          shopApiClient,
          attribute.attribute_value,
          shopPropertyGroupData.id,
        );
      if (!shopPropertyGroupOptionData) {
        shopPropertyGroupOptionData =
          await this.createShopPropertyGroupOptionByGroupId(
            shopApiClient,
            attribute.attribute_value,
            shopPropertyGroupData.id,
          );
      }
      return shopPropertyGroupOptionData;
    } catch (error) {
      // console.log(error);
      return null;
    }
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

  //Autovervollständigung
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
      // console.log(error.response.data);
      throw error;
    }
  }
  public async processPimProductProperties(
    productData: any,
    shopProduct: any,
    shopApiClient: any,
  ) {
    try {
      const shopProductProperties: any = [];
      const pimProductPropertyIds: any = [];
      const pimProductProperties: any = productData.custom_properties;

      for (const pimProductProperty of pimProductProperties) {
        const shopPropertyGroupData = await this.getShopPropertyGroupByName(
          shopApiClient,
          pimProductProperty.property,
        );

        if (shopPropertyGroupData != null) {
          const shopPropertyGroupOptionData =
            await this.getShopPropertyGroupOptionByName(
              shopApiClient,
              pimProductProperty.property_value,
              shopPropertyGroupData.id,
            );
          if (shopPropertyGroupOptionData != null) {
            const shopPropertyOption = {
              id: shopPropertyGroupOptionData.id,
              name: shopPropertyGroupOptionData.name,
              groupId: shopPropertyGroupOptionData.groupId,
            };

            shopProductProperties.push(shopPropertyOption);
            pimProductPropertyIds.push(shopPropertyGroupOptionData.id);
          } else {
            const createdPropertyGroupOption =
              await this.createShopPropertyGroupOptionByGroupId(
                shopApiClient,
                pimProductProperty.property_value,
                shopPropertyGroupData.id,
              );

            const shopPropertyOption = {
              id: createdPropertyGroupOption.id,
              name: createdPropertyGroupOption.name,
              groupId: createdPropertyGroupOption.groupId,
            };
            shopProductProperties.push(shopPropertyOption);
          }
        } else {
          const createdPropertyGroup = await this.createShopPropertyGroup(
            pimProductProperty.property,
            shopApiClient,
          );

          const createdPropertyGroupOption =
            await this.createShopPropertyGroupOptionByGroupId(
              shopApiClient,
              pimProductProperty.property_value,
              createdPropertyGroup.id,
            );

          const shopPropertyOption = {
            id: createdPropertyGroupOption.id,
            name: createdPropertyGroupOption.name,
            groupId: createdPropertyGroup.id,
          };
          shopProductProperties.push(shopPropertyOption);
        }
      }
      if (shopProduct) {
        for (const shopProductPropertyId of shopProduct.propertyIds) {
          if (
            !pimProductPropertyIds.includes(shopProductPropertyId) &&
            shopProduct.parentId == null
          ) {
            await this.removePropertiesFromProduct(
              shopApiClient,
              shopProduct.id,
              shopProductPropertyId,
            );
          }
        }
      }
      return shopProductProperties;
    } catch (error) {
      // console.log(error);
      return null;
    }
  }
  public async processPimProductPropertyOptions(
    productData: any,
    shopApiClient: any,
  ) {
    try {
      if (!productData.variant_of) return null;
      const shopProductPropertyOptions: any = [];
      for (const attribute of productData.attributes) {
        const option: any = await this.getShopProductPropertyOption(
          attribute,
          shopApiClient,
        );
        shopProductPropertyOptions.push({ id: option.id });
      }
      return shopProductPropertyOptions;
    } catch (error) {
      // console.log(error);
      return null;
    }
  }

  public async removePropertiesFromProduct(
    shopApiClient: any,
    productId: string,
    propertyId: string,
  ): Promise<any> {
    const response = await shopApiClient.delete(
      `/api/product/${productId}/properties/${propertyId}`,
    );
    return response;
  }
}
