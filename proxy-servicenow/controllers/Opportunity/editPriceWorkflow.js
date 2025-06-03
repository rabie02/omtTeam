const Opportunity = require("../../models/opportunity");
const opportunityLine = require("../../models/opportunityLine");
const handleMongoError = require("../../utils/handleMongoError");
const createPriceList = require('../PriceList/createPriceList');
const createPOPrice = require('../ProductOfferingPrice/createProductOfferingPrice');
const createOpportunityLineItem = require('../OpportunityLine/createOpportunityLine');
const deleteOpportunityLine = require('../OpportunityLine/deleteOpportuityline');

const editOpportunityPrices = async (req, res) => {
  const { opportunityId, newPrices, priceListData } = req.body;

  try {
    // 1. Get existing opportunity with account info
    const opportunity = await Opportunity.findById(opportunityId)
      .select('account price_list')
      .populate('account', '_id sys_id');

    if (!opportunity) {
      return res.status(404).json({
        success: false,
        error: 'Opportunity not found'
      });
    }
    // Get existing opportunity line items to delete
    const existingLineItems = await opportunityLine.find({
      opportunity: opportunityId
    }).select('_id sys_id');

    // 2. Create new price list linked to opportunity's account
    const payload = { ...req };
    payload.body = {
      ...priceListData,
      account: opportunity.account.sys_id.toString()
    };
    const newPriceList = await createPriceList(payload);

    // delete old opp line item 

    const deletePromises = existingLineItems.map(async (lineItem) => {
      try {
        const deleteReq = {
          id: lineItem._id.toString(),
          user: req.user
        };

        await deleteOpportunityLine(deleteReq);
        return { success: true, deletedId: lineItem._id };
      } catch (error) {
        console.error(`Failed to delete line item ${lineItem._id}:`, error);
        return { success: false, error: error.message, lineItemId: lineItem._id };
      }
    });

    const deleteResults = await Promise.all(deletePromises);
    const deletionErrors = deleteResults.filter(result => !result.success);

    if (deletionErrors.length > 0) {
      console.warn('Some line items failed to delete:', deletionErrors);
    }

    // 3. Create new product offering prices for the new price list
    const results = await newPrices.reduce(async (previousPromise, priceData) => {
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
          deletedLineItems: deleteResults.filter(r => r.success).length,
          createdLineItems: results.length,
          lineItemResults: results
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
    const mongoError = handleMongoError(error);
    return res.status(status).json({
      success: false,
      error: message,
      mongoError: mongoError.message
    });
  }
};

module.exports = editOpportunityPrices;