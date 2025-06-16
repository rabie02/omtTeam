const axios = require('axios');
const snConnection = require('../../utils/servicenowConnection');
const handleMongoError = require('../../utils/handleMongoError');
const PriceList = require('../../models/priceList');
const externalIdHelper = require('../../utils/externalIdHelper');

async function createPriceList(req, res = null) {
  try {
    // Create in ServiceNow
    const connection = snConnection.getConnection(req.user.sn_access_token);
    const snResponse = await axios.post(
      `${connection.baseURL}/api/now/table/sn_csm_pricing_price_list`,
      req.body,
      { headers: connection.headers }
    );
    
    // Create in MongoDB
    let mongoDocument;
    try {
      const price = new PriceList({
        sys_id: snResponse.data.result.sys_id,
        ...req.body
      });
      mongoDocument = await price.save();
    } catch (mongoError) {
      if (res) {
        return handleMongoError(res, snResponse.data.result, mongoError, 'creation');
      }
      throw mongoError;
    }

    await externalIdHelper(connection,
       `api/now/table/sn_csm_pricing_price_list/${snResponse.data.result.sys_id}`,
       mongoDocument._id.toString());
    
    
    // Prepare response with both ServiceNow and MongoDB IDs
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
    console.error('Error creating price list:', error);
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
  return createPriceList(req, res);
};

// Export the function directly as well
module.exports.createPriceList = createPriceList;