const axios = require('axios');
const Opportunity = require('../../models/opportunity');
const snConnection = require('../../utils/servicenowConnection');
const handleMongoError = require('../../utils/handleMongoError');
const Account = require('../../models/account');
const PriceList = require('../../models/priceList');

async function updateOpportunityCore(req) {
  const { id } = req.params;
  const { account, price_list, ...updateData } = req.body;
  
  // Find opportunity in MongoDB
  const opportunity = await Opportunity.findById(id);
  if (!opportunity) {
    throw new Error('Opportunity not found');
  }
  
  // Handle account reference
  if (account) {
    const accountDoc = await Account.findById(account);
    if (!accountDoc) {
      throw new Error('Account not found');
    }
    updateData.account = accountDoc.sys_id;
  }
  
  // Handle price_list reference
  if (price_list) {
    const priceListDoc = await PriceList.findById(price_list);
    if (!priceListDoc) {
      throw new Error('PriceList not found');
    }
    updateData.price_list = priceListDoc.sys_id;
  }

  // Update in ServiceNow
  const connection = snConnection.getConnection(req.user.sn_access_token);
  const snResponse = await axios.patch(
    `${connection.baseURL}/api/now/table/sn_opty_mgmt_core_opportunity/${opportunity.sys_id}`,
    updateData,
    { headers: connection.headers }
  );

  // Prepare MongoDB update data
  const mongoUpdate = { ...updateData };
  if (account) mongoUpdate.account = account;
  if (price_list) mongoUpdate.price_list = price_list;

  // Update in MongoDB
  const updatedOpportunity = await Opportunity.findByIdAndUpdate(
    id,
    mongoUpdate,
    { new: true }
  ).populate('account', 'name')
   .populate('price_list', 'name');
  
  return {
    message: 'Opportunity updated successfully',
    data: updatedOpportunity
  };
}

// Express middleware version
async function updateOpportunity(req, res) {
  try {
    const result = await updateOpportunityCore(req);
    res.json(result);
  } catch (error) {
    console.error('Error updating opportunity:', error);
    
    if (error.name?.includes('Mongo')) {
      const mongoError = handleMongoError(error);
      return res.status(mongoError.status).json({ error: mongoError.message });
    }
    
    const status = error.response?.status || 500;
    const message = error.response?.data?.error?.message || error.message;
    res.status(status).json({ error: message });
  }
}

// Dual export pattern
module.exports = updateOpportunity; // Default export for Express
module.exports.updateOpportunityCore = updateOpportunityCore; // Named export for internal use