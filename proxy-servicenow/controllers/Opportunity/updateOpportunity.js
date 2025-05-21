const axios = require('axios');
const Opportunity = require('../../models/Opportunity');
const snConnection = require('../../utils/servicenowConnection');
const handleMongoError = require('../../utils/handleMongoError');

module.exports = async (req, res) => {
  try {
    // Mettre à jour dans ServiceNow
    const connection = snConnection.getConnection(req.user.sn_access_token);
    const snResponse = await axios.patch(
      `${connection.baseURL}/api/now/table/sn_opty_mgmt_core_opportunity/${req.params.id}`,
      req.body,
      { headers: connection.headers }
    );
    
    // Mettre à jour dans MongoDB
    try {
      await Opportunity.findOneAndUpdate(
        { sys_id: req.params.id },
        req.body,
        { new: true }
      );
    } catch (mongoError) {
      return handleMongoError(res, snResponse.data, mongoError, 'update');
    }
    
    res.json(snResponse.data);
  } catch (error) {
    console.error('Error updating opportunity:', error);
    const status = error.response?.status || 500;
    const message = error.response?.data?.error?.message || error.message;
    res.status(status).json({ error: message });
  }
};