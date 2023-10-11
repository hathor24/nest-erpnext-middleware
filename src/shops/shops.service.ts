import { Injectable } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';
import erpApiClient from '../api/erp-api-client';

@Injectable()
export class ShopsService {
  // Methode zum Abrufen des Shop-API-Clients aus den ERP-Daten
  async getShopApiClient(shopApiData: any): Promise<AxiosInstance> {
    try {
      // Hier erstellen Sie den Shop-API-Client basierend auf den Shop-API-Daten aus dem ERP
      const shopApiClient = this.createShopApiClient(shopApiData);
      return shopApiClient;
    } catch (error) {
      // Fehlerbehandlung hier
      throw error;
    }
  }

  async getShopBearerToken(
    shopUrl: string,
    clientId: string,
    clientSecret: string,
  ): Promise<string> {
    const options = {
      method: 'POST',
      url: shopUrl + '/api/oauth/token',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      data: {
        grant_type: 'client_credentials',
        client_id: clientId,
        client_secret: clientSecret,
      },
    };

    try {
      const { data } = await axios.request(options);
      return data.access_token;
    } catch (error) {
      // console.error(error);
    }
  }

  // Methode zum Erstellen des Shop-API-Clients basierend auf den Shop-API-Daten
  async createShopApiClient(shopApiData: any): Promise<AxiosInstance> {
    try {
      // Extrahieren Sie die erforderlichen Informationen aus shopApiData
      const { shopurl, apikey, apisecret } = shopApiData;

      const token = await this.getShopBearerToken(shopurl, apikey, apisecret);

      // Konfigurieren Sie den Shop-API-Client mit den entsprechenden Daten
      const shopApiClient = axios.create({
        baseURL: shopurl, // Die Basis-URL der Shop-API
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`, // Fügen Sie hier die erforderliche Authentifizierung hinzu
        },
      });

      return shopApiClient;
    } catch (error) {
      // Fehlerbehandlung hier
      throw error;
    }
  }

  // Methode zum Abrufen der Shop-API-Daten basierend auf der Shop-ID
  async getShopApiDataByShopId(shopId: string): Promise<any> {
    try {
      // Schritt 1: Rufen Sie die Shop-API-Daten basierend auf der Shop-ID aus dem ERP-System ab
      const response = await erpApiClient.get(`/Shop/${shopId}`);

      const shopApiData = response.data.data;
      // Verarbeiten Sie die Shop-API-Daten hier
      return shopApiData;
    } catch (error) {
      // Fehlerbehandlung hier
      throw error;
    }
  }

  // Funktion zum Abrufen von Shop-Daten aus dem ERP
  async getShopsFromErp() {
    try {
      const response = await erpApiClient.get('/Shop');
      const erpShops = response.data;
      // Verarbeiten Sie die ERP-Shop-Daten hier
      return erpShops;
    } catch (error) {
      // Fehlerbehandlung hier
      throw error;
    }
  }

  // Funktion zum Abrufen eines einzelnen Shops aus dem ERP basierend auf der Shop-Nummer
  async getShopFromErp(shopNumber: string) {
    try {
      const response = await erpApiClient.get(`/Shop/${shopNumber}`);
      const erpShop = response.data.data;
      // Verarbeiten Sie das ERP-Shop-Produkt hier
      return erpShop;
    } catch (error) {
      // Fehlerbehandlung hier
      throw error;
    }
  }
}
