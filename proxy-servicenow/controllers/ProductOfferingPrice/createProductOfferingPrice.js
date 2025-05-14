const axios = require('axios');
const ProductOfferingPrice = require('../../models/ProductOfferingPrice');
const snConnection = require('../../utils/servicenowConnection');
const handleMongoError = require('../../utils/handleMongoError');

module.exports = async (req, res) => {
  try {
    // Créer dans ServiceNow TMF API
    const connection = snConnection.getConnection(req.user.sn_access_token);
    const snResponse = await axios.post(
      `${connection.baseURL}/api/sn_tmf_api/catalogmanagement/productOfferingPrice`,
      req.body,
      { headers: connection.headers }
    );
    
    // Créer dans MongoDB
    try {
      const price = new ProductOfferingPrice({
        sys_id: snResponse.data.id,
        ...req.body
      });
      await price.save();
    } catch (mongoError) {
      return handleMongoError(res, snResponse.data, mongoError, 'creation');
    }
    
    res.status(201).json(snResponse.data);
  } catch (error) {
    console.error('Error creating product offering price:', error);
    const status = error.response?.status || 500;
    const message = error.response?.data?.error?.message || error.message;
    res.status(status).json({ error: message });
  }
};