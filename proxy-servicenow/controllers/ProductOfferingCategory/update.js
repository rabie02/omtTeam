const express = require('express');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const ProductOfferingCategory = require('../../models/ProductOfferingCategory');
const ProductOfferingCatalog = require('../../models/ProductOfferingCatalog');
const handleMongoError = require('../../utils/handleMongoError');
const updateCatalogCategoryRelationship = require('../CatalogCategroyRelationship/update');
const getone = require('./getone')

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

    // 2. Validate category ID
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ error: 'Category ID is required' });
    }

    const { catalog } = req.body;

    // 3. Find existing category and catalog
    let existingCategory;
    try {
      existingCategory = await ProductOfferingCategory.findById(id);
    } catch (error) {
      if (error.name === 'CastError') {
        return res.status(400).json({ error: 'Invalid category ID format' });
      }
      throw error;
    }

    if (!existingCategory) {
      return res.status(404).json({ error: 'Category not found' });
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

    const allowedFields = [
      'end_date', 'image', 'thumbnail', 'description', 'external_id',
      'is_default', 'external_source', 'status', 'name', 'hierarchy_json', 'leaf_categories'
    ];

    const updateBody = {};
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        updateBody[field] = req.body[field] === "" ? null : req.body[field];
      }
    });

    // 4. Update ServiceNow record
    let snResponse;
    try {
      snResponse = await axios.patch(
        `${process.env.SERVICE_NOW_URL}/api/now/table/sn_prd_pm_product_offering_category/${existingCategory.sys_id}`,
        updateBody,
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

    // 5. Update MongoDB
    let updatedCategory;
    try {
      updatedCategory = await ProductOfferingCategory.findByIdAndUpdate(
        id,
        { $set: snResponse.data.result },
        { new: true, runValidators: true }
      );
    } catch (mongoError) {
      return handleMongoError(res, snResponse.data, mongoError, 'update');
    }

    // 6. Handle catalog relationship update

    try {
      await updateCatalogCategoryRelationship(
        catalogDoc,
        updatedCategory,
        decodedToken.sn_access_token
      );
    } catch (error) {
      return res.status(500).json({
        error: 'Failed to create catalog-category relationship',
        details: error.message
      });
    }

    // 7. Prepare response
    const result = await getone(updatedCategory._id)
    const responseData = {
      result
    };

    return res.status(200).json(responseData);

  } catch (error) {
    return res.status(500).json({ error: 'Server error', details: error.message });
  }
};