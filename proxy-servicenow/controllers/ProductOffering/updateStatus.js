const axios = require('axios');
const jwt = require('jsonwebtoken');
const ProductOffering = require('../../models/ProductOffering');
const handleMongoError = require('../../utils/handleMongoError');

module.exports = async (req, res)=>{
  
    try{
      
      const authHeader = req.headers.authorization;
      const [bearer, token] = authHeader.split(' ');
      if (bearer !== 'Bearer' || !token) {
        return res.status(401).json({ error: 'Invalid authorization format' });
      }
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
  
      // Validate allowed fields
      const allowedFields = ['sys_id', 'status'];
      
      const updates = Object.keys(req.body);
      const isValidOperation = updates.every(update => allowedFields.includes(update));
  
      if (!isValidOperation) {
        return res.status(400).json({ error: 'Only two fields allowed: sys_id & status!' });
      }
     
  
      const snResponse = await axios.patch(
        `${process.env.SERVICE_NOW_URL}/api/1598581/product_offering_api/po_pub`,
        req.body,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${decoded.sn_access_token}`
          }
        }
      );
  
      res.json(snResponse.data);
      
    } catch (error) {
      console.error('Error update product offering\'s state: ', error);
      const status = error.response?.status || 500;
      const message = error.response?.data?.error?.message || error.message;
      res.status(status).json({ error: message });
    }
  }