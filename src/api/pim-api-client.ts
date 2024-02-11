import axios from 'axios';

const pimApiClient = axios.create({
  baseURL: 'http://192.168.8.57:8080/api/resource',
  headers: {
    Authorization: 'token 032e68d5be4edfc:b44c9bd45d89b9d',
    'Content-Type': 'application/json',
  },
});

export default pimApiClient;
