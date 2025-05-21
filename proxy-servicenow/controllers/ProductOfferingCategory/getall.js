const express = require('express');
const ProductOfferingCategory = require('../../models/ProductOfferingCategory');
const CatalogCategoryRelation = require('../../models/CatalogCategoryRelationship');

const router = express.Router();

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
      },
      { $skip: skip },
      { $limit: limit }
    ];

    const [data, total] = await Promise.all([
      ProductOfferingCategory.aggregate(aggregationPipeline),
      ProductOfferingCategory.countDocuments(matchStage)
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