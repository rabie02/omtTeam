const express = require('express');
const ProductOfferingCategory = require('../../models/ProductOfferingCategory');
const CatalogCategoryRelation = require('../../models/CatalogCategoryRelationship');
const ProductSpecification = require('../../models/productSpecification');

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

      // Pagination
      { $skip: skip },
      { $limit: limit },

      // Lookup specifications
      {
        $lookup: {
          from: 'productspecifications',
          localField: '_id',
          foreignField: 'category',
          as: 'specifications'
        }
      },

      // Lookup catalog relations and expand to include catalog details
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
    console.error(err);
    res.status(500).send({ error: 'Server error' });
  }
};
