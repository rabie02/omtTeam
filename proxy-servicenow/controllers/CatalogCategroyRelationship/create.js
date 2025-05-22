const axios = require('axios');
const CatalogCategoryRelationship = require('../../models/CatalogCategoryRelationship');

module.exports = async (catalog, category, token) => {

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
    let mongoDoc;
      mongoDoc = new CatalogCategoryRelationship({
        catalog: catalog._id,
        category: category._id,
        ...snResponse.data.result
      });
      await mongoDoc.save();



}