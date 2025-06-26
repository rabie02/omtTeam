const axios = require('axios');
const snConnection = require('../../utils/servicenowConnection');
const handleMongoError = require('../../utils/handleMongoError');
const PriceList = require('../../models/priceList');
const ProductOffering = require('../../models/ProductOffering');
const Opportunity = require('../../models/opportunity'); 
const opportunityLine = require('../../models/opportunityLine');
const mongoose = require('mongoose');

async function createOpportunityLine(req, res = null) {
  try {

    const { price_list, product_offering, opportunity,external_id, ...rest } = req.body;

    // Look up ServiceNow sys_ids for referenced documents
    const [priceListDoc, productOfferingDoc, opportunityDoc] = await Promise.all([
      PriceList.findById(price_list),
      ProductOffering.findById(product_offering),
      Opportunity.findById(opportunity)
    ]);

    if (!priceListDoc) {
      throw new Error(`PriceList with ID ${price_list} not found`);
    }
    if (!productOfferingDoc) {
      throw new Error(`ProductOffering with ID ${product_offering} not found`);
    }
    if (!opportunityDoc) {
      throw new Error(`Opportunity with ID ${opportunity} not found`);
    }
    const newId = new mongoose.Types.ObjectId();

    // Prepare ServiceNow payload with sys_ids
    const snPayload = {
      ...rest,
      external_id:newId,
      price_list: priceListDoc.sys_id,
      product_offering: productOfferingDoc.id,
      opportunity: opportunityDoc.sys_id,
    };

    // Create in ServiceNow
    const connection = snConnection.getConnection(req.user.sn_access_token);
    const snResponse = await axios.post(
      `${connection.baseURL}/api/now/table/sn_opty_mgmt_core_opportunity_line_item`,
      snPayload,
      { headers: connection.headers }
    );
    
    // Prepare MongoDB document 
    const mongoPayload = {
      _id: newId,
      ...snResponse.data.result,
      priceList: price_list,
      productOffering: product_offering,
      opportunity: opportunity,
      
    };

    // update in MongoDB
    try {
      
      const opportunityLineDoc = new opportunityLine(mongoPayload);
      await opportunityDoc.save();

      // Prepare response
      const response = {
        ...snResponse.data,
        mongoReferences: {
          priceList: price_list,
          productOffering: product_offering,
          opportunity: opportunity,
          mongoId: opportunityLineDoc._id
        }
      };

      if (res) {
        return res.status(201).json(response);
      }
      return response;
    } catch (mongoError) {
      if (res) {
        return handleMongoError(res, snResponse.data.result, mongoError, 'creation');
      }
      throw mongoError;
    }
  } catch (error) {
    console.error('Error creating opportunity line:', error);
    
    if (res) {
      const status = error.response?.status || 500;
      const message = error.response?.data?.error?.message || error.message;
      return res.status(status).json({ error: message });
    }
    throw error;
  }
}

// Original Express route handler for backward compatibility
module.exports = async (req, res) => {
  return createOpportunityLine(req, res);
};

// Export the function directly as well
module.exports.createOpportunityLine = createOpportunityLine;