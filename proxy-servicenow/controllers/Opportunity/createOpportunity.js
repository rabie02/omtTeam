const axios = require('axios');
const mongoose = require('mongoose');
const Opportunity = require('../../models/Opportunity');
const PriceList = require('../../models/priceList'); 
const snConnection = require('../../utils/servicenowConnection');
const handleMongoError = require('../../utils/handleMongoError');

async function createOpportunity(req, res = null) {
  const priceListSys_id = await getPriceListReference(req.body.price_list);
  try {
    const snPayload = {
      price_list: priceListSys_id,
      short_description: req.body.short_description,
      estimated_closed_date: req.body.estimated_closed_date,
      description: req.body.description,
      term_month: req.body.term_month,
      sales_cycle_type: req.body.sales_cycle_type,
      probability: req.body.probability,
      stage: req.body.stage,
      industry: req.body.industry,
      account: req.body.account
    }
    
    // Create in ServiceNow
    const connection = snConnection.getConnection(req.user.sn_access_token);
    const snResponse = await axios.post(
      `${connection.baseURL}/api/now/table/sn_opty_mgmt_core_opportunity`,
      snPayload,
      { headers: connection.headers }
    );
    
    // Prepare MongoDB data
    const snData = snResponse.data.result;
    
    const mongoData = {
      sys_id: snData.sys_id,
      number: snData.number,
      // Handle price_list reference conversion
      price_list: req.body.price_list,
      // Include other fields from both sources
      ...transformServiceNowData(snData),
      ...req.body
    };

    // Create in MongoDB
    let mongoDocument;
    try {
      mongoDocument = await Opportunity.create(mongoData);
    } catch (mongoError) {
      if (res) {
        return handleMongoError(res, snData, mongoError, 'creation');
      }
      throw mongoError;
    }

    // Prepare response
    const response = {
      ...snData,
      _id: mongoDocument._id.toString(),
      mongoId: mongoDocument._id.toString()
    };
    
    if (res) {
      return res.status(201).json(response);
    }
    return response;
  } catch (error) {
    console.error('Error creating opportunity:', error);
    if (res) {
      const status = error.response?.status || 500;
      const message = error.response?.data?.error?.message || error.message;
      return res.status(status).json({ error: message });
    }
    throw error;
  }
}

// Helper function to get PriceList reference
async function getPriceListReference(id) {
  try {
    const price_list = await PriceList.findById(id);
    return price_list.sys_id ? price_list.sys_id : undefined
  } catch (error) {
    console.error('Error resolving price_list reference:', error);
    return undefined;
  }
}

// Helper function to transform ServiceNow data types
function transformServiceNowData(snData) {
  return {
    short_description: snData.short_description,
    estimated_closed_date: snData.estimated_closed_date ? new Date(snData.estimated_closed_date) : null,
    actual_closed_date: snData.actual_closed_date ? new Date(snData.actual_closed_date) : null,
    term_month: parseInt(snData.term_month) || 0,
    probability: parseInt(snData.probability) || 0,
    do_not_share: snData.do_not_share === 'true',
    do_not_email: snData.do_not_email === 'true',
    do_not_call: snData.do_not_call === 'true'
    // Add other field transformations as needed
  };
}

// Original Express route handler for backward compatibility
module.exports = async (req, res) => {
  return createOpportunity(req, res);
};

module.exports.createOpportunity = createOpportunity;