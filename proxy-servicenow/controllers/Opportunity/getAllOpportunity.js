const axios = require('axios');
const Opportunity = require('../../models/Opportunity');
const snConnection = require('../../utils/servicenowConnection');
const handleMongoError = require('../../utils/handleMongoError');

module.exports = async (req, res) => {
  try {
    // First try to get data from MongoDB
    const mongoData = await Opportunity.find({}).lean();
    
    // If we have data in MongoDB, return it
    if (mongoData && mongoData.length > 0) {
      // Transform the MongoDB data to include string IDs
      const formattedData = mongoData.map(item => ({
        ...item,
        _id: item._id.toString(),
        mongoId: item._id.toString() // Additional field for clarity
      }));
      
      return res.json(formattedData);
    }
    
    // If no data in MongoDB, fetch from ServiceNow
    console.log('No opportunities found in MongoDB, fetching from ServiceNow');
    
    // Use the user's authentication token
    const connection = snConnection.getConnection(req.user.sn_access_token);
    
    // Get data from ServiceNow
    const snResponse = await axios.get(
      `${connection.baseURL}/api/now/table/sn_opty_mgmt_core_opportunity`,
      { headers: connection.headers }
    );
    
    // If we got data from ServiceNow, save it to MongoDB for future use
    const serviceNowData = snResponse.data.result;
    if (serviceNowData && serviceNowData.length > 0) {
      // Save each item to MongoDB
      const savePromises = serviceNowData.map(async (item) => {
        try {
          const opportunity = new Opportunity({
            sys_id: item.sys_id,
            ...item
          });
          const savedDoc = await opportunity.save();
          // Add MongoDB ID to the response
          item._id = savedDoc._id.toString();
          item.mongoId = savedDoc._id.toString();
          return item;
        } catch (error) {
          console.error(`Error saving opportunity ${item.sys_id} to MongoDB:`, error);
          return item; // Return original item if save fails
        }
      });
      
      // Wait for all saves to complete
      const savedData = await Promise.all(savePromises);
      return res.json(savedData);
    }
    
    // If nothing found in either database, return empty array
    return res.json([]);
    
  } catch (error) {
    console.error('Error fetching opportunities:', error);
    const status = error.response?.status || 500;
    const message = error.response?.data?.error?.message || error.message;
    res.status(status).json({ error: message });
  }
};