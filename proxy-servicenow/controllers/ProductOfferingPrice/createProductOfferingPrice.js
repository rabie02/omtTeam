const axios = require('axios');
const ProductOfferingPrice = require('../../models/productOfferingPrice');
const snConnection = require('../../utils/servicenowConnection');
const handleMongoError = require('../../utils/handleMongoError');

async function createProductOfferingPrice(req, res = null) {
  try {
    // Create in ServiceNow TMF API
    const connection = snConnection.getConnection(req.user.sn_access_token);
    const snResponse = await axios.post(
      `${connection.baseURL}/api/sn_tmf_api/catalogmanagement/productOfferingPrice`,
      req.body,
      { headers: connection.headers }
    );
    
    // Create in MongoDB
    try {
      const price = new ProductOfferingPrice({
        sys_id: snResponse.data.id,
        ...req.body
      });
      await price.save();
    } catch (mongoError) {
      if (res) {
        return handleMongoError(res, snResponse.data, mongoError, 'creation');
      }
      throw mongoError;
    }
    
    if (res) {
      return res.status(201).json(snResponse.data);
    }
    return snResponse.data;
  } catch (error) {
    console.error('Error creating product offering price:', error);
    
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
  return createProductOfferingPrice(req, res);
};

// Export the function directly as well
module.exports.createProductOfferingPrice = createProductOfferingPrice;