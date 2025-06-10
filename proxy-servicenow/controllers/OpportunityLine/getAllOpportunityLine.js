const axios = require('axios');
const opportunityLine = require('../../models/opportunityLine');
const snConnection = require('../../utils/servicenowConnection');
const handleMongoError = require('../../utils/handleMongoError');

module.exports = async (req, res) => {
  try {
    const opportunity_lines = await opportunityLine.find({})
    if (opportunity_lines.length > 0) {
      return res.json({
        source: "mongodb",
        total: opportunity_lines.length,
        result: opportunity_lines,
        

      });
    }

    console.log('No opportunities line found in MongoDB ...');
    res.json(snResponse.data.result);
    
  } catch (error) {
    console.error('Error fetching opportunities:', error);
    // Handle MongoDB errors
    if (error.name && error.name.includes('Mongo')) {
      const mongoError = handleMongoError(error);
      return res.status(mongoError.status).json({ error: mongoError.message });
    }
    const status = error.response?.status || 500;
    const message = error.response?.data?.error?.message || error.message;
    res.status(status).json({ error: message });
  }
};