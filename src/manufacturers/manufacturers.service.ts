import { HttpException, HttpStatus, Injectable } from '@nestjs/common';

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

  public async getShopManufacturerByName(
    manufacturerName: string,
    shopApiClient: any,
  ) {
    try {
      const response = await shopApiClient.get(
        `/api/product-manufacturer?filter[name]=${manufacturerName}`,
      );
      const manufacturerData = response.data.data[0];
      return manufacturerData;
    } catch (error) {
      throw new HttpException('Manufacturer not found', HttpStatus.NOT_FOUND);

      console.log('Manufacturer not found');
      return null;
    }
  }

  public async deleteShopManufacturer(
    manufacturerId: string,
    shopApiClient: any,
  ) {
    const response = await shopApiClient.delete(
      `/api/product-manufacturer/${manufacturerId}`,
    );
    const deletedManufacturer = response.data;

    return deletedManufacturer;
  }

  public async createShopManufacturer(
    manufacturerName: string,
    shopApiClient: any,
  ) {
    try {
      const manufacturer = await this.getShopManufacturerByName(
        manufacturerName,
        shopApiClient,
      );
      if (manufacturer) {
        throw new HttpException(
          'Manufacturer already exists',
          HttpStatus.CONFLICT,
        );
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
    } catch (error) {
      console.error('Error creating manufacturer:', error);
      throw error;
    }
  }

  public async updateShopManufacturer(
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

  public async getOrCreateShopManufacturer(
    manufacturerName: string,
    shopApiClient: any,
  ) {
    let manufacturer = await this.getShopManufacturerByName(
      manufacturerName,
      shopApiClient,
    );

    if (!manufacturer) {
      manufacturer = await this.createShopManufacturer(
        manufacturerName,
        shopApiClient,
      );
    }

    return manufacturer;
  }
}
