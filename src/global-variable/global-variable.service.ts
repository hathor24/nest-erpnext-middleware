import { Injectable } from '@nestjs/common';
import { ProductsService } from '../products/products.service';

@Injectable()
export class GlobalVariableService {
  constructor(private readonly productsService: ProductsService) {}
  public shopApiClient: any =
    this.productsService.createShopApiClientByShopId('e1f90c392b');
}
