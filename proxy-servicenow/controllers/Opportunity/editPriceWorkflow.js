const Opportunity = require("../../models/opportunity");
const opportunityLine = require("../../models/opportunityLine");
const handleMongoError = require("../../utils/handleMongoError");
const createPriceList = require('../PriceList/createPriceList');
const createPOPrice = require('../ProductOfferingPrice/createProductOfferingPrice');
const createOpportunityLineItem = require('../OpportunityLine/createOpportunityLine');
const deleteOpportunityLine = require('../OpportunityLine/deleteOpportuityline');
const priceList = require("../../models/priceList");
const deletePriceList = require("../PriceList/deletePriceList");

const editOpportunityPrices = async (req, res) => {
  const { opportunityId, productOfferings, priceList } = req.body;

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
    // Store old price list ID for deletion later
    const oldPriceListId = opportunity.price_list._id;

    // Get existing opportunity line items to delete
    const existingLineItems = await opportunityLine.find({
      opportunity: opportunityId
    }).select('_id sys_id');

    // 2. Create new price list linked to opportunity's account
    const payload = { ...req };
    payload.body = {
      ...priceList,
      account: opportunity.account.sys_id.toString()
    };
    const newPriceList = await createPriceList(payload);

    // delete old opp line item 
    const deleteResults = await Promise.all(
      existingLineItems.map(async (lineItemId) => {
        try {
          await deleteOpportunityLine({
            params: { id: lineItemId._id.toString() },
            user: req.user
          });
          console.log("deleted");
          return { success: true, id: lineItemId._id };
        } catch (error) {
          console.error('Failed to delete line item:', error);
          return { success: false, id: lineItemId._id, error: error.message };
        }
      })
    );
    //delete old price list also 
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
    // 3. Create new product offering prices for the new price list
    const results = await productOfferings.reduce(async (previousPromise, priceData) => {
      const accumulatedResults = await previousPromise;

      try {
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

        const pricing = await createPOPrice(payload);
        console.log('Created ProductOfferingPrice:', JSON.stringify(pricing, null, 2));

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
            priceData: priceData
          }
        }];
      }
    }, Promise.resolve([]));



    // 5. Update opportunity to use new price list
    await Opportunity.findByIdAndUpdate(opportunityId, {
      price_list: newPriceList._id
    });

    // 6 Check results and respond
    const allSuccessful = results.every(result => result.success);
    if (allSuccessful) {
      return res.status(200).json({
        success: true,
        message: 'Opportunity prices updated successfully',
        data: {
          newPriceList: {
            _id: newPriceList._id,
            name: newPriceList.name
          },
          deletedItems: {
            lineItems: {
              attempted: existingLineItems.length,
              successful: deleteResults.filter(r => r.success).length,
              failed: deleteResults.filter(r => !r.success).length
            },
            priceList: priceListDeletionResult.success ? 'success' : 'failed'
          },
          creations: { 
            createdLineItems: results.length,
            details : results
          }
        }
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