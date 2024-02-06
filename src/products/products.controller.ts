import { Controller, Get, Param } from '@nestjs/common';
import { ProductsService } from './products.service';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get('/erp/:productNumber')
  async getProductFromERP(@Param('productNumber') productNumber: string) {
    const erpProduct =
      await this.productsService.getPimProductByName(productNumber);
    return erpProduct;
  }
}
