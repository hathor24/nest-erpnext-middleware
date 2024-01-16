import { Injectable } from '@nestjs/common';
import { ProductsService } from '../products/products.service';

@Injectable()
export class GlobalVariableService {
  constructor(private readonly productsService: ProductsService) {}
  public shopApiClient: any =
    this.productsService.createShopApiClientByShopId('db0931d4e7');
}
