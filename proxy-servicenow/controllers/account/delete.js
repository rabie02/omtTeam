const axios = require('axios');
const snConnection = require('../../utils/servicenowConnection');
const handleMongoError = require('../../utils/handleMongoError');
const Account = require('../../models/account');
const Contact = require('../../models/Contact');  // Add this import
const Location = require('../../models/location');  // Add this import
const config = require('../../utils/configCreateAccount');

module.exports = async (req, res) => {
  try {
    const mongoId = req.params.id;
    const account = await Account.findById(mongoId);

    if (!account) {
      return res.status(404).json({ error: 'Account not found in MongoDB' });
    }

    // Create axios instance for internal API calls
    const apiClient = axios.create({
      baseURL: config.app.backendUrl,
      headers: {
        'Authorization': req.headers.authorization,
        'Content-Type': 'application/json'
      }
    });

    // Step 1: Delete all contacts associated with this account
    const contacts = await Contact.find({ account: mongoId });
    for (const contact of contacts) {
      try {
        await apiClient.delete(`/api/contact/${contact._id}`);
        console.log(`Deleted contact ${contact._id}`);
      } catch (error) {
        console.error(`Failed to delete contact ${contact._id}:`, error.message);
      }
    }

    // Step 2: Delete all locations associated with this account
    const locations = await Location.find({ account: mongoId });
    for (const location of locations) {
      try {
        await apiClient.delete(`/api/location/${location._id}`);
        console.log(`Deleted location ${location._id}`);
      } catch (error) {
        console.error(`Failed to delete location ${location._id}:`, error.message);
      }
    }

    // Step 3: Delete the account from MongoDB
    await Account.findByIdAndDelete(mongoId);
    console.log(`Deleted account from MongoDB: ${mongoId}`);

    // Step 4: Delete the account from ServiceNow if sys_id exists
    if (account.sys_id) {
      try {
        const connection = snConnection.getConnection(req.user.sn_access_token);
        await axios.delete(
          `${connection.baseURL}/api/now/table/customer_account/${account.sys_id}`,
          { headers: connection.headers }
        );
        console.log(`Deleted account from ServiceNow: ${account.sys_id}`);
      } catch (error) {
        console.error('Failed to delete from ServiceNow:', error.message);
      }
    }

    res.json({
      message: 'Account and associated resources deletion completed',
      accountId: mongoId,
      deletedContacts: contacts.length,
      deletedLocations: locations.length,
      serviceNowDeleted: !!account.sys_id
    });

  } catch (error) {
    console.error('Account deletion failed:', error);
    
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
    return res.status(status).json({ error: message });
  }
};