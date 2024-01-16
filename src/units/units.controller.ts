import { Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { UnitsService } from './units.service';
import { GlobalVariableService } from '../global-variable/global-variable.service';

@Controller('units')
export class UnitsController {
  constructor(
    private readonly unitsService: UnitsService,
    private readonly globalVariableService: GlobalVariableService,
  ) {}

  @Get('')
  async getShopUnits() {
    const shopApiClient = await this.globalVariableService.shopApiClient;
    const allUnits = await this.unitsService.getShopUnits(shopApiClient);
    return allUnits;
  }
  @Get(':unitId')
  async getShopUnitById(@Param('unitId') unitId: string) {
    const shopApiClient = await this.globalVariableService.shopApiClient;

    const unit = await this.unitsService.getShopUnitById(unitId, shopApiClient);
    return unit;
  }
  @Delete(':unitId')
  async deleteShopUnit(@Param('unitId') unitId: string) {
    const shopApiClient = await this.globalVariableService.shopApiClient;
    const deletedUnit = await this.unitsService.deleteShopUnit(
      unitId,
      shopApiClient,
    );
    return deletedUnit;
  }
  @Post(':unitShortCode/:unitName')
  async createShopUnit(
    @Param('unitShortCode') unitShortCode: string,
    @Param('unitName') unitName: string,
  ) {
    const shopApiClient = await this.globalVariableService.shopApiClient;
    const createdUnit = await this.unitsService.createShopUnit(
      unitShortCode,
      unitName,
      shopApiClient,
    );
    return createdUnit;
  }
  @Patch(':unitId/:unitName')
  async updateUnit(
    @Param('unitId') unitId: string,
    @Param('unitName') unitName: string,
  ) {
    const shopApiClient = await this.globalVariableService.shopApiClient;
    const updatedUnit = await this.unitsService.updateShopUnit(
      unitId,
      unitName,
      shopApiClient,
    );
    return updatedUnit;
  }
}
