const axios = require('axios');
const CatalogCategoryRelationship = require('../../models/CatalogCategoryRelationship');
const createCatalogCategoryRelationship = require('./create');

module.exports = async (catalog, category, token) => {
    if (!catalog || !category) {
        throw new Error('Both catalog and category must be provided');
    }

    const query = {
        catalog: catalog._id,
        category: category._id
    };

    let existingRelationship = await CatalogCategoryRelationship.findOne(query);

    // If not found, create it and return early
    if (!existingRelationship) {
        return await createCatalogCategoryRelationship(catalog, category, token);
    }

    const relationshipSysId = existingRelationship.sys_id;
    if (!relationshipSysId) {
        throw new Error('Missing sys_id for the existing relationship');
    }

    const updatePayload = {
        source: catalog.name,
        target: category.name
    };

    let snResponse;
    try {
        snResponse = await axios.patch(
            `${process.env.SERVICE_NOW_URL}/api/now/table/sn_prd_pm_catalog_category_relationship/${relationshipSysId}`,
            updatePayload,
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            }
        );
    } catch (err) {
        throw new Error(`Failed to update ServiceNow: ${err.response?.data?.error?.message || err.message}`);
    }

    const updatedData = snResponse.data?.result;
    if (!updatedData) {
        throw new Error('No result returned from ServiceNow');
    }

    await CatalogCategoryRelationship.findByIdAndUpdate(
        existingRelationship._id,
        {
            $set: {
                ...updatedData,
                catalog: catalog._id,
                category: category._id
            }
        },
        { runValidators: true, new: true }
    );
};
