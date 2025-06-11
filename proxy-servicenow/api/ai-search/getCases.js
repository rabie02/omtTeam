const express = require('express');
const axios = require('axios');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const router = express.Router();

router.get('/chatbot/cases', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Missing token' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const snToken = decoded.sn_access_token;

    const serviceNowUrl = `${process.env.SERVICE_NOW_URL}api/sn_prd_pm/get_cases_api/cases`;

    const response = await axios.get(serviceNowUrl, {
      headers: {
        Authorization: `Bearer ${snToken}`,
        Accept: 'application/json'
      }
    });

    const filteredCases = (response.data.result || []).map(c => ({
      sys_id: c.sys_id,
      number: c.number,
      short_description: c.short_description,
      state: c.state,
      account: c.account,
      created_on: c.created_on
    }));

    res.json({ cases: filteredCases });
  } catch (error) {
    console.error('🔴 Case Error:', error.message);
    if (axios.isAxiosError(error)) {
      return res.status(error.response?.status || 500).json({
        error: 'ServiceNow error',
        details: error.response?.data || error.message
      });
    }
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

module.exports = router;
