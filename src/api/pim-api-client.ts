import axios from 'axios';

const pimApiClient = axios.create({
  baseURL: 'https://erpnext.brlab.duckdns.org/api/resource',
  headers: {
    Authorization: 'token b971459f4f887dd:ddf03957c8783c4',
    'Content-Type': 'application/json',
  },
});

export default pimApiClient;
