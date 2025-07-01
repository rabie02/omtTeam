const mongoose = require('mongoose');
const ProductOfferingCatalog = require('../../models/ProductOfferingCatalog');
const CatalogCategoryRelation = require('../../models/CatalogCategoryRelationship');

module.exports = async (req, res) => {
  try {
    const catalogId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(catalogId)) {
      return res.status(400).json({ error: 'Invalid catalog ID' });
    }

    const [catalog, categoryRelations] = await Promise.all([
      ProductOfferingCatalog.findById(catalogId),
      CatalogCategoryRelation.find({ catalog: catalogId }).populate('category')
    ]);

    if (!catalog) {
      return res.status(404).json({ error: 'Catalog not found' });
    }

    const categories = categoryRelations.map(rel => rel.category);

    res.status(200).json({
      ...catalog.toObject(),
      categories
    });

  } catch (error) {
    console.error('Error fetching catalog:', error);
    res.status(500).json({ error: 'Server error' });
  }
};
