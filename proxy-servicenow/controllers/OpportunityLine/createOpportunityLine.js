const axios = require('axios');
const snConnection = require('../../utils/servicenowConnection');
const handleMongoError = require('../../utils/handleMongoError');
const OpportunityLine = require('../../models/opportunityLine.js');

module.exports = async (req, res) => {
  try {
    // Créer dans ServiceNow
    const connection = snConnection.getConnection(req.user.sn_access_token);
    const snResponse = await axios.post(
      `${connection.baseURL}/api/now/table/sn_opty_mgmt_core_opportunity_line_item`,
      req.body,
      { headers: connection.headers }
    );
    
    // Créer dans MongoDB
    try {
      const opportunityLine = new OpportunityLine({
        sys_id: snResponse.data.result.sys_id,
        ...req.body
      });
      await opportunityLine.save();
    } catch (mongoError) {
      return handleMongoError(res, snResponse.data, mongoError, 'creation');
    }
    
    res.status(201).json(snResponse.data);
  } catch (error) {
    console.error('Error creating opportunity:', error);
    const status = error.response?.status || 500;
    const message = error.response?.data?.error?.message || error.message;
    res.status(status).json({ error: message });
  }
};