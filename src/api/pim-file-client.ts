import axios from 'axios';

const pimFileClient = axios.create({
  baseURL: 'https://erpnext.brlab.duckdns.org',
  headers: {
    Authorization: 'token b971459f4f887dd:ddf03957c8783c4',
    'Content-Type': 'application/json',
    // 'Content-Type': 'image/jpg',
    // extention: 'jpg',
  },
});

export default pimFileClient;
