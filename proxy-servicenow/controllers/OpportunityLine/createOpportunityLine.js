const axios = require('axios');
const snConnection = require('../../utils/servicenowConnection');
const handleMongoError = require('../../utils/handleMongoError');
const OpportunityLine = require('../../models/opportunityLine');

async function createOpportunityLine(req, res = null) {
  try {
    // Create in ServiceNow
    const connection = snConnection.getConnection(req.user.sn_access_token);
    const snResponse = await axios.post(
      `${connection.baseURL}/api/now/table/sn_opty_mgmt_core_opportunity_line_item`,
      req.body,
      { headers: connection.headers }
    );
    
    // Create in MongoDB
    try {
      const opportunityLine = new OpportunityLine({
        sys_id: snResponse.data.result.sys_id,
        ...req.body
      });
      await opportunityLine.save();
    } catch (mongoError) {
      if (res) {
        return handleMongoError(res, snResponse.data.result, mongoError, 'creation');
      }
      throw mongoError;
    }
    
    if (res) {
      return res.status(201).json(snResponse.data);
    }
    return snResponse.data;
  } catch (error) {
    console.error('Error creating opportunity line:', error);
    
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
  return createOpportunityLine(req, res);
};

// Export the function directly as well
module.exports.createOpportunityLine = createOpportunityLine;