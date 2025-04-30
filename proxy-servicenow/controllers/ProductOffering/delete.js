const axios = require('axios');
const jwt = require('jsonwebtoken');
const ProductOffering = require('../../models/ProductOffering');
const handleMongoError = require('../../utils/handleMongoError');


module.exports = async (req, res) => {
  try {
    // Authentication
    const authHeader = req.headers.authorization;
    const [bearer, token] = authHeader.split(' ');
    if (bearer !== 'Bearer' || !token) {
      return res.status(401).json({ error: 'Invalid authorization format' });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Delete from ServiceNow
    const snResponse = await axios.delete(
      `${process.env.SERVICE_NOW_URL}/api/now/table/sn_prd_pm_product_offering/${req.params.id}`,
      {
        headers: {
          'Authorization': `Bearer ${decoded.sn_access_token}`
        }
      }
    );

     // MongoDB Delete
    try {
      await ProductOffering.deleteOne({id: req.params.id });
    } catch (mongoError) {
      return handleMongoError(res, snResponse.data, mongoError, 'deletion');
    }

    res.json(snResponse.data);

  } catch (error) {
    console.error('Error deleting product offering:', error);
    const status = error.response?.status || 500;
    const message = error.response?.data?.error?.message || error.message;
    res.status(status).json({ error: message });
  }
};