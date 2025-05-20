const express = require('express');
const router = express.Router();

// Import controllers
const createOpportunity = require('./createOpportunity');
const createPriceList = require('../PriceList/createPriceList');
const createPOPrice = require('../ProductOfferingPrice/createProductOfferingPrice');
const createOpportunityLineItem = require('../OpportunityLine/createOpportunityLine');

module.exports = async (req, res) => {
  const createNewPriceList = req.body.createNewPriceList;
  const selectedPriceList = req.body.selectedPriceList;
  const op = req.body.opportunity; // opportunity JSON body
  const pl = req.body.priceList; // price list JSON body
  const pos = req.body.productOfferings; // product offerings price list items
  const opli = req.body.opportunityLineItem; // opportunity line item
  const payload = req;
  
  try {
    let priceList = null;
    
    // Create price list if needed
    if (createNewPriceList) {
      payload.body = {...pl, "account": op.account};
      priceList = await createPriceList(payload);
    }
    
    const priceListID = createNewPriceList ? priceList.sys_id : selectedPriceList;

    // Create opportunity
    payload.body = {...op, "price_list": priceListID};
    const opportunity = await createOpportunity(payload);
    
    // Process all product offerings and create line items
    const results = await Promise.all(pos.map(async (po) => {
      try {
        // Prepare product offering price JSON body
        payload.body = {
          ...po,
          priceList: { id: priceListID },
          "lifecycleStatus": "Active",
          '@type': 'ProductOfferingPrice'
        };
        
        // Create Product Offering price
        const pricing = await createPOPrice(payload);
        
        // Prepare opportunity line item JSON body
        payload.body = {
          ...opli,
          price_list: priceListID,
          product_offering: po.productOffering.id,
          opportunity: opportunity.sys_id,
          unit_of_measurement: po.unitOfMeasure.id,
        };
        
        // Create opportunity line item
        const opLineItem = await createOpportunityLineItem(payload);
        
        return {
          success: true,
          productOfferingPrice: pricing,
          opportunityLineItem: opLineItem
        };
      } catch (error) {
        // Return error details for this specific item
        return {
          success: false,
          error: {
            status: error.response?.status || 500,
            message: error.response?.data?.error?.message || error.message,
            productOffering: po
          }
        };
      }
    }));

    // Check if all operations were successful
    const allSuccessful = results.every(result => result.success);
    
    if (allSuccessful) {
      // All items created successfully
      return res.status(201).json({
        success: true,
        message: 'Opportunity created successfully',
        
      });
    } else {
      // Find the first failed operation
      const failedItem = results.find(result => !result.success);
      return res.status(failedItem.error.status).json({
        success: false,
        message: 'Failed to create opportunity line item',
        error: failedItem.error
      });
    }
    
  } catch (error) {
    console.error('Error in opportunity creation:', error);
    const status = error.response?.status || 500;
    const message = error.response?.data?.error?.message || error.message;
    return res.status(status).json({ 
      success: false,
      error: message 
    });
  }
};