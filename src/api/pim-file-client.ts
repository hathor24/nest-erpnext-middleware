import axios from 'axios';

const pimFileClient = axios.create({
  // baseURL: 'https://erpnext.brlab.duckdns.org',
  baseURL: 'http://192.168.8.57:8080',
  headers: {
    Authorization: 'token 3df50aea17a834e:7ca22c3d7dcfc36',
    'Content-Type': 'application/json',
    // 'Content-Type': 'image/jpg',
    // extention: 'jpg',
  },
});

export default pimFileClient;
