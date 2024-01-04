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
  @Get('/:manufacturerId')
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
  async deleteManufacturer(@Param('manufacturerId') manufacturerId: string) {
    const shopApiClient = await this.globalVariableService.shopApiClient;
    const deletedManufacturer =
      await this.manufacturersService.deleteManufacturer(
        manufacturerId,
        shopApiClient,
      );
    return deletedManufacturer;
  }
  @Post(':manufacturerName')
  async createManufacturer(
    @Param('manufacturerName') manufacturerName: string,
  ) {
    const shopApiClient = await this.globalVariableService.shopApiClient;
    const createdManufacturer =
      await this.manufacturersService.createManufacturer(
        manufacturerName,
        shopApiClient,
      );
    return createdManufacturer;
  }
  @Patch('/:manufacturerId/:manufacturerName')
  async updateManufacturer(
    @Param('manufacturerId') manufacturerId: string,
    @Param('manufacturerName') manufacturerName: string,
  ) {
    const shopApiClient = await this.globalVariableService.shopApiClient;
    const createdManufacturer =
      await this.manufacturersService.updateManufacturer(
        manufacturerId,
        manufacturerName,
        shopApiClient,
      );
    return createdManufacturer;
  }
}
