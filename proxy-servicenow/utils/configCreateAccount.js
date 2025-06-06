require('dotenv').config();

module.exports = {
  email: {
    service: process.env.EMAIL_SERVICE || 'Gmail',
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
    appName: process.env.APP_NAME
  },
  serviceNow: {
    url: process.env.SERVICE_NOW_URL,
    user: process.env.SERVICE_NOW_USER,
    password: process.env.SERVICE_NOW_PASSWORD
  },
  app: {
    name: process.env.APP_NAME,
    backendUrl: process.env.BACKEND_URL,
    frontendUrl: process.env.FRONTEND_URL
  },
  registration: {
    tokenExpiry: 3600000 // 1 hour in ms
  }
};