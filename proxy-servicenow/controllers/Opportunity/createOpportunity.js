const axios = require('axios');
const Opportunity = require('../../models/Opportunity');
const snConnection = require('../../utils/servicenowConnection');
const handleMongoError = require('../../utils/handleMongoError');

async function createOpportunity(req, res = null) {
  try {
    // Create in ServiceNow
    const connection = snConnection.getConnection(req.user.sn_access_token);
    const snResponse = await axios.post(
      `${connection.baseURL}/api/now/table/sn_opty_mgmt_core_opportunity`,
      req.body,
      { headers: connection.headers }
    );
    
    // Create in MongoDB
    let mongoDocument;
    try {
      const opportunity = new Opportunity({
        sys_id: snResponse.data.result.sys_id,
        number: snResponse.data.result.number,
        ...req.body
      });
      mongoDocument = await opportunity.save();
    } catch (mongoError) {
      if (res) {
        return handleMongoError(res, snResponse.data.result, mongoError, 'creation');
      }
      throw mongoError;
    }
    const response = {
      ...snResponse.data.result,
      _id: mongoDocument._id.toString(), // Include MongoDB ID in the response
      mongoId: mongoDocument._id.toString() // Alternative field name if preferred
    };
    
    if (res) {
      return res.status(201).json(response);
    }
    return response;
  } catch (error) {
    console.error('Error creating opportunity:', error);
    
    if (res) {
      const status = error.response?.status || 500;
      const message = error.response?.data?.error?.message || error.message;
      return res.status(status).json({ error: message });
    }
    throw error;
  }
}

// Original Express route handler for backward compatibility
module.exports = async (req, res) => {
  return createOpportunity(req, res);
};

// Export the function directly as well
module.exports.createOpportunity = createOpportunity;