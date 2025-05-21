const ProductOfferingCatalog = require('../../models/ProductOfferingCatalog');
const CatalogCategoryRelation = require('../../models/CatalogCategoryRelationship');

module.exports = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 6;
    const skip = (page - 1) * limit;
    const searchQuery = req.query.q;

    // Build search query
    let matchStage = {};
    if (searchQuery) {
      const searchTerm = searchQuery.toLowerCase();
      matchStage = {
        $or: [
          { name: { $regex: searchTerm, $options: 'i' } },
          { status: { $regex: searchTerm, $options: 'i' } }
        ]
      };
    }

    const aggregationPipeline = [
      { $match: matchStage },
      {
        $lookup: {
          from: 'catalogcategoryrelations', // Collection name for relations
          let: { catalogId: '$_id' },
          pipeline: [
            { 
              $match: { 
                $expr: { $eq: ['$catalog', '$$catalogId'] }
              }
            },
            {
              $lookup: {
                from: 'productofferingcategories', // Collection name for categories
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
      },
      { $skip: skip },
      { $limit: limit }
    ];

    const [data, total] = await Promise.all([
      ProductOfferingCatalog.aggregate(aggregationPipeline),
      ProductOfferingCatalog.countDocuments(matchStage)
    ]);

    res.send({ 
      data, 
      total, 
      page, 
      totalPages: Math.ceil(total / limit) 
    });
  } catch (err) {
    res.status(500).send(err);
  }
};