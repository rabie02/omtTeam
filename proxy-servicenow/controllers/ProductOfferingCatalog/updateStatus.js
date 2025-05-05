const axios = require('axios');
const jwt = require('jsonwebtoken');
const ProductOfferingCatalog = require('../../models/ProductOfferingCatalog');
const handleMongoError = require('../../utils/handleMongoError');

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

        // Catalog validation
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

        // Prepare update body
        let updateBody = {};
        allowedFields.forEach(field => {
            if (req.body[field] !== undefined) {
                updateBody[field] = req.body[field] === "" ? null : req.body[field];
            }
        });

         updateBody = {sys_id: catalog.sys_id, ...updateBody };


        // ServiceNow update
        const snResponse = await axios.patch(
            `${process.env.SERVICE_NOW_URL}/api/1638988/update_status/poc_pub`,
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
        let updatedCatalog;
        try {
            updatedCatalog = await ProductOfferingCatalog.findByIdAndUpdate(
                id,
                { $set: updateData },
                { new: true, runValidators: true }
            );
        } catch (mongoError) {
           return handleMongoError(res, snResponse.data, mongoError, 'update');
        }

        // Final response
        res.json({ _id : id,...snResponse.data.result});

    } catch (error) {
        console.error('Error updating product offering state:', error);
        
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

        if (error.message === 'Invalid response structure from ServiceNow') {
            return res.status(500).json({ 
                error: 'ServiceNow returned an invalid response format',
                details: error.message
            });
        }

        res.status(500).json({ 
            error: 'Internal server error',
            details: error.message
        });
    }
};