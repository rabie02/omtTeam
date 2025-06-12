const axios = require('axios');
const snConnection = require('../../utils/servicenowConnection');
const handleMongoError = require('../../utils/handleMongoError');
const Account = require('../../models/account');

async function createAccount(req, res=null) {
  try {
    
    const existingAccount = await Account.findOne({ 
      $or: [
        { name: req.body.name },
        { email: req.body.email }
      ]
    });
    if(existingAccount){
      console.log("account already exist", existingAccount.name);
      const result = {
        _id: existingAccount._id,
        message: 'Account already exists',
        mongodb: existingAccount,
        source: 'existing'
      };
      
      if (res) {
        return res.status(200).json(result);
      }
      return result;

    }
    
    console.log('Creating account in ServiceNow with payload:', req.body);
    
    // Step 1: Create in ServiceNow first
    const connection = snConnection.getConnection(req.user.sn_access_token);
    const snResponse = await axios.post(
      `${connection.baseURL}/api/now/table/customer_account`, 
      req.body,
      { headers: connection.headers }
    );
    
    console.log('Account created in ServiceNow:', snResponse.data.result.sys_id);
    
    // Step 2: Create in MongoDB with ServiceNow response data
    try {
      const account = new Account({
        sys_id: snResponse.data.result.sys_id,
        ...req.body
    });
      const savedAccount = await account.save();
      console.log('Account created in MongoDB:', savedAccount._id);

      const resultat = {
        _id:savedAccount._id,
        message: 'Account created successfully in both ServiceNow and MongoDB',
        servicenow: snResponse.data.result,
        mongodb: savedAccount,
        source: 'both'
      }
      if(res){
        res.status(201).json(resultat);
      //res.stauts(201).json(savedAccount);
      }
      return resultat;
      
    } catch (mongoError) {
      console.error('MongoDB creation failed:', mongoError);
      return handleMongoError(res, snResponse.data.result, mongoError, 'creation');
    }
    
  } catch (error) {
    console.error('Error creating account:', error);
    
    // Handle MongoDB errors
    if (error.name && error.name.includes('Mongo')) {
      const mongoError = handleMongoError(error);
      return res.status(mongoError.status).json({ error: mongoError.message });
    }
    
    // Handle ServiceNow errors
    const status = error.response?.status || 500;
    const message = error.response?.data?.error?.message || error.message;
    res.status(status).json({ error: message });
  }
};

// Original Express route handler for backward compatibility
module.exports = async (req, res) => {
  return createAccount(req, res);
};

module.exports.createAccount = createAccount;