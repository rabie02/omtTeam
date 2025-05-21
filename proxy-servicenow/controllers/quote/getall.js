const Quote = require('../../models/Quote');

module.exports = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 6;
    const skip = (page - 1) * limit;
    const searchQuery = req.query.q;

    let query = {};
    if (searchQuery) {
      const searchTerm = searchQuery.toLowerCase();
      query = {
        $or: [
          { account: { $regex: `.*${searchQuery}.*`, $options: 'i' } },
          { assigned_to: { $regex: `.*${searchQuery}.*`, $options: 'i' } },
          { short_description: { $regex: `.*${searchQuery}.*`, $options: 'i' } },
          { version: { $regex: `.*${searchQuery}.*`, $options: 'i' } }
        ]
      };
    }

    const [data, total] = await Promise.all([
      Quote.find(query).skip(skip).limit(limit),
      Quote.countDocuments(query)
    ]);

    // Explicitly send as JSON
    res.json({
      data,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    });
  } catch (err) {
    // Send error as JSON format
    res.status(500).json({
      error: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
};