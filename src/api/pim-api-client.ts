import axios from 'axios';

const pimApiClient = axios.create({
  baseURL: 'https://erpnext.brlab.duckdns.org/api/resource',
  // baseURL: 'http://localhost:3000/api/resource',
  headers: {
    Authorization: 'token 3df50aea17a834e:7ca22c3d7dcfc36',
    'Content-Type': 'application/json',
  },
});

export default pimApiClient;
