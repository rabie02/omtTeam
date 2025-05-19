const express = require('express');
const router = express.Router();

// Import controllers

const createOpportunity = require('./createOpportunity');
const createPriceList = require('../PriceList/createPriceList');
const createPOPrice = require('../ProductOfferingPrice/createProductOfferingPrice');
const createOpportunityLineItem = require('../OpportunityLine/createOpportunityLine');

module.exports =  async (req, res) => {
  const createNewPriceList = req.body.createNewPriceList;
  const selectedPriceList = req.body.selectedPriceList;
  const op = req.body.opportunity; //opportunity JSON body
  const pl = req.body.priceList; // price list JSON body
  const pos = req.body.productOfferings; // product offerings price list items
  const opli = req.body.opportunityLineItem; //opportunity line item
  const payload = req;
  const priceList = "";
  try {
    payload.body = op;
    const opportunity = await createOpportunity(payload);
    if(payload.createNewPriceList){
      payload.body = pl;
      priceList = await createPriceList(payload);
    }
    const priceListID = createNewPriceList ? priceList.sys_id : selectedPriceList;
    const pops = [];
    pos.map((po)=> {
      payload.body = {
        ...po,
        priceList: { id: priceListID },
        "lifecycleStatus": "Active",
        '@type': 'ProductOfferingPrice'
      };
      const pricing = createPOPrice(payload);
      payload.body = {
        ...opli,
        price_list: priceListID,
        product_offering: po.productOffering.id,
        opportunity: opportunity.result.sys_id,
        unit_of_measurement: po.unitOfMeasure.id,
      }
      const poLineItem = createOpportunityLineItem(payload);
      
    });

    res.status(201);
  } catch (error) {
    console.error('Error creating opportunity:', error);
    const status = error.response?.status || 500;
    const message = error.response?.data?.error?.message || error.message;
    res.status(status).json({ error: message });
  }
};