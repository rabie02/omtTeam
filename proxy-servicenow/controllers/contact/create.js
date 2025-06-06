const config = require('../../utils/configCreateAccount');
const axios = require('axios');
const handleMongoError = require('../../utils/handleMongoError');
const Contact = require('../../models/Contact');
const Account = require('../../models/account');

async function createContact(req, res = null) {
  try {
    console.log('Creating contact with payload:', req.body);

    if (!req.body.account) {
      throw new Error('Account reference is required');
    }

    const accountDoc = await Account.findById(req.body.account);
    if (!accountDoc) {
      throw new Error('Account not found');
    }

    // Create basic auth configuration
    const auth = {
      username: config.serviceNow.user,
      password: config.serviceNow.password
    };

    // Prepare ServiceNow contact payload with correct field names
    const contactPayload = {
      first_name: req.body.firstName,
      last_name: req.body.lastName,
      email: req.body.email,
      phone: req.body.phone || '',
      account: accountDoc.sys_id,
      user_password: req.body.password || '',
      is_primary_contact: true,
      active: true,
      ...(req.body.jobTitle && { job_title: req.body.jobTitle }),
      sys_class_name: 'customer_contact'
    };

    // Create in ServiceNow
    const snResponse = await axios.post(
      `${config.serviceNow.url}/api/now/table/customer_contact`,
      contactPayload,
      {
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          // Add this if your instance requires it
          'X-SN-Table-Name': 'customer_contact'
        },
        auth
      }
    );

    console.log('Contact created in ServiceNow:', snResponse.data.result);

    // Save to MongoDB
    const contact = new Contact({
      sys_id: snResponse.data.result.sys_id,
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      email: req.body.email,
      phone: req.body.phone,
      account: accountDoc._id,
      isPrimaryContact: true,
      active: true,
      ...(req.body.jobTitle && { jobTitle: req.body.jobTitle })
    });

    const savedContact = await contact.save();

    const result = {
      _id: savedContact._id,
      message: 'Contact created successfully',
      servicenow: snResponse.data.result,
      mongodb: savedContact
    };

    if (res) return res.status(201).json(result);
    return result;

  } catch (error) {
    console.error('Error creating contact:', error);
    
    if (res) {
      if (error.name?.includes('Mongo')) {
        const mongoError = handleMongoError(error);
        return res.status(mongoError.status).json({ error: mongoError.message });
      }
      
      const status = error.response?.status || 500;
      const message = error.response?.data?.error?.message || error.message;
      return res.status(status).json({ error: message });
    }
    throw error;
  }
}

module.exports = createContact;