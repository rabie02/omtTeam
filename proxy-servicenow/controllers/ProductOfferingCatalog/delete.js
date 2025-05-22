const axios = require('axios');
const jwt = require('jsonwebtoken');
const ProductOfferingCatalog = require('../../models/ProductOfferingCatalog');
const handleMongoError = require('../../utils/handleMongoError');
const deleteCatalogCategoryRelationship = require('../CatalogCategroyRelationship/delete');


module.exports = async (req, res) => {
    try {
        const token = req.headers.authorization.split(' ')[1];
        const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
        const { id } = req.params;

        // Find the catalog by MongoDB _id to get ServiceNow sys_id
        let catalog;
        try {
            catalog = await ProductOfferingCatalog.findById(id);
        } catch (error) {
            if (error.name === 'CastError') {
                return res.status(400).json({ error: 'Invalid catalog ID format' });
            }
            throw error;
        }

        if (!catalog) {
            return res.status(404).json({ error: 'Catalog not found' });
        }

        if (!catalog.sys_id) {
            return res.status(400).json({ error: 'Catalog not synced with ServiceNow (missing sys_id)' });
        }

        try {
            await deleteCatalogCategoryRelationship(
                catalog,
                null,
                decodedToken.sn_access_token
            );
        } catch (error) {
            return res.status(500).json({
                error: 'Failed to delete catalog-category relationship',
                details: error.message
            });
        }

        const sys_id = catalog.sys_id;

        try {
            await deleteCatalogCategoryRelationship(
                catalog,
                null,
                decodedToken.sn_access_token
            );
        } catch (error) {
            return res.status(500).json({
                error: 'Failed to delete catalog-category relationship',
                details: error.message
            });
        }


        const snResponse = await axios.delete(
            `${process.env.SERVICE_NOW_URL}/api/now/table/sn_prd_pm_product_offering_catalog/${sys_id}`,
            {
                headers: { 'Authorization': `Bearer ${decodedToken.sn_access_token}` },
                params: { sysparm_suppress_auto_sys_field: true }
            }
        );

        try {
            await ProductOfferingCatalog.findByIdAndDelete(id);
        } catch (mongoError) {
            return handleMongoError(res, snResponse.data, mongoError, 'deletion');
        }



        res.status(204).end();
    } catch (error) {
        if (axios.isAxiosError(error)) {
            const status = error.response?.status || 500;
            return res.status(status).json({
                error: status === 404 ? 'Not found' : 'ServiceNow delete failed',
                details: error.response?.data || error.message
            });
        }
        res.status(500).json({ error: 'Server error', details: error.message });
    }
};