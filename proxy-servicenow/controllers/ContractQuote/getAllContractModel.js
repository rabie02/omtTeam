const contract_model = require("../../models/contract_model");

module.exports = async (req, res) => {
    try {
      
      // First try to get data from MongoDB
      const mongoData = await contract_model.find().lean();
  
      // If we have data in MongoDB, return it
      if (mongoData.length > 0) {
        // Transform the MongoDB data to include string IDs
        const formattedData = mongoData.map(item => ({
          ...item,
          _id: item._id.toString(),
          mongoId: item._id.toString() // Additional field for clarity
        }));
  
        return res.json(formattedData);
      }
  
      // If no data in MongoDB, fetch from ServiceNow
      console.log('No data found in MongoDB. ');
  
      // If nothing found in either database, return empty array
      return res.json([]);
  
    } catch (error) {
      console.error('Error fetching price Lists:', error);
      const mongoError = handleMongoError(error);
      return res.status(mongoError.status).json({ error: mongoError.message });
    }
  };