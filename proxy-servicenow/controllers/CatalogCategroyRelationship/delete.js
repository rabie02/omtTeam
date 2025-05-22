const axios = require('axios');
const CatalogCategoryRelationship = require('../../models/CatalogCategoryRelationship');

module.exports = async (catalog, category, token) => {
  // Build query based on provided parameters
  const query = {};
  
  if (catalog) query.catalog = catalog._id;
  if (category) query.category = category._id;

  // Validate at least one parameter exists
  if (Object.keys(query).length === 0) {
    throw new Error('Must provide at least catalog or category');
  }

  // Find all matching relationships
  const relationships = await CatalogCategoryRelationship.find(query);

  if (relationships.length === 0) {
    return;
  }

  // Delete each relationship from both systems
  for (const relationship of relationships) {
    try {
      // Delete from ServiceNow
      await axios.delete(
        `${process.env.SERVICE_NOW_URL}/api/now/table/sn_prd_pm_catalog_category_relationship/${relationship.sys_id}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      // Delete from local database
      await CatalogCategoryRelationship.findByIdAndDelete(relationship._id);
    } catch (error) {
      console.error('Error deleting relationship:', error);
      throw new Error(`Failed to delete relationship: ${error.message}`);
    }
  }
};