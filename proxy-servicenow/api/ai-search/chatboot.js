const express = require('express');
const axios = require('axios');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const router = express.Router();

router.get('/chatbot/kb', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Missing token' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const snToken = decoded.sn_access_token;

    const query = req.query.q || '';
    const serviceNowUrl = `${process.env.SERVICE_NOW_URL}/api/now/table/kb_knowledge`;

    const response = await axios.get(serviceNowUrl, {
      headers: {
        Authorization: `Bearer ${snToken}`,
        Accept: 'application/json'
      },
      params: {
        sysparm_query: `active=true^workflow_state=published^short_descriptionLIKE${query}^ORtextLIKE${query}`,
        sysparm_limit: 5,
        sysparm_fields: 'short_description,number,topic,text,url',
        sysparm_display_value: true,
        sysparm_exclude_reference_link: true
      }
    });

    const articles = response.data.result.map(article => ({
      short_description: article.short_description,
      number: article.number,
      topic: article.topic,
      text: article.text,
      url: article.url
    }));

    res.json({ articles });
  } catch (error) {
    console.error('🔴 KB Error:', error.message);
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
