const axios = require('axios');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const ProductOfferingCatalog = require('../../models/ProductOfferingCatalog');
const handleMongoError = require('../../utils/handleMongoError');
const getone = require('./getone');

module.exports = async (req, res) => {
  try {
    const token = req.headers.authorization.split(' ')[1];
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);

    if (!req.body.name || !req.body.code) {
      return res.status(400).json({ error: 'Name and code are required' });
    }

    // Generate MongoDB _id first
    const newId = new mongoose.Types.ObjectId();
    const body = req.body;

    // Prepare ServiceNow payload with external_id = MongoDB _id
    const snPayload = {
      name: body.name,
      code: body.code,
      description: body.description || '',
      start_date: body.start_date || new Date().toISOString(),
      start_end: body.start_end || null,
      status: "draft",
      external_id: newId.toString()  // Set external_id to MongoDB _id
    };

    const snResponse = await axios.post(
      `${process.env.SERVICE_NOW_URL}/api/now/table/sn_prd_pm_product_offering_catalog`,
      snPayload,
      {
        headers: {
          'Authorization': `Bearer ${decodedToken.sn_access_token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    let mongoDoc;
    try {
      // Create document with pre-generated _id
      mongoDoc = new ProductOfferingCatalog({
        _id: newId,  // Use pre-generated ID
        ...snResponse.data.result
      });
      
      await mongoDoc.save();
    } catch (mongoError) {
      return handleMongoError(res, snResponse.data, mongoError, 'creation');
    }

    const result = await getone(mongoDoc._id);
    const responseData = {
      result
    };

    res.status(201).json(responseData);
  } catch (error) {
    if (axios.isAxiosError(error)) {
      return res.status(error.response?.status || 500).json({
        error: 'ServiceNow API failed',
        details: error.response?.data || error.message
      });
    }
    res.status(500).json({ error: 'Server error', details: error.message });
  }
};