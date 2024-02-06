import { Injectable } from '@nestjs/common';
import erpApiClient from '../api/erp-api-client';

@Injectable()
export class UnitsService {
  public async getShopUnits(shopApiClient: any) {
    try {
      const response = await shopApiClient.get(`/api/unit`);
      const allUnitsData = await response.data.data;

      return allUnitsData;
    } catch (error) {
      throw error;
    }
  }

  public async getShopUnitById(unitId: string, shopApiClient: any) {
    const response = await shopApiClient.get(`/api/unit/${unitId}`);
    const unitData = await response.data.data;

    return unitData;
  }

  public async getShopUnitByName(unitName: string, shopApiClient: any) {
    try {
      const response = await shopApiClient.get(
        `/api/unit?filter[name]=${unitName}`,
      );
      const unitData = response.data.data[0];
      console.log(unitData);
      return unitData;
    } catch (error) {
      console.log('Unit not found');
      return null;
    }
  }

  public async deleteShopUnit(unitId: string, shopApiClient: any) {
    const response = await shopApiClient.delete(`/api/unit/${unitId}`);
    const deletedUnit = response.data;

    return deletedUnit;
  }

  public async createShopUnit(
    unitShortCode: string,
    unitName: string,
    shopApiClient: any,
  ) {
    const allUnitsData = await this.getShopUnits(shopApiClient);
    const unitExists = allUnitsData.some((obj) => obj.name === unitName);
    if (unitExists) {
      console.log('Unit already exists');
    } else {
      const response = await shopApiClient.post('/api/unit?_response=basic', {
        shortCode: unitShortCode,
        name: unitName,
      });
      const createdUnit = response.data.data;

      return createdUnit;
    }
  }

  public async updateShopUnit(
    unitId: string,
    unitName: string,
    shopApiClient: any,
  ) {
    const response = await shopApiClient.patch(
      `/api/unit/${unitId}?_response=basic`,
      {
        name: unitName,
      },
    );
    const updatedUnit = response.data.data;

    return updatedUnit;
  }
  public async getPimUnitDataByUnitName(unitName: string) {
    const response = await erpApiClient.get(`/UOM/${unitName}`);

    const unitData = await response.data.data;

    return unitData;
  }
  public async processPimProductUnit(productData: any, shopApiClient: any) {
    let unit: any = null;
    const unitName = productData.stock_uom;
    const pimUnitData = await this.getPimUnitDataByUnitName(unitName);
    let unitShortCode = null;
    if (!pimUnitData.custom_uom_short_code) {
      unitShortCode = 'NA';
    } else {
      unitShortCode = pimUnitData.custom_uom_short_code;
    }

    const allUnitsData = await this.getShopUnits(shopApiClient);
    const unitData = allUnitsData.find((obj) => obj.name === unitName);
    if (unitData) {
      unit = unitData;
    } else {
      const createdUnit = await this.createShopUnit(
        unitShortCode,
        unitName,
        shopApiClient,
      );
      unit = createdUnit;
    }
    return unit;
  }
}
