const config = require('../../utils/configCreateAccount');
const axios = require('axios');
const Account = require('../../models/account');
const handleMongoError = require('../../utils/handleMongoError');

module.exports = async (req, res) => {
  try {
    const mongoId = req.params.id;
    const account = await Account.findById(mongoId);
    
    if (!account) {
      return res.status(404).json({ error: 'Account not found in MongoDB' });
    }
    
    const servicenowId = account.sys_id;
    
    // Prepare update data for ServiceNow
    const snUpdateData = {
      ...req.body,
      external_id: mongoId.toString() // Add MongoDB ID to external_id
    };
    
    // Update in ServiceNow using basic auth
    const snResponse = await axios.patch(
      `${config.serviceNow.url}/api/now/table/customer_account/${servicenowId}`,
      snUpdateData,
      {
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        auth: {
          username: config.serviceNow.user,
          password: config.serviceNow.password
        }
      }
    );
    
    // Update in MongoDB
    const updatedAccount = await Account.findByIdAndUpdate(
      mongoId,
      req.body,
      { new: true }
    );
    
    res.json({
      message: 'Account updated successfully in both systems',
      servicenow: snResponse.data.result,
      mongodb: updatedAccount
    });
    
  } catch (error) {
    console.error('Error updating account:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({ 
        error: 'Invalid MongoDB ID format',
        mongoId: req.params.id
      });
    }
    
    if (error.name?.includes('Mongo')) {
      const mongoError = handleMongoError(error);
      return res.status(mongoError.status).json({ error: mongoError.message });
    }
    
    const status = error.response?.status || 500;
    const message = error.response?.data?.error?.message || error.message;
    res.status(status).json({ error: message });
  }
};