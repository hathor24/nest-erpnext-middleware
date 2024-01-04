import { Injectable } from '@nestjs/common';

@Injectable()
export class ManufacturersService {
  public async getShopManufacturers(shopApiClient: any) {
    try {
      const response = await shopApiClient.get(`/api/product-manufacturer`);

      const allManufacturersData = await response.data.data;

      return allManufacturersData;
    } catch (error) {
      throw error;
    }
  }

  public async getShopManufacturerById(
    manufacturerId: string,
    shopApiClient: any,
  ) {
    const response = await shopApiClient.get(
      `/api/product-manufacturer/${manufacturerId}`,
    );
    const manufacturerData = await response.data.data;

    return manufacturerData;
  }

  public async deleteManufacturer(manufacturerId: string, shopApiClient: any) {
    const response = await shopApiClient.delete(
      `/api/product-manufacturer/${manufacturerId}`,
    );
    const deletedManufacturer = response.data;

    return deletedManufacturer;
  }

  /**
   *
   * @param manufacturerName  <
   * @param shopApiClient
   * @returns
   */
  public async createManufacturer(
    manufacturerName: string,
    shopApiClient: any,
  ) {
    const allManufacturersData = await this.getShopManufacturers(shopApiClient);
    const manufacturerExists = allManufacturersData.some(
      (obj) => obj.name === manufacturerName,
    );
    if (manufacturerExists) {
      console.log('Manufacturer already exists');
    } else {
      const response = await shopApiClient.post(
        '/api/product-manufacturer?_response=basic',
        {
          name: manufacturerName,
        },
      );
      const createdManufacturer = response.data.data;

      return createdManufacturer;
    }
  }

  public async updateManufacturer(
    manufacturerId: string,
    manufacturerName: string,
    shopApiClient: any,
  ) {
    const response = await shopApiClient.patch(
      `/api/product-manufacturer/${manufacturerId}?_response=basic`,
      {
        name: manufacturerName,
      },
    );
    const updatedManufacturer = response.data.data;

    return updatedManufacturer;
  }
}
