import { Controller, Get, Param } from '@nestjs/common';
import { ProductsService } from './products.service';
// import { ShopsService } from '../shops/shops.service';
// import { ManufacturersService } from '../manufacturers/manufacturers.service';
// import shopApiClient from 'src/api/shop-api-client';
// import axios from 'axios';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get('/erp')
  async getProductsFromErp() {
    const erpProducts = await this.productsService.getProductsFromErp();
    return erpProducts;
  }

  @Get('/erp/:productNumber')
  async getProductFromERP(@Param('productNumber') productNumber: string) {
    const erpProduct =
      await this.productsService.getProductByProductNumberFromErp(
        productNumber,
      );
    return erpProduct;
  }

  @Get('/shop/:productNumber')
  async getProductFromShop(@Param('productNumber') productNumber: string) {
    const shopsProduct =
      await this.productsService.getProductFromShops(productNumber);
    return shopsProduct;
  }

  // @Post('/sync/:productNumber')
  // async syncProductToShops(@Param('productNumber') productNumber: string) {
  //   const syncedShopsProduct =
  //     await this.productsService.syncProductToShops(productNumber);
  //   return syncedShopsProduct;
  // }
  // @Get('/sync/all')
  // async syncAllModifiedProducts() {
  //   try {
  //     const modifiedProducts: any =
  //       await this.productsService.getModifiedProducts();
  //     // console.log(modifiedProducts);

  //     const syncedProducts = [];
  //     for (const product of modifiedProducts) {
  //       const syncedProduct = await this.productsService.syncProductToShops(
  //         product.name,
  //       );

  //       syncedProducts.push(syncedProduct);
  //     }
  //     // console.log('start', syncedProducts, 'end');
  //     return syncedProducts;
  //   } catch (error) {
  //     // console.log(error.response.data);
  //     throw error;
  //   }
  // }

  // @Get('/option/:productNumber')
  // async getOptionListUuids(@Param('productNumber') productNumber: string) {
  //   const token = await this.shopsService.getShopBearerToken(
  //     'http://localhost:8000',
  //     'SWIACE8YUEZWODZPN3PXWTJPCQ',
  //     'dWNpcUFvekN1c3hIN2YzbXZ0ekhMclR1Q0lRa3pWTWJGdnBLODM',
  //   );

  //   const shopApiClient = axios.create({
  //     baseURL: 'http://localhost:8000',
  //     headers: {
  //       Accept: 'application/json',
  //       'Content-Type': 'application/json',
  //       Authorization: `Bearer ${token}`,
  //     },
  //   });
  //   const productOptions = await this.productsService.getOptionListUuids(
  //     productNumber,
  //     shopApiClient,
  //   );

  //   return productOptions;
  // }
  // @Get('/salesChannelInfo/:productNumber')
  // async getSalesChannelInfo(@Param('productNumber') productNumber: string) {
  //   const salesChannelInfo =
  //     await this.productsService.getSalesChannelInfo(productNumber);

  //   return salesChannelInfo;
  // }
  // @Get('/taxInfo/:productNumber')
  // async getStandardTaxInfo(@Param('productNumber') productNumber: string) {
  //   const taxInfo =
  //     await this.productsService.getStandardTaxInfo(productNumber);

  //   return taxInfo;
  // }
  @Get('/configurator/:productNumber')
  async getProductConfiguratorSetting(
    @Param('productNumber') productNumber: string,
    optionId = '018c67ed38e37356af776bf93f1c53e8',
    erpShopId = 'cdd52b1a8b',
  ) {
    // console.log(productNumber, optionId, erpShopId);
    const configuratorId =
      await this.productsService.getProductConfiguratorSetting(
        productNumber,
        optionId,
        erpShopId,
      );

    return configuratorId;
  }
  @Get('/parent/:productId')
  async getParentProductById(
    @Param('productId') productId: string,
    erpShopId = 'cdd52b1a8b',
  ) {
    // console.log(productId, erpShopId);
    const parentProduct = await this.productsService.getParentProductById(
      productId,
      erpShopId,
    );

    return parentProduct;
  }
}
