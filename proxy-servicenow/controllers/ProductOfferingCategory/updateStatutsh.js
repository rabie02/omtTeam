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
router.patch('/product-offering-category-status/:id', async (req, res) => {
  try {
    // Authentication
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Authorization required' });
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    const { id } = req.params;

    // Validation - ensure status is provided
    if (req.body.status === undefined) {
      return res.status(400).json({
        error: 'Missing required field: status'
      });
    }

    // Fetch existing category to confirm it exists
    const existingCategory = await ProductOfferingCategory.findOne({ sys_id: id });
    if (!existingCategory) {
      return res.status(404).json({ error: 'Category not found' });
    }

    // ServiceNow Update (just status field)
    const snResponse = await axios.patch(
      `${process.env.SERVICE_NOW_URL}/api/now/table/sn_prd_pm_product_offering_category/${id}`,
      { status: req.body.status },
      {
        headers: {
          'Authorization': `Bearer ${decodedToken.sn_access_token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    // MongoDB Update
    try {
      await ProductOfferingCategory.updateOne(
        { sys_id: id },
        { $set: { status: req.body.status } },
        { runValidators: true }
      );
    } catch (mongoError) {
      return handleMongoError(res, snResponse.data, mongoError, 'status update');
    }

    res.json(snResponse.data);

  } catch (error) {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status || 500;
      return res.status(status).json({
        error: status === 404 ? 'Not found' : 'ServiceNow status update failed',
        details: error.response?.data || error.message
      });
    }
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

module.exports = router;