import axios from 'axios';

const erpApiClient = axios.create({
  baseURL: 'http://192.168.8.57:8080/api/resource',
  headers: {
    Authorization: 'token 032e68d5be4edfc:207879a8be5f6e3',
    'Content-Type': 'application/json',
  },
});

export default erpApiClient;
