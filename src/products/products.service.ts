// products.service.ts
import { Injectable } from '@nestjs/common';
import erpApiClient from '../api/erp-api-client';
import { ShopsService } from '../shops/shops.service';
import * as _ from 'lodash';

@Injectable()
export class ProductsService {
  constructor(private readonly shopsService: ShopsService) {} // Inject ShopsService

  async getProductsFromErp() {
    try {
      const response = await erpApiClient.get('/Item');
      const erpProducts = response.data;
      // Verarbeiten Sie die ERP-Produktdaten hier
      return erpProducts;
    } catch (error) {
      // Fehlerbehandlung hier
      throw error;
    }
  }

  async getProductFromErp(productNumber: string) {
    try {
      const response = await erpApiClient.get(`/Item/${productNumber}`);
      const erpProduct = response.data.data;
      // Verarbeiten Sie das ERP-Produkt hier
      return erpProduct;
    } catch (error) {
      // Fehlerbehandlung hier
      throw error;
    }
  }

  // async processErpProduct(erpProduct: any) {
  //   try {
  //     // Importieren Sie die externe JSON-Datei asynchron
  //     const processingConfig = await import(
  //       './process/erp-product-processing.json'
  //     );

  //     const processedErpProduct: any = {};

  //     for (const key in processingConfig) {
  //       const sourceKey = key;
  //       const targetKey = processingConfig[key];

  //       // Verwenden Sie den Punkt-Notations-Pfad, um den Wert im erpProduct zu finden
  //       const sourcePath = sourceKey.split('.');
  //       let sourceValue = erpProduct;
  //       for (const pathPart of sourcePath) {
  //         if (sourceValue.hasOwnProperty(pathPart)) {
  //           sourceValue = sourceValue[pathPart];
  //         } else {
  //           sourceValue = undefined;
  //           break;
  //         }
  //       }

  //       if (sourceValue !== undefined) {
  //         // Setzen Sie den Wert im processedErpProduct unter dem Ziel-Key
  //         const targetPath = targetKey.split('.');
  //         let targetObject = processedErpProduct;
  //         for (let i = 0; i < targetPath.length - 1; i++) {
  //           const pathPart = targetPath[i];
  //           if (!targetObject.hasOwnProperty(pathPart)) {
  //             targetObject[pathPart] = {};
  //           }
  //           targetObject = targetObject[pathPart];
  //         }
  //         targetObject[targetPath[targetPath.length - 1]] = sourceValue;
  //       }
  //     }

  //     console.log(processedErpProduct);

  //     // Weitere Verarbeitungsschritte nach Bedarf

  //     return processedErpProduct;
  //   } catch (error) {
  //     // Fehlerbehandlung hier
  //     throw error;
  //   }
  // }

  async processErpProduct(erpProduct: any) {
    try {
      const processingConfig = await import(
        './process/erp-product-processing.json'
      );

      const processedErpProduct: any = {};

      for (const sourceKey in processingConfig) {
        const targetKey = processingConfig[sourceKey];
        const sourceValue = _.get(erpProduct, sourceKey);
        if (sourceValue !== undefined) {
          _.set(processedErpProduct, targetKey, sourceValue);
        }
      }

      // console.log(processedErpProduct);
      return processedErpProduct;
    } catch (error) {
      // Fehlerbehandlung hier
      throw error;
    }
  }

  async getUuidByProductNumber(productNumber: string) {
    try {
      // Schritt 1: Rufen Sie das Produkt aus den Shops ab
      const shopProducts = await this.getProductFromShops(productNumber);

      // Schritt 2: Initialisieren Sie eine leere UUID-Liste
      const uuidList: string[] = [];

      // Schritt 3: Iterieren Sie über die abgerufenen Shop-Produkte und sammeln Sie die UUIDs
      for (const shopProduct of shopProducts) {
        if (shopProduct && shopProduct.data.id) {
          uuidList.push(shopProduct.data.id);
        }
      }

      // Schritt 4: Geben Sie die Liste der UUIDs zurück
      return uuidList;
    } catch (error) {
      // Fehlerbehandlung hier
      throw error;
    }
  }

  async getProductFromShops(productNumber: string) {
    try {
      // Schritt 1: Rufen Sie das Produkt aus dem ERP-System ab
      const erpProduct = await this.getProductFromErp(productNumber);
      // Schritt 2: Initialisieren Sie ein leeres Array für Shop-Produkte
      const shopsProduct = [];

      // Schritt 3: Rufen Sie die Shop-IDs aus dem ERP-Produkt ab
      const productShopList = erpProduct.shop_list;
      // Schritt 4: Iterieren Sie über die Shop-IDs und rufen Sie die Produkte aus jedem Shop ab

      for (const shop of productShopList) {
        const erpShopId = shop.shop;
        // Schritt 5: Rufen Sie die Shop-API-Daten basierend auf der Shop-ID aus dem ERP ab
        const shopApiData =
          await this.shopsService.getShopApiDataByShopId(erpShopId);
        // Schritt 6: Erstellen Sie den Shop-API-Client basierend auf den Shop-API-Daten
        const shopApiClient =
          await this.shopsService.createShopApiClient(shopApiData); // Use the method from ShopsService

        // Schritt 7: Rufen Sie das Shop-Produkt basierend auf der Produktnummer aus dem Shop ab
        const response = await shopApiClient.get(
          `/api/product?filter[productNumber]=${productNumber}`,
        );

        const shopProduct = await response.data;
        // Schritt 8: Fügen Sie das Shop-Produkt zur Liste der Shop-Produkte hinzu
        shopsProduct.push(shopProduct);
      }

      // Schritt 5: Rufen Sie das Shop-Produkt basierend auf der Produktnummer aus dem Shop ab
      return shopsProduct;
    } catch (error) {
      // Fehlerbehandlung hier
      // console.log(error);
      throw error;
    }
  }

  async syncProductToShops(productNumber: string) {
    try {
      // Schritt 1: Rufen Sie das Produkt aus dem ERP-System ab
      const erpProduct = await this.getProductFromErp(productNumber);

      // Schritt 2: Rufen Sie die Shop-IDs aus dem ERP-Produkt ab
      const productShopList = erpProduct.shop_list;
      // Schritt 3: Initialisieren Sie ein leeres Array für die synchronisierten Shop-Produkte
      const syncedShopsProduct: any = [];

      // Schritt 4: Iterieren Sie über die Shop-IDs und synchronisieren Sie das Produkt in jedem Shop
      for (const shop of productShopList) {
        const erpShopId = shop.shop;

        // Schritt 5: Rufen Sie die Shop-API-Daten basierend auf der Shop-ID aus dem ERP ab
        const shopApiData =
          await this.shopsService.getShopApiDataByShopId(erpShopId);

        // Schritt 6: Erstellen Sie den Shop-API-Client basierend auf den Shop-API-Daten
        const shopApiClient =
          await this.shopsService.createShopApiClient(shopApiData);

        // Schritt 7: Rufen Sie das Shop-Produkt basierend auf der Produktnummer aus dem Shop ab
        const response = await shopApiClient.get(
          `/api/product?filter[productNumber]=${productNumber}`,
        );
        const shopProduct = response.data; // Daten eines Produkts eines Shops

        if (shopProduct && shopProduct.data && shopProduct.data.length > 0) {
          // Das Shop-Produkt existiert, nehmen Sie das erste gefundene Produkt
          const shopProductData = shopProduct.data[0];

          // Schritt 8: Rufen Sie die UUID aus dem Shop-Produkt ab
          const shopProductUUID = shopProductData.id; //TODO: richtige ID finden

          // Schritt 9: Verarbeiten Sie das ERP-Produkt, um es an das Shop-Format anzupassen (falls erforderlich)
          const processedShopProduct = await this.processErpProduct(erpProduct);

          processedShopProduct.id = shopProductUUID;
          // Schritt 10: Senden Sie das verarbeitete Produkt an die Shop-API, um es zu synchronisieren
          // Verwenden Sie die UUID aus dem Shop-Produkt
          await shopApiClient.patch(
            `/api/product/${shopProductData.id}`,
            processedShopProduct,
          );

          // Schritt 11: Fügen Sie das synchronisierte Shop-Produkt zur Liste der synchronisierten Produkte hinzu
          syncedShopsProduct.push(shopProductData);
        }
      }

      // Schritt 10: Geben Sie die Liste der synchronisierten Shop-Produkte zurück
      return syncedShopsProduct;
    } catch (error) {
      // console.log('Fehler: ', error);
      // Fehlerbehandlung hier
      throw error;
    }
  }

  async getModifiedProducts() {
    try {
      // Schritt 1: Rufen Sie alle Produkte aus dem ERP-System (nur Produktnummern) ab
      const responseERP = await erpApiClient.get('/Item');
      const erpProducts = responseERP.data.data;
      // console.log(erpProducts);

      // Schritt 2: Filtern Sie Produkte, bei denen die modified im ERP-System
      // von der updatedAt-Eigenschaft im Shop abweicht
      const modifiedProducts = [];

      for (const erpProduct of erpProducts) {
        const erpProductComplete = await this.getProductFromErp(
          erpProduct.name,
        );
        // console.log(erpProductComplete);
        const productShopList = erpProductComplete.shop_list;
        for (const shop of productShopList) {
          const erpShopId = shop.shop;

          // Schritt 5: Rufen Sie die Shop-API-Daten basierend auf der Shop-ID aus dem ERP ab
          const shopApiData =
            await this.shopsService.getShopApiDataByShopId(erpShopId);

          // Schritt 6: Erstellen Sie den Shop-API-Client basierend auf den Shop-API-Daten
          const shopApiClient =
            await this.shopsService.createShopApiClient(shopApiData);

          // Schritt 7: Rufen Sie das Shop-Produkt basierend auf der Produktnummer aus dem Shop ab
          const response = await shopApiClient.get(
            `/api/product?filter[productNumber]=${erpProduct.name}`,
          );
          const shopProduct = response.data;
          if (
            !shopProduct ||
            erpProductComplete.modified !==
              shopProduct.data[0].customFields.br_pim_modified
          ) {
            modifiedProducts.push(erpProductComplete);
          }
        }
      }
      return modifiedProducts;
    } catch (error) {
      // console.log(error);
      // Fehlerbehandlung hier
      throw error;
    }
  }
}
