const axios = require('axios');
const handleMongoError = require('../../../utils/handleMongoError');
const snConnection = require('../../../utils/servicenowConnection');

const Contract = require("../../../models/contract");

async function downloadContract(req, res) {
    try {
        const {id} = req.params;
        const contract = await Contract.findById(id);
        
        if (!contract) {
            return res.status(404).json({ error: 'Contract not found' });
        }
        
        if (!contract.download_url) {
            return res.status(400).json({ error: 'Download URL not available' });
        }

        // Get your ServiceNow connection details
        const connection = snConnection.getConnection(req.user.sn_access_token);
        
        // Make the download request with authentication
        const response = await axios.get(
            contract.download_url,
            {
                headers: connection.headers,
                responseType: 'arraybuffer' // Important for binary data
            }
        );
        
        // Set appropriate headers for the download
        res.setHeader('Content-Disposition', `attachment; filename="${contract.file_name}"`);
        res.setHeader('Content-Type', response.headers['content-type']);
        res.status(200).send(Buffer.from(response.data, 'binary'));
        
    } catch (error) {
        console.error('Error downloading contract:', error);
        
        if (error.name && error.name.includes('Mongo')) {
            const mongoError = handleMongoError(error);
            return res.status(mongoError.status).json({ error: mongoError.message });
        }
            
        // Handle ServiceNow errors
        const status = error.response?.status || 500;
        const message = error.response?.data?.error?.message || error.message;
        res.status(status).json({ error: message });
    }
}

module.exports = downloadContract;