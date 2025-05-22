const axios = require('axios');
const CatalogCategoryRelationship = require('../../models/CatalogCategoryRelationship');

module.exports = async (catalog, category, token) => {
  const query = {};

  if (catalog) query.catalog = catalog._id;
  if (category) query.category = category._id;

  if (Object.keys(query).length === 0) {
    throw new Error('Must provide at least catalog or category');
  }

  const relationships = await CatalogCategoryRelationship.find(query);

  if (relationships.length === 0) {
    return;
  }

  for (const relationship of relationships) {
    try {
      // Delete from ServiceNow first
      try {
        await axios.delete(
          `${process.env.SERVICE_NOW_URL}/api/now/table/sn_prd_pm_catalog_category_relationship/${relationship.sys_id}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          }
        );
      } catch (snowError) {
        // Handle 404 as non-fatal error (already deleted)
        if (snowError.response?.status === 404) {
          throw new Error(`ServiceNow relationship ${relationship.sys_id} not found, proceeding with local deletion`);
        } else {
          throw new Error(`ServiceNow deletion failed: ${snowError.message}`);
        }
      }

      // Delete from MongoDB
      try {
        await CatalogCategoryRelationship.findByIdAndDelete(relationship._id);
      } catch (mongoError) {
        throw new Error(`MongoDB deletion failed: ${mongoError.message}`);
      }
    } catch (error) {
      console.error(`Failed to process relationship ${relationship._id}:`, error.message);
      throw error;
    }
  }
};