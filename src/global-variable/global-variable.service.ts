import { Injectable } from '@nestjs/common';
import { ShopsService } from '../shops/shops.service';

@Injectable()
export class GlobalVariableService {
  constructor(private readonly shopsService: ShopsService) {}
  public shopApiClient: any =
    this.shopsService.createShopApiClientByShopId('0d2c0da098');
}
