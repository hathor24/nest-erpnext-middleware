import { Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ManufacturersService } from './manufacturers.service';
import { GlobalVariableService } from '../global-variable/global-variable.service';

@Controller('manufacturers')
export class ManufacturersController {
  constructor(
    private readonly manufacturersService: ManufacturersService,
    private readonly globalVariableService: GlobalVariableService,
  ) {}

  @Get('')
  async getShopManufacturers() {
    const shopApiClient = await this.globalVariableService.shopApiClient;
    const allManufacturers =
      await this.manufacturersService.getShopManufacturers(shopApiClient);
    return allManufacturers;
  }
  @Get(':manufacturerId')
  async getShopManufacturerById(
    @Param('manufacturerId') manufacturerId: string,
  ) {
    const shopApiClient = await this.globalVariableService.shopApiClient;

    const manufacturer =
      await this.manufacturersService.getShopManufacturerById(
        manufacturerId,
        shopApiClient,
      );
    return manufacturer;
  }
  @Delete(':manufacturerId')
  async deleteShopManufacturer(
    @Param('manufacturerId') manufacturerId: string,
  ) {
    const shopApiClient = await this.globalVariableService.shopApiClient;
    const deletedManufacturer =
      await this.manufacturersService.deleteShopManufacturer(
        manufacturerId,
        shopApiClient,
      );
    return deletedManufacturer;
  }
  @Post(':manufacturerName')
  async createShopManufacturer(
    @Param('manufacturerName') manufacturerName: string,
  ) {
    const shopApiClient = await this.globalVariableService.shopApiClient;
    const createdManufacturer =
      await this.manufacturersService.createShopManufacturer(
        manufacturerName,
        shopApiClient,
      );
    return createdManufacturer;
  }
  @Patch(':manufacturerId/:manufacturerName')
  async updateShopManufacturer(
    @Param('manufacturerId') manufacturerId: string,
    @Param('manufacturerName') manufacturerName: string,
  ) {
    const shopApiClient = await this.globalVariableService.shopApiClient;
    const updatedManufacturer =
      await this.manufacturersService.updateShopManufacturer(
        manufacturerId,
        manufacturerName,
        shopApiClient,
      );
    return updatedManufacturer;
  }
}
