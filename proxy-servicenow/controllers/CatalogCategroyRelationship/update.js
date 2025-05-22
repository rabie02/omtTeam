const axios = require('axios');
const CatalogCategoryRelationship = require('../../models/CatalogCategoryRelationship');

module.exports = async (catalog, category, token) => {
    
    const existingRelationship = await CatalogCategoryRelationship.findOne({
        catalog: catalog._id,
        category: category._id
    });

    if (!existingRelationship) {
        throw new Error('Catalog-Category relationship not found in database');
    }

    
    const relationshipSysId = existingRelationship.sys_id;

  
    const updatePayload = {
        source: catalog.name,
        target: category.name
    };

    // Update ServiceNow relationship record
    const snResponse = await axios.patch(
        `${process.env.SERVICE_NOW_URL}/api/now/table/sn_prd_pm_catalog_category_relationship/${relationshipSysId}`,
        updatePayload,
        {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        }
    );

   
    await CatalogCategoryRelationship.findByIdAndUpdate(
        existingRelationship._id,  
        {
            $set: {
                ...snResponse.data.result,  
                catalog: catalog._id,       
                category: category._id      
            }
        },
        { runValidators: true, new: true }
    );
};