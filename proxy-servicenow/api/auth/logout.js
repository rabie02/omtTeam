const express = require('express');
const axios = require('axios');
const router = express.Router();

// Constants for token revocation
const SNOW_REVOCATION_ENDPOINT = '/oauth_revoke_token.do';
const REVOCATION_TIMEOUT = 5000; // 5 seconds

router.post('/logout', async (req, res) => {
  if (!req.session) {
    return res.status(200).json({ 
      success: true,
      message: 'No active session' 
    });
  }

  const { sn_access_token: snToken, id: sessionId } = req.session;

  try {
    // Destroy session immediately
    await new Promise((resolve, reject) => {
      req.session.destroy(err => err ? reject(err) : resolve());
    });

    // Revoke ServiceNow token in background if exists
    if (snToken) {
      revokeServiceNowToken(snToken, sessionId).catch(e => 
        console.error('Background revocation failed:', e.message)
      );
    }

    // Clear cookies and set headers
    clearSessionCookie(res);
    setSecurityHeaders(res, req.secure);

    return res.status(200).json({
      success: true,
      message: 'Logout successful'
    });

  } catch (error) {
    console.error('Logout failed:', error);
    return res.status(500).json({
      success: false,
      message: 'Logout processing failed'
    });
  }
});

// Helper functions
async function revokeServiceNowToken(token, sessionId) {
  try {
    await axios.post(
      `${process.env.SERVICE_NOW_URL}${SNOW_REVOCATION_ENDPOINT}`,
      new URLSearchParams({
        token,
        client_id: process.env.CLIENT_ID,
        client_secret: process.env.CLIENT_SECRET
      }),
      {
        headers: { 
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json'
        },
        timeout: REVOCATION_TIMEOUT
      }
    );
    console.log(`Revoked ServiceNow token for session ${sessionId}`);
  } catch (error) {
    throw new Error(`ServiceNow revocation failed: ${error.message}`);
  }
}

function clearSessionCookie(res) {
  res.clearCookie('connect.sid', {
    path: '/',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'Lax'
  });
}

function setSecurityHeaders(res, isSecure) {
  const headers = {
    'Cache-Control': 'no-store, no-cache, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
  };

  if (isSecure || process.env.NODE_ENV === 'production') {
    headers['Clear-Site-Data'] = '"cookies", "storage"';
  }

  res.set(headers);
}

module.exports = router;