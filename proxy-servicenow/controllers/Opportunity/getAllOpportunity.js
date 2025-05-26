const Opportunity = require('../../models/Opportunity');
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
    
    
    return res.json([]);
    
  } catch (error) {
    console.error('Error fetching opportunities:', error);
    const mongoError = handleMongoError(error);
    return res.status(mongoError.status).json({ error: mongoError.message });
  }
};