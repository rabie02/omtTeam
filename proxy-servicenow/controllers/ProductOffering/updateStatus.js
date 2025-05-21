const axios = require('axios');
const jwt = require('jsonwebtoken');
const ProductOffering = require('../../models/ProductOffering');
const handleMongoError = require('../../utils/handleMongoError');

module.exports = async (req, res)=>{
  
    try{
      const id = req.body.id;
      const authHeader = req.headers.authorization;
      const [bearer, token] = authHeader.split(' ');
      if (bearer !== 'Bearer' || !token) {
        return res.status(401).json({ error: 'Invalid authorization format' });
      }
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Find the productOffering by MongoDB _id to get ServiceNow sys_id
      let productOffering;
      try {
          productOffering = await ProductOffering.findById(id);
      } catch (error) {
          if (error.name === 'CastError') {
              return res.status(400).json({ error: 'Invalid productOffering ID format' });
          }
          throw error;
      }

      if (!productOffering) {
          return res.status(404).json({ error: 'productOffering not found' });
      }

      if (!productOffering.id) {
          return res.status(400).json({ error: 'productOffering not synced with ServiceNow (missing sys_id)' });
      }

      const sys_id = productOffering.id;
  
      // Validate allowed fields
      const allowedFields = ['id', 'status'];
      
      const updates = Object.keys(req.body);
      const isValidOperation = updates.every(update => allowedFields.includes(update));
  
      if (!isValidOperation) {
        return res.status(400).json({ error: 'Only two fields allowed: id & status!' });
      }
     
      const payload = {"sys_id":sys_id, "status":req.body.status};
      const snResponse = await axios.patch(
        `${process.env.SERVICE_NOW_URL}/api/sn_prd_pm/product_offering_api/po_pub`,
        payload,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${decoded.sn_access_token}`
          }
        }
      );
      
      try {
          await ProductOffering.findByIdAndUpdate(
              id,
              { $set: snResponse.data },
              { runValidators: true }
          );
      } catch (mongoError) {
          return handleMongoError(res, snResponse.data, mongoError, 'update');
      }
  
      res.json({"_id":id, ...snResponse.data});
      
    } catch (error) {
      console.error('Error update product offering\'s state: ', error);
      const status = error.response?.status || 500;
      const message = error.response?.data?.error?.message || error.message;
      res.status(status).json({ error: message });
    }
  }