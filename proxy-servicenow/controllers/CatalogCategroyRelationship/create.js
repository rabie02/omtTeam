const axios = require('axios');
const CatalogCategoryRelationship = require('../../models/CatalogCategoryRelationship');

module.exports = async (catalog, category, token) => {
  if (!catalog || !category || !token) {
    throw new Error('Missing required parameters: catalog, category, or token');
  }

  let snowId; // Store ServiceNow ID for potential rollback
  try {
    // 1. Create in ServiceNow
    const CCrelationship = {
      source: catalog.name,
      target: category.name
    }

    const snResponse = await axios.post(
      `${process.env.SERVICE_NOW_URL}/api/now/table/sn_prd_pm_catalog_category_relationship`,
      CCrelationship,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      }
    );

    if (!snResponse.data.result || !snResponse.data.result.sys_id) {
      throw new Error('Invalid ServiceNow response format');
    }

    snowId = snResponse.data.result.sys_id;

    // 2. Create in MongoDB
    const mongoDoc = new CatalogCategoryRelationship({
      catalog: catalog._id,
      category: category._id,
      ...snResponse.data.result
    });

    await mongoDoc.save();

    // 3. Return combined result
    return {
      serviceNow: snResponse.data.result,
      mongoDB: mongoDoc.toObject()
    };

  } catch (error) {
    console.error('Error creating catalog-category relationship:', error.message);

    // Attempt rollback if ServiceNow creation succeeded but MongoDB failed
    if (snowId) {
      try {
        await axios.delete(
          `${process.env.SERVICE_NOW_URL}/api/now/table/sn_prd_pm_catalog_category_relationship/${snowId}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          }
        );
        console.log(`Rollback deleted ServiceNow relationship: ${snowId}`);
      } catch (rollbackError) {
        console.error('Rollback failed:', rollbackError.message);
      }
    }

    throw new Error(`Failed to create relationship: ${error.message}`);
  }
};