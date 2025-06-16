const Quote = require('../../models/quote');

module.exports = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 6;
    const skip = (page - 1) * limit;
    const searchQuery = req.query.q;

    // Build aggregation pipeline
    const pipeline = [
      // Initial population of references
      {
        $lookup: {
          from: 'opportunities',
          localField: 'opportunity',
          foreignField: '_id',
          as: 'opportunity'
        }
      },
      { $unwind: '$opportunity' },
      // ➕ NEW: Contracts lookup (add this stage)
      {
        $lookup: {
          from: 'contracts',
          localField: '_id',
          foreignField: 'quote',
          as: 'contracts'
        }
      },
      // Account lookup with nested contacts/locations
      {
        $lookup: {
          from: 'accounts',
          localField: 'account',
          foreignField: '_id',
          as: 'account',
          pipeline: [
            {
              $lookup: {
                from: 'contacts',
                localField: '_id',
                foreignField: 'account',
                as: 'contacts',
              }
            },
            {
              $lookup: {
                from: 'locations',
                localField: '_id',
                foreignField: 'account',
                as: 'locations'
              }
            },
          ]
        }
      },
      { $unwind: { path: '$account', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'price_lists', // Fixed collection name
          localField: 'price_list',
          foreignField: '_id',
          as: 'price_list'
        }
      },
      { $unwind: { path: '$price_list', preserveNullAndEmptyArrays: true } },

      // Add quote lines with their population
      {
        $lookup: {
          from: 'quotelines',
          let: { quoteId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ['$quote', '$$quoteId'] }
              }
            },
            {
              $lookup: {
                from: 'productofferings',
                localField: 'product_offering',
                foreignField: '_id',
                as: 'product_offering'
              }
            },
            { $unwind: '$product_offering' },
            {
              $lookup: {
                from: 'price_lists',
                localField: 'price_list',
                foreignField: '_id',
                as: 'price_list'
              }
            },
            { $unwind: '$price_list' }
          ],
          as: 'quote_lines'
        }
      }
    ];

    // Add search functionality
    if (searchQuery) {
      const searchRegex = new RegExp(searchQuery, 'i');
      pipeline.unshift({
        $match: {
          $or: [
            { 'account.name': searchRegex },
            { 'opportunity.name': searchRegex },
            { assigned_to: searchRegex },
            { short_description: searchRegex },
            { version: searchRegex },
            { number: searchRegex }
          ]
        }
      });
    }

    // Add pagination using facet
    pipeline.push({
      $facet: {
        data: [{ $skip: skip }, { $limit: limit }],
        total: [{ $count: 'count' }]
      }
    });

    const [result] = await Quote.aggregate(pipeline);

    const data = result.data;
    const total = result.total[0]?.count || 0;

    res.json({
      data,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    });
  } catch (err) {
    res.status(500).json({
      error: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
};