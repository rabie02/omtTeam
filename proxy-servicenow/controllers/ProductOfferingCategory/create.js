const express = require('express');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const ProductOfferingCategory = require('../../models/ProductOfferingCategory');
const ProductOfferingCatalog = require('../../models/ProductOfferingCatalog');
const handleMongoError = require('../../utils/handleMongoError');
const createCatalogCategoryRelationship = require('../CatalogCategroyRelationship/create');

require('dotenv').config();

// CREATE ProductOfferingCategory
module.exports = async (req, res) => {
  try {
    // 1. Authentication
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'Authorization required' });
    }

    let decodedToken;
    try {
      decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }


    const { name, code, is_leaf, catalog, start_date, end_date, description } = req.body;
    if (!name || !code || !start_date || typeof is_leaf === 'undefined') {
      return res.status(400).json({
        error: 'Missing required fields: name, code, is_leaf'
      });
    }


    let catalogDoc;
    try {
      catalogDoc = await ProductOfferingCatalog.findById(catalog);
    } catch (error) {
      if (error.name === 'CastError') {
        return res.status(400).json({ error: 'Invalid catalog ID format' });
      }
      throw error;
    }

    if (!catalogDoc) {
      return res.status(404).json({ error: 'Catalog not found' });
    }


    let snResponse;
    try {
      snResponse = await axios.post(
        `${process.env.SERVICE_NOW_URL}/api/now/table/sn_prd_pm_product_offering_category`,
        {
          name: name,
          code: code,
          is_leaf: is_leaf,
          start_date: start_date || new Date().toISOString(),
          description: description
        },
        {
          headers: {
            'Authorization': `Bearer ${decodedToken.sn_access_token}`,
            'Content-Type': 'application/json'
          }
        }
      );
    } catch (error) {
      return res.status(error.response?.status || 500).json({
        error: 'ServiceNow API failed',
        details: error.response?.data || error.message
      });
    }


    let mongoDoc;
    try {
      const snRecord = snResponse.data.result;
      mongoDoc = new ProductOfferingCategory(snRecord);
      await mongoDoc.save();
    } catch (mongoError) {
      return handleMongoError(res, snResponse.data, mongoError, 'creation');
    }


    try {
      await createCatalogCategoryRelationship(
        catalogDoc,
        mongoDoc,
        decodedToken.sn_access_token
      );
    } catch (error) {
      return res.status(500).json({
        error: 'Failed to create catalog-category relationship',
        details: error.message
      });
    }



    
    const responseData = {
      result: {
        ...snResponse.data.result,
        _id: mongoDoc._id,
      },
    };

    return res.status(201).json(responseData);

  } catch (error) {
    return res.status(500).json({ error: 'Server error', details: error.message });
  }
};
