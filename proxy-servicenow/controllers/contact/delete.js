const Contact = require('../../models/Contact');
const axios = require('axios');
const snConnection = require('../../utils/servicenowConnection');
const handleMongoError = require('../../utils/handleMongoError');

module.exports = async (req, res) => {
    try {
      const mongoId = req.params.id; // MongoDB _id
      
      // First, find the contact in MongoDB to get the ServiceNow sys_id
      const contact = await Contact.findById(mongoId);
      
      if (!contact) {
        return res.status(404).json({ error: 'contact not found in MongoDB' });
      }
      
      const servicenowId = contact.sys_id;
      
      console.log(`Deleting contact - MongoDB ID: ${mongoId}, ServiceNow ID: ${servicenowId}`);
      
      // Step 1: Delete from MongoDB first
      await contact.findByIdAndDelete(mongoId);
      console.log(`contact deleted from MongoDB: ${mongoId}`);
      
      // Step 2: Delete from ServiceNow if sys_id exists
      if (servicenowId) {
        try {
          const connection = snConnection.getConnection(req.user.sn_access_token);
          const snResponse = await axios.delete(
            `${connection.baseURL}/api/now/table/customer_contact/${servicenowId}`, // Adjust table name as needed
            { headers: connection.headers }
          );
          console.log(`contact deleted from ServiceNow: ${servicenowId}`);
          
          res.json({
            message: 'contact successfully deleted from both MongoDB and ServiceNow',
            mongoId: mongoId,
            servicenowId: servicenowId,
            servicenowResponse: snResponse.data
          });
        } catch (snError) {
          // MongoDB deletion succeeded but ServiceNow failed
          console.error('ServiceNow deletion failed:', snError);
          res.status(207).json({ // 207 Multi-Status
            message: 'contact deleted from MongoDB but ServiceNow deletion failed',
            mongoId: mongoId,
            servicenowId: servicenowId,
            error: snError.response?.data?.error?.message || snError.message
          });
        }
      } else {
        // No ServiceNow ID, only MongoDB deletion
        res.json({
          message: 'contact successfully deleted from MongoDB (no ServiceNow ID found)',
          mongoId: mongoId
        });
      }
      
    } catch (error) {
      console.error('Error deleting contact:', error);
      
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