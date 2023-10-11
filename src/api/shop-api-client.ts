/* eslint-disable prettier/prettier */
import axios from 'axios';

const shopApiClient = axios.create({
  baseURL: 'https://shop-api-url.com',
  headers: {
    Authorization: 'Bearer YOUR_SHOP_API_TOKEN',
    'Content-Type': 'application/json',
  },
});

export default shopApiClient;
