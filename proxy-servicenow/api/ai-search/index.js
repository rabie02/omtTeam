// server/api/ai-search.js
const express = require('express');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const router = express.Router();
require('dotenv').config();



router.get('/ai-search', async (req, res) => {
  try {

    const token = req.headers.authorization.split(' ')[1];
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);

    const { term } = req.query;
    
    if (!term) {
      return res.status(400).json({ error: 'Search term is required' });
    }

    const response = await axios.get(`${process.env.SERVICE_NOW_URL}/api/sn_prd_pm/ai_search_proxy2/search?term=${encodeURIComponent(term)}`, {
      headers:  {
        'Authorization': `Bearer ${decodedToken.sn_access_token}`,
        'Content-Type': 'application/json'
      }
    });


    const data = response.data;
    const results = data.result?.result?.items || data.result?.items || data.result || [];
    res.json(results);
  } catch (error) {
    console.error("AI Search error:", error);
    res.status(500).json({ error: 'AI search failed' });
  }
});

module.exports = router;