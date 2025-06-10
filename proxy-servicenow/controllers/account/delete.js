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
    
    console.log(`Deleting account - MongoDB ID: ${mongoId}, ServiceNow ID: ${servicenowId}`);
    
    // Step 1: Delete from MongoDB first
    await Account.findByIdAndDelete(mongoId);
    console.log(`Account deleted from MongoDB: ${mongoId}`);
    
    // Step 2: Delete from ServiceNow if sys_id exists
    if (servicenowId) {
      try {
        const connection = snConnection.getConnection(req.user.sn_access_token);
        const snResponse = await axios.delete(
          `${connection.baseURL}/api/now/table/customer_account/${servicenowId}`, 
          { headers: connection.headers }
        );
        console.log(`Account deleted from ServiceNow: ${servicenowId}`);
        
        res.json({
          message: 'Account successfully deleted from both MongoDB and ServiceNow',
          mongoId: mongoId,
          servicenowId: servicenowId,
          servicenowResponse: snResponse.data
        });
      } catch (snError) {
        // MongoDB deletion succeeded but ServiceNow failed
        console.error('ServiceNow deletion failed:', snError);
        res.status(207).json({ // 207 Multi-Status
          message: 'Account deleted from MongoDB but ServiceNow deletion failed',
          mongoId: mongoId,
          servicenowId: servicenowId,
          error: snError.response?.data?.error?.message || snError.message
        });
      }
    } else {
      // No ServiceNow ID, only MongoDB deletion
      res.json({
        message: 'Account successfully deleted from MongoDB (no ServiceNow ID found)',
        mongoId: mongoId
      });
    }
    
  } catch (error) {
    console.error('Error deleting account:', error);
    
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
    
    // Handle other errors
    const status = error.response?.status || 500;
    const message = error.response?.data?.error?.message || error.message;
    res.status(status).json({ error: message });
  }
};