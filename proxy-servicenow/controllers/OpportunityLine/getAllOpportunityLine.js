const axios = require('axios');
const opportunityLine = require('../../models/opportunityLine');
const snConnection = require('../../utils/servicenowConnection');
const handleMongoError = require('../../utils/handleMongoError');

module.exports = async (req, res) => {
  try {
    // Utiliser le token d'authentification de l'utilisateur
    const connection = snConnection.getConnection(req.user.sn_access_token);
    
    // Récupérer les données de ServiceNow
    const snResponse = await axios.get(
      `${connection.baseURL}/api/now/table/sn_opty_mgmt_core_opportunity_line_item`,
      { headers: connection.headers }
    );
   
    
    res.json(snResponse.data.result);
  } catch (error) {
    console.error('Error fetching opportunities:', error);
    const status = error.response?.status || 500;
    const message = error.response?.data?.error?.message || error.message;
    res.status(status).json({ error: message });
  }
};