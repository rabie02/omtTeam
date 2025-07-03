const Quote = require('../../models/quote');
const mongoose= require('mongoose')

module.exports = async (req, res) => {
  try {
    const quoteId = req.params.id; // Assuming the ID comes from URL params like /quotes/:id

    // Build aggregation pipeline for a single quote
    const pipeline = [
      { $match: { _id: new mongoose.Types.ObjectId(quoteId) } }, // Match by ID first for efficiency
      
      // Opportunity lookup with null preservation
      {
        $lookup: {
          from: 'opportunities',
          localField: 'opportunity',
          foreignField: '_id',
          as: 'opportunity'
        }
      },
      { $unwind: { path: '$opportunity', preserveNullAndEmptyArrays: true } },
      
      // Contracts lookup
      {
        $lookup: {
          from: 'contracts',
          localField: '_id',
          foreignField: 'quote',
          as: 'contracts'
        }
      },
      
      // Account lookup with nested population
      {
        $lookup: {
          from: 'accounts',
          localField: 'account',
          foreignField: '_id',
          as: 'account',
          pipeline: [
            { $lookup: {
                from: 'contacts',
                localField: '_id',
                foreignField: 'account',
                as: 'contacts',
              } 
            },
            { $lookup: {
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
      
      // Price list lookup
      {
        $lookup: {
          from: 'price_lists',
          localField: 'price_list',
          foreignField: '_id',
          as: 'price_list'
        }
      },
      { $unwind: { path: '$price_list', preserveNullAndEmptyArrays: true } },
      
      // Quote lines lookup with product offerings
      {
        $lookup: {
          from: 'quotelines',
          let: { quoteId: '$_id' },
          pipeline: [
            { $match: { $expr: { $eq: ['$quote', '$$quoteId'] } } },
            { $lookup: {
                from: 'productofferings',
                localField: 'product_offering',
                foreignField: '_id',
                as: 'product_offering'
              }
            },
            { $unwind: { path: '$product_offering', preserveNullAndEmptyArrays: true } },
            { $lookup: {
                from: 'price_lists',
                localField: 'price_list',
                foreignField: '_id',
                as: 'price_list'
              }
            },
            { $unwind: { path: '$price_list', preserveNullAndEmptyArrays: true } }
          ],
          as: 'quote_lines'
        }
      }
    ];

    const result = await Quote.aggregate(pipeline);
    
    if (result.length === 0) {
      return res.status(404).json({ error: 'Quote not found' });
    }

    res.json(result[0]); // Return the first (and only) result
  } catch (err) {
    res.status(500).json({
      error: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
};