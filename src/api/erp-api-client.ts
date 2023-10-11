import axios from 'axios';

const erpApiClient = axios.create({
  baseURL: 'http://192.168.8.57:8080/api/resource',
  headers: {
    Authorization: 'token b8031d90ad28ffb:b6504285828c3d5',
    'Content-Type': 'application/json',
  },
});

export default erpApiClient;
