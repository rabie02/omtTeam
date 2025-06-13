const Location = require('../../models/location');
const handleMongoError = require('../../utils/handleMongoError');

module.exports = async (req, res) => {
  try {
    // First, try to get location from MongoDB with populated locations and locations
    const location = await Location.find({}).lean(); 

    // If location exist in MongoDB, return them with populated data
    if (location && location.length > 0) {
      return res.json({
        result: location,
        total: location.length,
        source: 'mongodb'
      });
    }

    // If no location in MongoDB, fetch from ServiceNow
    console.log('No location found in MongoDB');
    return res.json([]);

  } catch (error) {
    console.error('Error fetching location:', error);
    // Handle MongoDB errors
    const mongoError = handleMongoError(error);
    return res.status(mongoError.status).json({ error: mongoError.message });


  }
};