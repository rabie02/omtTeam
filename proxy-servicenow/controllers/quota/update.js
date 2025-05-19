const axios = require('axios');
const Quote = require('../../models/Quote');
const handleMongoError = require('../../utils/handleMongoError');

module.exports = async (req, res) => {

    try {

        const data = req.body;
        const id = data.sys_id;

        try {
            await Quote.findByIdAndUpdate(
                { sys_id: id }, 
                { $set: data },
                { upsert: true}
            );
        } catch (mongoError) {
            return handleMongoError(res, data, mongoError, 'update');
        }

        res.status(200).json({  message: "Quote updated successfully"});
    } catch (error) {
        if (axios.isAxiosError(error)) {
            const status = error.response?.status || 500;
            return res.status(status).json({
                error: status === 404 ? 'Not found' : 'ServiceNow update failed',
                details: error.response?.data || error.message
            });
        }
        res.status(500).json({ error: 'Server error', details: error.message });
    }
};