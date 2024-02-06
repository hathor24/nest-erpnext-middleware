import { Injectable } from '@nestjs/common';
import { ShopsService } from '../shops/shops.service';

@Injectable()
export class GlobalVariableService {
  constructor(private readonly shopsService: ShopsService) {}
  public shopApiClient: any =
    this.shopsService.createShopApiClientByShopId('e1f90c392b');
}
