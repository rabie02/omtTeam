const axios = require('axios');
const jwt = require('jsonwebtoken');
const CustomerOrder = require('../../models/CustomerOrder');
const handleMongoError = require('../../utils/handleMongoError');

module.exports = async (req, res) => {
  try {
    // Authentication and Authorization
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'Authorization header missing' });
    
    const [bearer, token] = authHeader.split(' ');
    if (bearer !== 'Bearer' || !token) {
      return res.status(401).json({ error: 'Invalid authorization format' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);


    // ServiceNow API Call
    const snResponse = await axios.post(
      `${process.env.SERVICE_NOW_URL}/api/sn_ind_tmt_orm/order/productOrder`,
      req.body,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${decoded.sn_access_token}`
        }
      }
    );

    //console.log(JSON.stringify(snResponse.data.result, null, 2));

     // MongoDB Create
        try {
          const snRecord = snResponse.data;
          const mongoDoc = new CustomerOrder({    
            ...snRecord
          });
          await mongoDoc.save();
        } catch (mongoError) {
          return handleMongoError(res, snResponse.data, mongoError, 'creation');
        }

    res.status(201).json(snResponse.data);

  } catch (error) {
    console.error('Error creating product offering:', error);
    const status = error.response?.status || 500;
    const message = error.response?.data?.error?.message || error.message;
    res.status(status).json({ error: message });
  }
};