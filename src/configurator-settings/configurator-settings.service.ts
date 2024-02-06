import { Injectable } from '@nestjs/common';
import { PropertiesService } from '../properties/properties.service';

@Injectable()
export class ConfiguratorSettingsService {
  constructor(public readonly propertiesService: PropertiesService) {}
  public async getShopConfiguratorSettings(shopApiClient: any) {
    try {
      const response = await shopApiClient.get(
        `/api/product-configurator-setting`,
      );

      const allConfiguratorSettingsData = await response.data.data;

      return allConfiguratorSettingsData;
    } catch (error) {
      throw error;
    }
  }

  public async getShopConfiguratorSettingById(
    configuratorSettingId: string,
    shopApiClient: any,
  ) {
    const response = await shopApiClient.get(
      `/api/product-configurator-setting/${configuratorSettingId}`,
    );
    const configuratorSettingData = await response.data.data;

    return configuratorSettingData;
  }

  public async deleteShopConfiguratorSetting(
    configuratorSettingId: string,
    shopApiClient: any,
  ) {
    const response = await shopApiClient.delete(
      `/api/product-configurator-setting/${configuratorSettingId}`,
    );
    const deletedConfiguratorSetting = response.data;

    return deletedConfiguratorSetting;
  }

  public async createShopConfiguratorSetting(
    configuratorSettingName: string,
    shopApiClient: any,
  ) {
    const allConfiguratorSettingsData =
      await this.getShopConfiguratorSettings(shopApiClient);
    const configuratorSettingExists = allConfiguratorSettingsData.some(
      (obj) => obj.name === configuratorSettingName,
    );
    if (configuratorSettingExists) {
      console.log('ConfiguratorSetting already exists');
    } else {
      const response = await shopApiClient.post(
        '/api/product-configurator-setting?_response=basic',
        {
          name: configuratorSettingName,
        },
      );
      const createdConfiguratorSetting = response.data.data;

      return createdConfiguratorSetting;
    }
  }

  public async updateShopConfiguratorSetting(
    configuratorSettingId: string,
    configuratorSettingName: string,
    shopApiClient: any,
  ) {
    const response = await shopApiClient.patch(
      `/api/product-configurator-setting/${configuratorSettingId}?_response=basic`,
      {
        name: configuratorSettingName,
      },
    );
    const updatedConfiguratorSetting = response.data.data;

    return updatedConfiguratorSetting;
  }

  public async getShopConfiguratorSettingByName(
    shopApiClient: any,
    configuratorSettingName: string,
  ) {
    const response = await shopApiClient.get(
      `/api/product-configurator-setting`,
    );
    const configuratorSettings = response.data.data;

    for (const configuratorSetting of configuratorSettings) {
      if (configuratorSetting.name === configuratorSettingName) {
        return configuratorSetting;
      }
    }
    return null;
  }

  public async getShopProductConfiguratorSettings(
    productId: string,
    shopApiClient: any,
  ) {
    const response = await shopApiClient.get(
      `/api/product/${productId}/configurator-settings/`,
    );
    const configuratorSettingData = await response.data.data;

    return configuratorSettingData;
  }

  public async getShopProductConfiguratorSettingByOptionId(
    productId: string,
    optionId: string,
    shopApiClient: any,
  ) {
    try {
      const response = await shopApiClient.get(
        `/api/product/${productId}/configurator-settings?filter[optionId]=${optionId}`,
      );

      if (response.data.data.length > 0) {
        const configuratorSettingData = response.data.data;
        return configuratorSettingData[0];
      }
      return null;
    } catch (error) {
      console.log('ConfiguratorSettingByOptionId not found');
      return null;
    }
  }

  public async getShopProductConfiguratorSettingById(
    productId: string,
    configuratorSettingId: string,
    shopApiClient: any,
  ) {
    const response = await shopApiClient.get(
      `/api/product/${productId}/configurator-settings/${configuratorSettingId}`,
    );
    const configuratorSettingData = await response.data.data;

    return configuratorSettingData;
  }

  public async deleteShopProductConfiguratorSetting(
    productId: string,
    configuratorSettingId: string,
    shopApiClient: any,
  ): Promise<any> {
    const response = await shopApiClient.delete(
      `/api/product/${productId}/configurator-settings/${configuratorSettingId}`,
    );
    return response;
  }

  public async createShopProductConfiguratorSetting(
    productId: string,
    configuratorSettingName: string,
    shopApiClient: any,
  ) {
    const allConfiguratorSettingsData =
      await this.getShopConfiguratorSettings(shopApiClient);
    const configuratorSettingExists = allConfiguratorSettingsData.some(
      (obj) => obj.name === configuratorSettingName,
    );
    if (configuratorSettingExists) {
      console.log('ConfiguratorSetting already exists');
    } else {
      const response = await shopApiClient.post(
        `/api/product/${productId}/configurator-settings?_response=basic`,
        {
          name: configuratorSettingName,
        },
      );
      const createdConfiguratorSetting = response.data.data;

      return createdConfiguratorSetting;
    }
  }

  public async updateShopProductConfiguratorSetting(
    productId: string,
    configuratorSettingId: string,
    configuratorSettingName: string,
    shopApiClient: any,
  ) {
    const response = await shopApiClient.patch(
      `/api/product/${productId}/configurator-settings/${configuratorSettingId}?_response=basic`,
      {
        name: configuratorSettingName,
      },
    );
    const updatedConfiguratorSetting = response.data.data;

    return updatedConfiguratorSetting;
  }
}
