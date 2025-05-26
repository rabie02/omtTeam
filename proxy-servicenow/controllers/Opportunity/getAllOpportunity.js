const Opportunity = require('../../models/Opportunity');
const handleMongoError = require('../../utils/handleMongoError');

module.exports = async (req, res) => {
  try {
    const { 
      q: searchQuery, 
      number: numberQuery, 
      description: descQuery,
      page = 1, 
      limit = 10 
    } = req.query;
    
    let query = {};
    
    // Build search query
    if (searchQuery) {
      const searchTerm = searchQuery.toLowerCase();
      query.$or = [
        { short_description: { $regex: searchTerm, $options: 'i' } },
        { number: { $regex: searchTerm, $options: 'i' } }
      ];
    } else {
      // Field-specific searches if no general search query
      if (numberQuery) query.number = { $regex: numberQuery, $options: 'i' };
      if (descQuery) query.short_description = { $regex: descQuery, $options: 'i' };
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const totalCount = await Opportunity.countDocuments(query);

    // Fetch data with pagination
    const mongoData = await Opportunity.find(query)
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    // Format response
    const formattedData = mongoData.map(item => ({
      ...item,
      _id: item._id.toString(),
      mongoId: item._id.toString()
    }));

    return res.json({
      success: true,
      formattedData,
      pagination: {
        total: totalCount,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(totalCount / limit)
      }
    });
    
  } catch (error) {
    console.error('Error fetching opportunities:', error);
    const mongoError = handleMongoError(error);
    return res.status(mongoError.status).json({ 
      success: false,
      error: mongoError.message 
    });
  }
};