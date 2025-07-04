const PriceList = require('../../models/priceList');

module.exports = async (req, res) => {
  try {
    
    const searchQuery = req.query.q;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    let query = {};
    if (searchQuery) {
      query.$or = [
        { name: { $regex: searchQuery, $options: 'i' } }
      ];
    }
    // First try to get data from MongoDB
    
    // Get total count of documents for pagination metadata
    const totalItems = await PriceList.countDocuments(query);
    const totalPages = Math.ceil(totalItems / limit);

    // First try to get data from MongoDB
    const mongoData = await PriceList.find(query)
      .skip(skip)
      .limit(limit)
      .lean();

    // If we have data in MongoDB, return it with pagination info
    if (mongoData.length > 0) {
      // Transform the MongoDB data to include string IDs
      const formattedData = mongoData.map(item => ({
        ...item,
        _id: item._id.toString(),
        mongoId: item._id.toString() // Additional field for clarity
      }));

      return res.json({
        data: formattedData,
          totalItems,
          totalPages,
          page: parseInt(page),
          limit: parseInt(limit),
      });
    }

    // If no data in MongoDB, fetch from ServiceNow
    console.log('No data found in MongoDB. ');

    // If nothing found in either database, return empty array
    return res.json([]);

  } catch (error) {
    console.error('Error fetching price Lists:', error);
    const mongoError = handleMongoError(error);
    return res.status(mongoError.status).json({ error: mongoError.message });
  }
};