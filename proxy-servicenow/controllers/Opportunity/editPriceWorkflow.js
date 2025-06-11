const Opportunity = require("../../models/opportunity");
const opportunityLine = require("../../models/opportunityLine");
const createPriceList = require('../PriceList/createPriceList');
const createPOPrice = require('../ProductOfferingPrice/createProductOfferingPrice');
const createOpportunityLineItem = require('../OpportunityLine/createOpportunityLine');
const deleteOpportunityLine = require('../OpportunityLine/deleteOpportuityline');
const deletePriceList = require("../PriceList/deletePriceList");
const getOpportunityWithDetails = require("./getOpportuntityWithdetails");
const { updateOpportunityCore } = require('./updateOpportunity');
const getProductOfferingPriceByPriceList = require('../ProductOfferingPrice/getProductOfferingPriceByPriceList');
const create = require("../account/create");

const editOpportunityPrices = async (req, res) => {
  const { createNewPriceList, selectedPriceList, opportunityId, productOfferings, priceList } = req.body;
  const payload = { ...req };
  try {
    // 1. Get existing opportunity with account info
    const opportunity = await Opportunity.findById(opportunityId)
      .select('account price_list')
      .populate('account', '_id sys_id')
      .populate('price_list', '_id sys_id name');

    if (!opportunity) {
      return res.status(404).json({
        success: false,
        error: 'Opportunity not found'
      });
    }
    let pops;
    let chosen = [];
    let newPriceList = createNewPriceList ? {} : {_id: selectedPriceList};
    if(!createNewPriceList){
      try {
        pops = await getProductOfferingPriceByPriceList({
          params: { id: selectedPriceList.toString() },
          user: req.user
        });
        pops.success = true;
      } catch (error) {
        console.error('product offering price fetching failed:', error);
        pops.error = error.message;
      }
      const popsData = pops.result;
      chosen = productOfferings.map(op => {
        return (popsData.find(item => item.productOffering._id.toString() === op.productOffering.id))
      });
    }
    
    //Store old price list ID for deletion later
    let oldPriceListId = false;
    if (opportunity.price_list !== null) oldPriceListId = opportunity.price_list._id;

    // Get existing opportunity line items to delete
    const existingLineItems = await opportunityLine.find({
      opportunity: opportunityId
    }).select('_id sys_id');

    // 2. Create new price list linked to opportunity's account
    if(createNewPriceList){
      
      payload.body = {
        ...priceList,
        account: opportunity.account.sys_id.toString()
      };
      newPriceList = await createPriceList(payload);
    }

    // delete old opp line item 
    const deleteResults = await Promise.all(
      existingLineItems.map(async (lineItemId) => {
        try {
          await deleteOpportunityLine({
            params: { id: lineItemId._id.toString() },
            user: req.user
          });
          console.log("opportunity line item deleted");
          return { success: true, id: lineItemId._id };
        } catch (error) {
          console.error('Failed to delete line item:', error);
          return { success: false, id: lineItemId._id, error: error.message };
        }
      })
    );
    //delete old price list also 
    if(createNewPriceList){
      let priceListDeletionResult = { success: false };
      if (oldPriceListId) {
        try {
          priceListDeletionResult = await deletePriceList({
            params: { id: oldPriceListId.toString() },
            user: req.user
          });
          priceListDeletionResult.success = true;
        } catch (error) {
          console.error('Price list cleanup failed:', error);
          priceListDeletionResult.error = error.message;
        }
      }
    }
    // 3. Create new product offering prices for the new price list
    const results = await productOfferings.reduce(async (previousPromise, priceData) => {
      const accumulatedResults = await previousPromise;
      
      try{
        // Create product offering price (following creation workflow pattern)
        const { term_month, quantity, productOffering, unitOfMeasure, ...filteredPriceData } = priceData;
        payload.body = {
          ...filteredPriceData,
          priceList: { id: newPriceList._id },
          productOffering: productOffering,
          unitOfMeasure: unitOfMeasure,
          lifecycleStatus: "Active",
          '@type': 'ProductOfferingPrice'
        };
        const createNewPOP = createNewPriceList || filteredPriceData.new ? true : false;
        console.log('Creating ProductOfferingPrice with payload:', JSON.stringify(payload.body, null, 2));
        const pricing = createNewPOP ? await createPOPrice(payload) : chosen.find(item => item!==undefined && item.productOffering._id.toString() === productOffering.id);
        console.log('Created ProductOfferingPrice!');

        // Create opportunity line item (following creation workflow pattern)
        payload.body = {
          quantity: quantity,
          term_month: term_month,
          price_list: newPriceList._id,
          product_offering: productOffering.id,
          opportunity: opportunityId,
          unit_of_measurement: unitOfMeasure.id,
        };
        console.log('Creating OpportunityLineItem with payload:', JSON.stringify(payload.body, null, 2));
        const opLineItem = await createOpportunityLineItem(payload);
        console.log('Created OpportunityLineItem!');

        return [...accumulatedResults, {
          success: true,
          productOfferingPrice: pricing,
          opportunityLineItem: opLineItem
        }];
      } catch (error) {
        console.log(error);
        return [...accumulatedResults, {
          success: false,
          error: {
            status: error.response?.status || 500,
            message: error.response?.data?.error?.message || error.message,
            priceData: priceData
          }
        }];
      }
    }, Promise.resolve([]));

    // 5. Update opportunity to use new price list
    // await Opportunity.findByIdAndUpdate(opportunityId, {
    //   price_list: newPriceList._id
    // });

    await updateOpportunityCore({
      params: { id: opportunityId },
      body: {
        ...req.body.opportunity, // Spread all opportunity fields
        price_list: newPriceList._id // Include the new price list reference
      },
      user: req.user
    });

    //get complet updated opp 
    const updatedOpportunity = await getOpportunityWithDetails(opportunityId);

    // 6 Check results and respond
    const allSuccessful = results.every(result => result.success);
    if (allSuccessful) {
      return res.status(200).json({
        success: true,
        message: 'Opportunity prices updated successfully',
        data: updatedOpportunity
      });
    } else {
      const failedItem = results.find(result => !result.success);
      return res.status(failedItem.error.status).json({
        success: false,
        message: 'Failed to create some opportunity line items',
        error: failedItem.error
      });
    }
   

  } catch (error) {
    console.error('Error in opportunity creation:', error);
    const status = error.response?.status || 500;
    const message = error.response?.data?.error?.message || error.message;
    return res.status(status).json({
      success: false,
      error: message,
    });
  }
};

module.exports = editOpportunityPrices;