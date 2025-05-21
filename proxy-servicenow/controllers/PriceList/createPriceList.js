const axios = require('axios');
const snConnection = require('../../utils/servicenowConnection');
const handleMongoError = require('../../utils/handleMongoError');
const PriceList = require('../../models/priceList');

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
    try {
      const price = new PriceList({
        sys_id: snResponse.data.result.sys_id,
        ...req.body
      });
      await price.save();
    } catch (mongoError) {
      if (res) {
        return handleMongoError(res, snResponse.data.result, mongoError, 'creation');
      }
      throw mongoError;
    }
    if (res) {
      return res.status(201).json(snResponse.data.result);
    }
    return snResponse.data.result;
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