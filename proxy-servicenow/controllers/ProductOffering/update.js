const axios = require('axios');
const jwt = require('jsonwebtoken');
const ProductOffering = require('../../models/ProductOffering');
const handleMongoError = require('../../utils/handleMongoError');


// Update Product Offering 
module.exports = async (req, res) => {
  try {
    // Authentication
    const authHeader = req.headers.authorization;
    const [bearer, token] = authHeader.split(' ');
    if (bearer !== 'Bearer' || !token) {
      return res.status(401).json({ error: 'Invalid authorization format' });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Validate allowed fields
    const allowedFields = [
      'name', 'displayName', 'description', 'lifecycleStatus',
      'productOfferingTerm', 'validFor', 'productOfferingPrice',
      'prodSpecCharValueUse', 'channel', 'category', 'status'
    ];
    
    const updates = Object.keys(req.body);
    const isValidOperation = updates.every(update => allowedFields.includes(update));
    
    // if (!isValidOperation) {
    //   return res.status(400).json({ error: 'Invalid updates!' });
    // }
   
    // ServiceNow Update
    const snResponse = await axios.patch(
      `${process.env.SERVICE_NOW_URL}/api/sn_tmf_api/catalogmanagement/productOffering/${req.params.id}`,
      req.body,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${decoded.sn_access_token}`
        }
      }
    );

     // MongoDB Update
    try {
      await ProductOffering.updateOne(
        { id: req.params.id },
        { $set: snResponse.data },
        { runValidators: true }
      );
    } catch (mongoError) {
      return handleMongoError(res, snResponse.data, mongoError, 'update');
    }

    res.json(snResponse.data);

  } catch (error) {
    console.error('Error updating product offering:', error);
    const status = error.response?.status || 500;
    const message = error.response?.data?.error?.message || error.message;
    res.status(status).json({ error: message });
  }
};
