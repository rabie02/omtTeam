const axios = require('axios');
const snConnection = require('../../utils/servicenowConnection');
const handleMongoError = require('../../utils/handleMongoError');
const priceList = require('../../models/priceList');

module.exports = async (req, res) => {
  try {
    const connection = snConnection.getConnection(req.user.sn_access_token);
    const snResponse = await axios.post(
      `${connection.baseURL}/api/now/table/sn_csm_pricing_price_list`,
      req.body,
      { headers: connection.headers }
    );
    
    // Créer dans MongoDB
    try {
      const price = new priceList({
        sys_id: snResponse.data.id,
        ...req.body
      });
      await price.save();
    } catch (mongoError) {
      return handleMongoError(res, snResponse.data, mongoError, 'creation');
    }
    
    res.status(201).json(snResponse.data);
  } catch (error) {
    console.error('Error creating price:', error);
    const status = error.response?.status || 500;
    const message = error.response?.data?.error?.message || error.message;
    res.status(status).json({ error: message });
  }
};