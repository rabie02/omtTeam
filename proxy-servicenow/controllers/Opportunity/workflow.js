const express = require('express');
const handleMongoError = require('../../utils/handleMongoError');
// Import controllers
const createOpportunity = require('./createOpportunity');
const createPriceList = require('../PriceList/createPriceList');
const createPOPrice = require('../ProductOfferingPrice/createProductOfferingPrice');
const createOpportunityLineItem = require('../OpportunityLine/createOpportunityLine');
const createAccount = require('../account/create');
const createContact = require('../contact/create');
const getOpportunityWithDetails = require("./getOpportuntityWithdetails");

const Account = require("../../models/account");
module.exports = async (req, res) => {

  const createNewPriceList = req.body.createNewPriceList;
  const selectedPriceList = req.body.selectedPriceList;
  const op = req.body.opportunity; // opportunity JSON body
  const pl = req.body.priceList; // price list JSON body
  const pos = req.body.productOfferings; // product offerings price list items turned into opportunity line items.
  //const opli = req.body.opportunityLineItem; // opportunity line item
  const acc = req.body.account;
  const payload = req;
  
  try {
    let priceList = null;
    let account = null;

    //create account or use an existing one
    payload.body = acc;
    account = acc.name !== "" ? await createAccount(payload) : await Account.findById(op.account);
    //create contact to send notifications
    console.log(JSON.stringify(account,null,2));
    payload.body={
      firstName: acc.name,
      lastName: "",
      email: acc.email,
      phone: "",
      account: account?._id,
      isPrimaryContact: true,
      active: true,
    }
    contact = acc.name !=="" && await createContact(payload);

    // Create price list if needed
    if (createNewPriceList) {
      payload.body = {...pl, "account": account.mongodb?.sys_id.toString() || account.sys_id.toString()};
      priceList = await createPriceList(payload);
    }
    
    const priceListID = createNewPriceList ? priceList._id : selectedPriceList;

    // Create opportunity
    payload.body = {...op, "price_list": priceListID, "account":account._id.toString()};
    const opportunity = await createOpportunity(payload);
    
    // Process all product offerings and create line items
    const results = await pos.reduce(async (previousPromise, po) => {
  const accumulatedResults = await previousPromise;
  
  try {
    // Prepare product offering price JSON body
    const { term_month, quantity, ...filteredPo } = po;
    payload.body = {
      ...filteredPo,
      priceList: { id: priceListID },
      "lifecycleStatus": "Active",
      '@type': 'ProductOfferingPrice'
    };

    const pricing = await createPOPrice(payload);
    
    payload.body = {
      quantity: quantity,
      term_month: term_month,
      price_list: priceListID,
      product_offering: po.productOffering.id,
      opportunity: opportunity._id,
      unit_of_measurement: po.unitOfMeasure.id,
    };

    console.log(JSON.stringify());

    const opLineItem = await createOpportunityLineItem(payload);
    
    return [...accumulatedResults, {
      success: true,
      productOfferingPrice: pricing,
      opportunityLineItem: opLineItem
    }];
  } catch (error) {
    return [...accumulatedResults, {
      success: false,
      error: {
        status: error.response?.status || 500,
        message: error.response?.data?.error?.message || error.message,
        productOffering: po
      }
    }];
  }
}, Promise.resolve([]));

const resultOpportunity = await getOpportunityWithDetails(opportunity._id);

    // Check if all operations were successful
    const allSuccessful = results.every(result => result.success);
    if (allSuccessful) {
      // All items created successfully
      return res.status(201).json({
        data: resultOpportunity,
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
    const mongoError = handleMongoError(error);
    return res.status(status).json({ 
      success: false,
      error: message,
      mongoErro: mongoError.message
    });
  }
};