// 📁 routes/productOffering.js
const express = require('express');
const router = express.Router();
const axios = require('axios');

// Authentification ServiceNow
const SN_USERNAME = 'group2';
const SN_PASSWORD = 'K5F/Uj/lDbo9YAS';
const SN_API_URL = 'https://dev268291.service-now.com/api/sn_tmf_api/catalogmanagement/productOffering';

router.post('/product-offering2', async (req, res) => {
  try {
    const payload = req.body;

    const response = await axios.post(SN_API_URL, payload, {
      auth: {
        username: SN_USERNAME,
        password: SN_PASSWORD
      },
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    res.status(201).json({ success: true, result: response.data });
  } catch (error) {
    console.error("❌ Error:", error.response?.data || error.message);
    res.status(error.response?.status || 500).json({
      success: false,
      error: error.response?.data || error.message
    });
  }
});

module.exports = router;
