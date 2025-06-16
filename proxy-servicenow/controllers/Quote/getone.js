const mongoose = require('mongoose');
const Quote = require('../../models/quote');

module.exports = async (quoteId) => {

  
  const pipeline = [
    { $match: { _id: quoteId } },
    {
      $lookup: {
        from: 'opportunities',
        localField: 'opportunity',
        foreignField: '_id',
        as: 'opportunity'
      }
    },
    { $unwind: '$opportunity' },
    {
      $lookup: {
        from: 'contracts',
        localField: '_id',
        foreignField: 'quote',
        as: 'contracts'
      }
    },
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
              as: 'contacts'
            }
          },
          {
            $lookup: {
              from: 'locations',
              localField: '_id',
              foreignField: 'account',
              as: 'locations'
            }
          }
        ]
      }
    },
    { $unwind: { path: '$account', preserveNullAndEmptyArrays: true } },
    {
      $lookup: {
        from: 'price_lists',
        localField: 'price_list',
        foreignField: '_id',
        as: 'price_list'
      }
    },
    { $unwind: { path: '$price_list', preserveNullAndEmptyArrays: true } },
    {
      $lookup: {
        from: 'quotelines',
        let: { quoteId: '$_id' },
        pipeline: [
          { $match: { $expr: { $eq: ['$quote', '$$quoteId'] } } },
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

  const result = await Quote.aggregate(pipeline);
  

  if (!result.length) {
    throw new Error('Quote not found');
  }

  return result[0];
};