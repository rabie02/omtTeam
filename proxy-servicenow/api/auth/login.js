// routes/api/auth/login.js
const express = require('express');
const axios = require('axios');
const { body, validationResult } = require('express-validator');
const router = express.Router();

const ERROR_MESSAGES = {
  MISSING_FIELDS: 'Both username and password are required',
  INVALID_CREDENTIALS: 'Incorrect username or password',
  AUTH_FAILED: 'Unable to authenticate'
};

router.post(
  '/login',
  [
    body('username').trim().notEmpty().withMessage('Username is required'),
    body('password').trim().notEmpty().withMessage('Password is required')
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'validation_error',
        details: errors.array()
      });
    }

    const { username, password } = req.body;
    const authData = new URLSearchParams({
      grant_type: 'password',
      client_id: process.env.CLIENT_ID,
      client_secret: process.env.CLIENT_SECRET,
      username,
      password
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

      req.session.regenerate(err => {
        if (err) return res.status(500).json({ error: 'session_regenerate_failed' });

        req.session.sn_access_token = data.access_token;
        req.session.username = username;

        res.json({
          username,
          token_type: 'Bearer',
          expires_in: data.expires_in
        });
      });
    } catch (err) {
      const status = err.response?.status || 503;
      const errorResponse = err.response?.data;

      console.error('Login error:', err.message);
      res.status(status).json({
        error: errorResponse?.error || 'authentication_failed',
        error_description: errorResponse?.error_description || ERROR_MESSAGES.AUTH_FAILED
      });
    }
  }
);

router.get('/me', async (req, res) => {
  if (!req.session?.sn_access_token || !req.session?.username) {
    return res.status(401).json({
      error: 'missing_token',
      error_description: 'Authentication required'
    });
  }

  try {
    const response = await axios.get(
      `${process.env.SERVICE_NOW_URL}/api/now/table/sys_user?sysparm_query=user_name=${req.session.username}&sysparm_limit=1`,
      {
        headers: {
          Authorization: `Bearer ${req.session.sn_access_token}`,
          Accept: 'application/json',
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.data.result || response.data.result.length === 0) {
      return res.status(404).json({
        error: 'user_not_found',
        error_description: 'User not found in ServiceNow'
      });
    }

    res.json({
      user: response.data.result[0],
      token_valid: true
    });
  } catch (err) {
    console.error('User info error:', err.response?.data || err.message);

    if (err.response?.status === 401) {
      req.session.destroy(() => {});
    }

    const status = err.response?.status || 500;
    res.status(status).json({
      error: 'service_now_error',
      error_description: err.response?.data?.error?.message || 'Error fetching user information'
    });
  }
});

router.get('/auth/verify', (req, res) => {
  if (!req.session?.sn_access_token) {
    return res.status(401).json({ authenticated: false });
  }
  res.status(200).json({
    authenticated: true,
    user: { username: req.session.username }
  });
});

module.exports = router;
