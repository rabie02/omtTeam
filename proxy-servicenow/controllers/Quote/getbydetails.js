const mongoose = require('mongoose');
const ProductOfferingCategory = require('../../models/ProductOfferingCategory');
const CatalogCategoryRelation = require('../../models/CatalogCategoryRelationship');

module.exports = async (req, res) => {
  try {
    const { id: categoryId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(categoryId)) {
      return res.status(400).json({ error: 'Invalid category ID format.' });
    }

    const category = await ProductOfferingCategory.findById(categoryId)
      .populate('productOffering')  // now works due to virtual
      .lean();

    if (!category) {
      return res.status(404).json({ error: 'Category not found.' });
    }

    const relations = await CatalogCategoryRelation.find({ category: categoryId })
      .populate('catalog')  // catalog must be defined as ref in CatalogCategoryRelation
      .lean();

    category.catalogs = relations.map(r => r.catalog).filter(Boolean);

    return res.json(category);

  } catch (error) {
    console.error('Error fetching category:', error);
    return res.status(500).json({
      error: 'Internal server error',
      details: error.message
    });
  }
};
