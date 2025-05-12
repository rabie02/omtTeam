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

// CREATE
router.post('/product-offering-category', async (req, res) => {
  try {
    // Authentication
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Authorization required' });
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);

    // Validation
    if (!req.body.name || !req.body.code || typeof req.body.is_leaf === 'undefined') {
      return res.status(400).json({
        error: 'Missing required fields: name, code, is_leaf'
      });
    }

    // ServiceNow Request
    const snResponse = await axios.post(
      `${process.env.SERVICE_NOW_URL}/api/now/table/sn_prd_pm_product_offering_category`,
      {
        name: req.body.name,
        code: req.body.code,
        is_leaf: req.body.is_leaf,
        start_date: req.body.start_date || new Date().toISOString(),
        end_date: req.body.end_date || null,
        description: req.body.description
      },
      {
        headers: {
          'Authorization': `Bearer ${decodedToken.sn_access_token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    // MongoDB Create
    try {
      const snRecord = snResponse.data.result;
      const mongoDoc = new ProductOfferingCategory({
        sys_id: snRecord.sys_id,
        ...snRecord
      });
      await mongoDoc.save();
    } catch (mongoError) {
      return handleMongoError(res, snResponse.data, mongoError, 'creation');
    }

    res.status(201).json(snResponse.data);

  } catch (error) {
    if (axios.isAxiosError(error)) {
      return res.status(error.response?.status || 500).json({
        error: 'ServiceNow API failed',
        details: error.response?.data || error.message
      });
    }
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

module.exports = router;