const axios = require('axios');
const snConnection = require('../../utils/servicenowConnection');
const handleMongoError = require('../../utils/handleMongoError');
const Account = require('../../models/account');

module.exports = async (req, res) => {
  try {
    const mongoId = req.params.id; // MongoDB _id
    
    // First, find the account in MongoDB to get the ServiceNow sys_id
    const account = await Account.findById(mongoId);
    
    if (!account) {
      return res.status(404).json({ error: 'Account not found in MongoDB' });
    }
    
    const servicenowId = account.sys_id;
    
    console.log(`Updating account - MongoDB ID: ${mongoId}, ServiceNow ID: ${servicenowId}`);
    
    // Step 1: Update in ServiceNow first
    const connection = snConnection.getConnection(req.user.sn_access_token);
    const snResponse = await axios.patch(
      `${connection.baseURL}/api/now/table/customer_account/${servicenowId}`, // Adjust table name as needed
      req.body,
      { headers: connection.headers }
    );
    
    console.log('Account updated in ServiceNow');
    
    // Step 2: Update in MongoDB with ServiceNow response
    try {
      const updatedAccount = await Account.findByIdAndUpdate(
        mongoId,
        req.body,
        { new: true}
      );
      
      console.log('Account updated in MongoDB');
      
      res.json({
        message: 'Account updated successfully in both ServiceNow and MongoDB',
        servicenow: snResponse.data.result,
        mongodb: updatedAccount,
        source: 'both'
      });
      
    } catch (mongoError) {
      console.error('MongoDB update failed:', mongoError);
      return handleMongoError(res, snResponse.data, mongoError, 'update');
    }
    
  } catch (error) {
    console.error('Error updating account:', error);
    
    // Handle invalid MongoDB ObjectId
    if (error.name === 'CastError') {
      return res.status(400).json({ 
        error: 'Invalid MongoDB ID format',
        mongoId: req.params.id
      });
    }
    
    // Handle MongoDB errors
    if (error.name && error.name.includes('Mongo')) {
      const mongoError = handleMongoError(error);
      return res.status(mongoError.status).json({ error: mongoError.message });
    }
    
    // Handle ServiceNow errors
    const status = error.response?.status || 500;
    const message = error.response?.data?.error?.message || error.message;
    res.status(status).json({ error: message });
  }
};