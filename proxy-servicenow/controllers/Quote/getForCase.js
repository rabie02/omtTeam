const Quote = require('../../models/quote');
const dayjs = require('dayjs'); // Make sure to install if not already: npm install dayjs

module.exports = async (req, res) => {
  try {
    const pipeline = [
      {
        $lookup: {
          from: 'opportunities',
          localField: 'opportunity',
          foreignField: '_id',
          as: 'opportunity'
        }
      },
      { $unwind: { path: '$opportunity', preserveNullAndEmptyArrays: true } },

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
            { $unwind: { path: '$product_offering', preserveNullAndEmptyArrays: true } },
            {
              $lookup: {
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

    const quotes = await Quote.aggregate(pipeline);

    // Flatten and transform all quote lines
    const transformed = quotes.flatMap((quote) => {
      const orderId = quote.sys_id;
      const locationId = quote.account?.locations?.[0]?.sys_id || null;
      const contactId = quote.account?.contacts?.find(c => c.isPrimaryContact)?.sys_id || quote.account?.contacts?.[0]?.sys_id || null;
      const accountId = quote.account?.sys_id || null;
      const currency = quote.currency || 'USD';

      // const now = dayjs();
      // const term = quote.opportunity?.term_month || 12;
      // const startDate = now.toISOString();
      // const endDate = now.add(term, 'month').toISOString();

      return quote.quote_lines.map((line) => ({
        orderId,
        locationId,
        productOfferingId: line.product_offering?.sys_id || null,
        productSpecificationId: line.product_offering?.productSpecification || null,
        quantity: Number(line.quantity) || 1,
        currencyIsoCode: currency,
        action: line.action || 'add',
        account: accountId,
        contact: contactId,
        startDate: quote.subscription_start_date,
        endDate: quote.subscription_end_date,
        characteristics: line.product_offering?.prodSpecCharValueUse || []
      }));
    });

    res.json(transformed);
  } catch (err) {
    res.status(500).json({
      error: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
};
