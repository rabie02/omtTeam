const express = require('express');
const axios = require('axios');
const router = express.Router();

// ⚙️ Configuration ServiceNow (sans .env)
const SN_CONFIG = {
  baseURL: 'https://dev323456.service-now.com',
  auth: {
    username: 'admin',
    password: 'bz!T-1ThIc1L'
  },
  endpoints: {
    searchKB: '/api/now/table/kb_knowledge'
  }
};

// ✅ GET /api/chatbot/kb?q=motclé
router.get('/chatbot/kb', async (req, res) => {
  try {
    const query = req.query.q || '';

    const response = await axios.get(`${SN_CONFIG.baseURL}${SN_CONFIG.endpoints.searchKB}`, {
      auth: SN_CONFIG.auth,
      params: {
        sysparm_query: `active=true^workflow_state=published^${query ? `(short_descriptionLIKE${query}^ORtextLIKE${query})` : ''}`,
        sysparm_limit: 5,
        sysparm_fields: 'short_description,number,topic,text,url',
        sysparm_display_value: true
      },
      headers: {
        Accept: 'application/json'
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
    console.error('❌ Erreur KB backend :', error.response?.data || error.message);
    res.status(error.response?.status || 500).json({
      error: 'Erreur ServiceNow KB',
      details: error.response?.data || error.message
    });
  }
});

module.exports = router;
