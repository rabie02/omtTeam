const express = require('express');
const axios = require('axios');
const jwt = require('jsonwebtoken');

const router = express.Router();
require('dotenv').config();

router.get('/channel', async (req, res) => {
    try {
      // Verify JWT
      const authHeader = req.headers.authorization;
      
      const token = authHeader.split(' ')[1];
      let decodedToken;
      try {
        decodedToken = jwt.verify(token, process.env.JWT_SECRET);
      } catch (jwtError) {
        return res.status(401).json({ error: 'Invalid token', details: jwtError.message });
      }
  
      // ServiceNow configuration
      const serviceNowUrl = `${process.env.SERVICE_NOW_URL}/api/now/table/sn_prd_pm_distribution_channel`;
      const serviceNowHeaders = {
        'Accept': 'application/json',
        'Authorization': `Bearer ${decodedToken.sn_access_token}` // or 'Token' as needed
      };
  
      // ServiceNow API call with query parameters
      const response = await axios.get(serviceNowUrl, {
        headers: serviceNowHeaders,
        params: req.query // Forward client query parameters to ServiceNow
      });
  
      // Forward successful response
      res.status(response.status).json(response.data);
  
    } catch (error) {
      console.error('ServiceNow API error:', error);
  
      // Handle Axios errors
      if (axios.isAxiosError(error)) {
        return res.status(error.response?.status || 500).json({
          error: 'ServiceNow API request failed',
          details: error.response?.data || error.message
        });
      }
  
      // Handle other errors
      res.status(500).json({
        error: 'Internal server error',
        details: error.message
      });
    }
});

router.get('/product-spec', async (req, res) => {
    try {
        // Verify JWT
        const authHeader = req.headers.authorization;
        
        const token = authHeader.split(' ')[1];
        let decodedToken;
        try {
        decodedToken = jwt.verify(token, process.env.JWT_SECRET);
        } catch (jwtError) {
        return res.status(401).json({ error: 'Invalid token', details: jwtError.message });
        }

        // ServiceNow configuration
        const serviceNowUrl = `${process.env.SERVICE_NOW_URL}/api/sn_tmf_api/catalogmanagement/productSpecification`;
        const serviceNowHeaders = {
        'Accept': 'application/json',
        'Authorization': `Bearer ${decodedToken.sn_access_token}` // or 'Token' as needed
        };

        // ServiceNow API call with query parameters
        const response = await axios.get(serviceNowUrl, {
        headers: serviceNowHeaders,
        params: req.query // Forward client query parameters to ServiceNow
        });

        // Forward successful response
        res.status(response.status).json(response.data);

} catch (error) {
    console.error('ServiceNow API error:', error);

    // Handle Axios errors
    if (axios.isAxiosError(error)) {
    return res.status(error.response?.status || 500).json({
        error: 'ServiceNow API request failed',
        details: error.response?.data || error.message
    });
    }

    // Handle other errors
    res.status(500).json({
    error: 'Internal server error',
    details: error.message
    });
}
});

module.exports = router;