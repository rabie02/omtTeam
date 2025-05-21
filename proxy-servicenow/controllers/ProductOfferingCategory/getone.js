const ProductOfferingCategory = require('../../models/ProductOfferingCategory');

// GET BY ID
module.exports = async (categoryId) => {
 
    const result = await ProductOfferingCategory.aggregate([
      { $match: { _id:categoryId } },
      {
        $lookup: {
          from: 'catalogcategoryrelations',
          let: { categoryId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ['$category', '$$categoryId'] }
              }
            },
            {
              $lookup: {
                from: 'productofferingcatalogs',
                localField: 'catalog',
                foreignField: '_id',
                as: 'catalogDetails'
              }
            },
            { $unwind: '$catalogDetails' },
            { $replaceRoot: { newRoot: '$catalogDetails' } }
          ],
          as: 'catalogs'
        }
      }
    ]);

  
     return result[0]
    
 
};
