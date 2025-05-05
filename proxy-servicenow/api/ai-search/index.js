// server/api/ai-search.js
const express = require('express');
const axios = require('axios');
const router = express.Router();


//user and pass for now are in here till we agree on an instance to use for every thing!
const AI_SEARCH_ENDPOINT = "https://dev268291.service-now.com/api/sn_prd_pm/ai_search_proxy2/search";
const AUTH_HEADERS = {
  "Authorization": "Basic " + Buffer.from("admin:K5F/Uj/lDbo9").toString('base64'),
  "Accept": "application/json",
  "Content-Type": "application/json"
};

router.get('/', async (req, res) => {
  try {
    const { term } = req.query;
    if (!term) {
      return res.status(400).json({ error: 'Search term is required' });
    }

    const response = await axios.get(`${AI_SEARCH_ENDPOINT}?term=${encodeURIComponent(term)}`, {
      headers: AUTH_HEADERS
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