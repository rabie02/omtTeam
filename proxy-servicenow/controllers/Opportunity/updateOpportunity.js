const axios = require('axios');
const Opportunity = require('../../models/Opportunity');
const snConnection = require('../../utils/servicenowConnection');
const handleMongoError = require('../../utils/handleMongoError');
const Account = require('../../models/account');
const PriceList = require('../../models/priceList');

async function updateOpportunity(req, res) {
  try {
    const { id } = req.params;
    const { account, price_list, ...updateData } = req.body;
    
    // Find opportunity in MongoDB
    const opportunity = await Opportunity.findById(id);
    if (!opportunity) {
      return res.status(404).json({ error: 'Opportunity not found' });
    }
    
    // Handle account reference
    if (account) {
      const accountDoc = await Account.findById(account);
      if (!accountDoc) {
        return res.status(404).json({ error: 'Account not found' });
      }
      updateData.account = accountDoc.sys_id;
    }
    
    // Handle price_list reference
    if (price_list) {
      const priceListDoc = await PriceList.findById(price_list);
      if (!priceListDoc) {
        return res.status(404).json({ error: 'PriceList not found' });
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
    if (account) mongoUpdate.account = account; // Store MongoDB ObjectId
    if (price_list) mongoUpdate.price_list = price_list; // Store MongoDB ObjectId

   
    
    // Update in MongoDB
    const updatedOpportunity = await Opportunity.findByIdAndUpdate(
      id,
      mongoUpdate,
      { new: true }
    ).populate('account', 'name')
     .populate('price_list', 'name');
    
    res.json({
      message: 'Opportunity updated successfully',
      data: updatedOpportunity
    });
    
  } catch (error) {
    console.error('Error updating opportunity:', error);
    
    if (error.name && error.name.includes('Mongo')) {
      const mongoError = handleMongoError(error);
      return res.status(mongoError.status).json({ error: mongoError.message });
    }
        
    // Handle ServiceNow errors
    const status = error.response?.status || 500;
    const message = error.response?.data?.error?.message || error.message;
    res.status(status).json({ error: message });
  }
}

module.exports = updateOpportunity;