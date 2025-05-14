const axios = require('axios');
const Opportunity = require('../../models/Opportunity');
const snConnection = require('../../utils/servicenowConnection');
const handleMongoError = require('../../utils/handleMongoError');

module.exports = async (req, res) => {
  try {
    // Créer dans ServiceNow
    const connection = snConnection.getConnection(req.user.sn_access_token);
    const snResponse = await axios.post(
      `${connection.baseURL}/api/now/table/sn_opty_mgmt_core_opportunity`,
      req.body,
      { headers: connection.headers }
    );
    
    // Créer dans MongoDB
    try {
      const opportunity = new Opportunity({
        sys_id: snResponse.data.result.sys_id,
        ...req.body
      });
      await opportunity.save();
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