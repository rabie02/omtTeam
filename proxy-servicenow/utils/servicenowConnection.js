const axios = require('axios');

module.exports = {
  getConnection: (token) => {
    return {
      baseURL: process.env.SERVICE_NOW_URL,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    };
  },
  
  // Pour les appels qui utilisent l'authentification de base
  getBasicConnection: () => {
    return {
      baseURL: process.env.SERVICE_NOW_URL,
      auth: {
        username: process.env.SERVICE_NOW_USERNAME,
        password: process.env.SERVICE_NOW_PASSWORD
      },
      headers: {
        'Content-Type': 'application/json'
      }
    };
  },
  
};