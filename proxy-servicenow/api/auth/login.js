const express = require('express');
const axios = require('axios');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const router = express.Router();

const ERROR_MESSAGES = {
  MISSING_FIELDS: 'Both username and password are required',
  INVALID_CREDENTIALS: 'Incorrect username or password',
  AUTH_FAILED: 'Unable to authenticate'
};

router.post('/get-token', async (req, res) => {
  const { username = '', password = '' } = req.body;

  if (!username.trim() || !password.trim()) {
    return res.status(400).json({
      error: 'missing_fields',
      error_description: ERROR_MESSAGES.MISSING_FIELDS
    });
  }

  const authData = new URLSearchParams({
    grant_type: 'password',
    client_id: process.env.CLIENT_ID,
    client_secret: process.env.CLIENT_SECRET,
    username: username.trim(),
    password: password.trim()
  });

  try {
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

    if (!data?.access_token) {
      return res.status(401).json({
        error: 'invalid_credentials',
        error_description: data?.error_description || ERROR_MESSAGES.INVALID_CREDENTIALS
      });
    }

    const payload = {
      sub: username,
      sn_access_token: data.access_token,
      scope: data.scope,
      iss: process.env.JWT_ISSUER || 'your-app',
      iat: Math.floor(Date.now() / 1000),
      role: 'user'
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: '8h'
    });

    res.cookie('id_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Strict',
      maxAge: 1000 * 60 * 60 * 8 // 8 hours
    });

    res.set({
      'Cache-Control': 'no-store',
      Pragma: 'no-cache',
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY'
    }).json({
      id_token: token,
      token_type: 'Bearer',
      expires_in: data.expires_in,
      scope: data.scope,
      issued_at: new Date().toISOString()
    });

  } catch (err) {
    const status = err.response?.status || 503;
    const errorResponse = err.response?.data;

    console.error('Token error:', err.message);
    if (err.response?.data) {
      console.error('Response data:', JSON.stringify(err.response.data));
    }

    res.status(status).json({
      error: errorResponse?.error || 'authentication_failed',
      error_description: errorResponse?.error_description || ERROR_MESSAGES.AUTH_FAILED
    });
  }
});

module.exports = router;
