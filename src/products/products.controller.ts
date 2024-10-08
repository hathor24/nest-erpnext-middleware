import { Controller, Get, Param } from '@nestjs/common';
import { ProductsService } from './products.service';
import { ShopsService } from '../shops/shops.service';

@Controller('products')
export class ProductsController {
  constructor(
    private readonly productsService: ProductsService,
    private readonly shopsService: ShopsService,
  ) {}

  @Get('/pim/:productNumber')
  async getProductFromPim(@Param('productNumber') productNumber: string) {
    const pimProduct =
      await this.productsService.getPimProductByName(productNumber);
    return pimProduct;
  }
  @Get('/modified/:shopId')
  async getModifiedProducts(@Param('shopId') shopId: string) {
    const shopApiClient =
      await this.shopsService.createShopApiClientByShopId(shopId);

    const modifiedProducts = await this.productsService.getModifiedProducts(
      shopId,
      shopApiClient,
    );
    return modifiedProducts;
  }
}
