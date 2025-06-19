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

   // Pour les appels qui utilisent l'authentification de base
  getBasicConnection2: async () => {
    try {
      const authData = {
        grant_type: 'password',
        client_id: process.env.CLIENT_ID,
        client_secret: process.env.CLIENT_SECRET,
        username: process.env.SERVICE_NOW_USER,
        password: process.env.SERVICE_NOW_PASSWORD
      };
        const { data } = await axios.post(
          `${process.env.SERVICE_NOW_URL}/oauth_token.do`,
          authData,
          {
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
              Accept: 'application/json'
            },
            timeout: 10000,
            validateStatus: status => status < 500
          }
        );
        console.log(data);
    return {
      baseURL: process.env.SERVICE_NOW_URL,
      headers: {
        'Authorization': `Bearer ${data.access_token}`,
        'Content-Type': 'application/json'
      }
    };
  }catch(error){
    console.error(error);
  }
}
  
};