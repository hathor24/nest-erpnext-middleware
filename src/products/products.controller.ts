import { Controller, Get, Param, Post } from '@nestjs/common';
import { ProductsService } from './products.service';

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
      await this.productsService.getProductFromErp(productNumber);
    return erpProduct;
  }

  @Get('/shop/:productNumber')
  async getProductFromShop(@Param('productNumber') productNumber: string) {
    const shopsProduct =
      await this.productsService.getProductFromShops(productNumber);
    return shopsProduct;
  }

  @Post('/sync/:productNumber')
  async syncProductToShops(@Param('productNumber') productNumber: string) {
    const syncedShopsProduct =
      await this.productsService.syncProductToShops(productNumber);
    return syncedShopsProduct;
  }
  @Get('/sync/all')
  async syncAllModifiedProducts() {
    try {
      // Schritt 1: Rufen Sie alle Produkte mit geänderten modified aus dem ERP-System ab
      const modifiedProducts: any =
        await this.productsService.getModifiedProducts();

      // Schritt 2: Iterieren Sie über die geänderten Produkte und synchronisieren Sie sie mit dem Shop
      const syncedProducts = [];
      for (const product of modifiedProducts) {
        const syncedProduct = await this.productsService.syncProductToShops(
          product.name,
        );

        syncedProducts.push(syncedProduct);
      }
      // Schritt 3: Geben Sie die synchronisierten Produkte zurück
      return syncedProducts;
    } catch (error) {
      // console.log(error);
      // Fehlerbehandlung hier
      throw error;
    }
  }
}
