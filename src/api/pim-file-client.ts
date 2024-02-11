import axios from 'axios';

const pimFileClient = axios.create({
  baseURL: 'http://192.168.8.57:8080',
  headers: {
    Authorization: 'token 032e68d5be4edfc:b44c9bd45d89b9d',
    'Content-Type': 'application/json',
    // 'Content-Type': 'image/jpg',
    // extention: 'jpg',
  },
});

export default pimFileClient;
