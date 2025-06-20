const axios = require('axios');
const snConnection = require('../../utils/servicenowConnection');
const contract_quote = require("../../models/contract_quote");
const ContractModel = require('../../models/contract_model');
const Quote = require('../../models/quote');
const ProductOffering = require('../../models/ProductOffering');
const mongoose = require('mongoose');

async function createContractQuote(req, res = null) {

    try {
        const newId = new mongoose.Types.ObjectId();


        // Validate request body
        const { quote, contract_model, ...rest } = req.body;

        // Step 1: Get sys_ids from MongoDB documents using their _id (if provided)
        let contractDoc = null;
        let contractModelSys = null;

        // Get quote sys_id 
        const quoteDoc = await Quote.findById(quote)
            .populate({
                path: 'quote_lines',
                populate: { path: 'product_offering' }
            })
            .lean();

        //get contract sys 
        if (contract_model) {
            contractDoc = await ContractModel.findById(contract_model);
            if (!contractDoc) {
                return res.status(404).json({ error: `contracct not found with id: ${contract_model}` });
            }
            contractModelSys = contractDoc.sys_id;
        }

        //get product off sysid
        let productOfferingSysIds =[];
        quoteDoc.quote_lines.forEach(line => {
            if (line.product_offering?.sys_id) {
                productOfferingSysIds.push(line.product_offering.sys_id);
            }
        });

        // Call ServiceNow API to create contract
        const contractData = {
            ...rest,
            "external_id": newId,
            "quote": quoteDoc.sys_id ||'',
            "start_date":  quoteDoc.subscription_start_date || '',
            "end_date": quoteDoc.subscription_end_date || '',
            "contract_model": contractModelSys,
            "product_offerings": productOfferingSysIds.join(',') || '',// Join as comma-separated string
            "description": req.body.description || '',
            "name": req.body.name || '',
        };
        

        // Create in ServiceNow
        const connection = snConnection.getConnection(req.user.sn_access_token);
        const snResponse = await axios.post(
            `${connection.baseURL}/api/sn_prd_pm/management_contract`,
            contractData,
            { headers: connection.headers }
        );

        //update in mongodb 
        const mongoPayload = {
            _id:newId,
            sys_id: snResponse.data.result.sys_id,
            sn_quote_sys_id: quoteDoc.sys_id,
            sn_contract_model_sys_id: contractDoc.sys_id,
            ...snResponse.data.result
        }

        try {
            const contractQ = new contract_quote(mongoPayload);
            const mongoDocument = await contractQ.save();
            console.log('MongoDB document created:', mongoDocument._id);
            const response = {
                success: true,
                servicenow: snResponse.data,
                _id: mongoDocument._id,
                mongoId: mongoDocument._id
            };
            if (res) {
                return res.status(201).json(response);
            }
            return response;
        } catch (mongoError) {
            if (res) {
                return handleMongoError(res, snResponse.data.result, mongoError, 'creation');
            }
            throw mongoError;
        }


    } catch (error) {
        if (res) {
            const status = error.response?.status || 500;
            const message = error.response?.data?.error?.message || error.message;
            return res.status(status).json({ error: message });
        }
        throw error;
    }
}
module.exports = async (req, res) => {
    return createContractQuote(req, res);
};

module.exports.createContractQuote = createContractQuote;