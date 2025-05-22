const axios = require('axios');
const jwt = require('jsonwebtoken');
const ProductOfferingCategory = require('../../models/ProductOfferingCategory');
const handleMongoError = require('../../utils/handleMongoError');
const getone = require('./getone');

module.exports = async (req, res) => {
    try {
        // Authorization handling
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Invalid authorization format' });
        }
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        if (!decoded.sn_access_token) {
            return res.status(401).json({ error: 'Missing ServiceNow access token in JWT' });
        }

        const { id } = req.params;

        // Validate request body fields
        const allowedFields = ['status'];
        const receivedFields = Object.keys(req.body);
        const invalidFields = receivedFields.filter(field => !allowedFields.includes(field));
        if (invalidFields.length > 0) {
            return res.status(400).json({ error: `Invalid fields provided: ${invalidFields.join(', ')}` });
        }

        // Category validation
        let category;
        try {
            category = await ProductOfferingCategory.findById(id);
        } catch (error) {
            if (error.name === 'CastError') {
                return res.status(400).json({ error: 'Invalid category ID format' });
            }
            throw error;
        }

        if (!category) {
            return res.status(404).json({ error: 'Category not found' });
        }

        if (!category.sys_id) {
            return res.status(400).json({ error: 'Category not synced with ServiceNow (missing sys_id)' });
        }

        // Prepare update body
        const updateBody = {
            sys_id: category.sys_id,
            status: req.body.status
        };

        // ServiceNow update
        const snResponse = await axios.patch(
            `${process.env.SERVICE_NOW_URL}/api/sn_prd_pm/product_offering_api/poc_pub`,
            updateBody,
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${decoded.sn_access_token}`
                }
            }
        );

        // MongoDB update
        const updateData = { status: snResponse.data.result.status.toLowerCase() };
        let mongoDoc;
        try {
            mongoDoc = await ProductOfferingCategory.findByIdAndUpdate(
                id,
                { $set: updateData },
                { new: true, runValidators: true }
            );
        } catch (mongoError) {
            return handleMongoError(res, snResponse.data, mongoError, 'update');
        }

        // Final response
        const result = await getone(mongoDoc._id);
        res.status(201).json({
            result
        });

    } catch (error) {
        console.error('Error updating product offering category state:', error);

        if (axios.isAxiosError(error)) {
            const status = error.response?.status || 500;
            const errorData = error.response?.data || {};
            const message = errorData.error?.message || errorData.message || 'ServiceNow update failed';
            const details = errorData.error?.details || error.message;
            return res.status(status).json({
                error: message,
                details: details
            });
        }

        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ error: 'Invalid token' });
        }

        res.status(500).json({
            error: 'Internal server error',
            details: error.message
        });
    }
};