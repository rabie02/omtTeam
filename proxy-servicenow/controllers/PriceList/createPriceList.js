const axios = require('axios');
const snConnection = require('../../utils/servicenowConnection');
const handleMongoError = require('../../utils/handleMongoError');
const PriceList = require('../../models/priceList');
const externalIdHelper = require('../../utils/externalIdHelper');

async function createPriceList(req, res = null) {
  try {

    const price = new PriceList(req.body);
    const mongoDocument = await price.save();
    
    const payload={
      ...req.body,
      external_id: mongoDocument._id.toString()
    }

    // Create in ServiceNow
    const connection = snConnection.getConnection(req.user.sn_access_token);
    const snResponse = await axios.post(
      `${connection.baseURL}/api/now/table/sn_csm_pricing_price_list`,
      payload,
      { headers: connection.headers }
    );
    
    // update in MongoDB
    await PriceList.updateOne(
      { _id: mongoDocument._id },
      { sys_id: snResponse.data.result.sys_id }
    );

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