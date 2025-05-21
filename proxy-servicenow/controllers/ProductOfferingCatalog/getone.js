
const ProductOfferingCatalog = require('../../models/ProductOfferingCatalog');

module.exports = async (catalogId) => {


    const result = await ProductOfferingCatalog.aggregate([
      { $match: { _id: catalogId } },
      {
        $lookup: {
          from: 'catalogcategoryrelations',
          let: { catalogId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ['$catalog', '$$catalogId'] }
              }
            },
            {
              $lookup: {
                from: 'productofferingcategories',
                localField: 'category',
                foreignField: '_id',
                as: 'categoryDetails'
              }
            },
            { $unwind: '$categoryDetails' },
            { $replaceRoot: { newRoot: '$categoryDetails' } }
          ],
          as: 'categories'
        }
      }
    ]);

    if (!result.length) {
      throw new Error('Catalog not found');
    }

    return result[0];
 
};