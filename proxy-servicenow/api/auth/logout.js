const express = require('express');
const jwt = require('jsonwebtoken');
const axios = require('axios');
require('dotenv').config();

const router = express.Router();

router.post('/logout', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.split(' ')[1];

    // Verify token if present
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Revoke ServiceNow token if exists
        const revokeTokenInBackground = async (sn_access_token) => {
          try {
            await axios.post(
              `${process.env.SERVICE_NOW_URL}/oauth_revoke_token.do`,
              new URLSearchParams({
                token: sn_access_token,
                client_id: process.env.CLIENT_ID,
                client_secret: process.env.CLIENT_SECRET
              }),
              { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
            );
          } catch (error) {
            // Token is expired or invalid
            console.error('Token verification failed:', error);
            return res.status(401).json({ success: false, message: 'Token expired or invalid' });
          }
        };
        
        // In your logout handler
        if (decoded?.sn_access_token) {
          revokeTokenInBackground(decoded.sn_access_token);
        }
      } catch (verificationError) {
        console.warn('Token verification warning:', verificationError.message);
        // Optionally, handle expired tokens if necessary
      }
    }

    // Set appropriate headers based on environment
    const headers = {
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    };

    // Only set Clear-Site-Data in production with HTTPS
    if (req.secure || process.env.NODE_ENV === 'production') {
      headers['Clear-Site-Data'] = '"cookies", "storage"';
    }

    return res
      .set(headers)
      .status(200)  // Use 200 status here as success
      .json({ 
        success: true,
        message: 'Logged out successfully'
      });

  } catch (error) {
    console.error('Logout error:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Failed to log out, try again later.'
    });
  }
});


module.exports = router;