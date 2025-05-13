const express = require('express');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const ProductOfferingCategory = require('../../models/ProductOfferingCategory');

const router = express.Router();
require('dotenv').config();

// Error handling helper
const handleMongoError = (res, serviceNowData, error, operation) => {
  console.error(`MongoDB ${operation} error:`, error);
  return res.status(500).json({
    error: `Operation partially failed - Success in ServiceNow but failed in MongoDB (${operation})`,
    serviceNowSuccess: serviceNowData,
    mongoError: error.message
  });
};

// This route is for updating just the status of a product offering category
router.patch('/product-offering-category-status',  async (req, res)=>{
  
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

      const snResponse2 = await axios.patch(
        `${process.env.SERVICE_NOW_URL}/api/sn_prd_pm/product_offering_api/poc_pub`,
        {
            sys_id: req.body.sys_id,
            status: req.body.status
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${decoded.sn_access_token}`
          }
        }
      );
      
      try {
        await ProductOfferingCategory.updateOne(
          { sys_id: req.body.sys_id },
          { $set: {status:req.body.status}},
          { runValidators: true }
        );
      } catch (mongoError) {
        return handleMongoError(res, snResponse2.data, mongoError, 'update');
      }
  
      res.json(snResponse2.data.result);
      
    } catch (error) {
      console.error('Error update product offering category \'s state: ', error);
      const status = error.response?.status || 500;
      const message = error.response?.data?.error?.message || error.message;
      res.status(status).json({ error: message });
    }
  });

  module.exports = router;