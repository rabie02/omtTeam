const config = require('../../utils/configCreateAccount');
const axios = require('axios');
const Contact = require('../../models/Contact');
const handleMongoError = require('../../utils/handleMongoError');

module.exports = async (req, res) => {
  try {
    const mongoId = req.params.id;
    const contact = await Contact.findById(mongoId);
    
    if (!contact) {
      return res.status(404).json({ error: 'Contact not found in MongoDB' });
    }
    
    const servicenowId = contact.sys_id;
    
    // Create basic auth header using ServiceNow credentials from config
    const auth = {
      username: config.serviceNow.user,
      password: config.serviceNow.password
    };

    // Prepare ServiceNow payload (transform field names)
    const snPayload = {
      first_name: req.body.firstName,
      last_name: req.body.lastName,
      email: req.body.email,
      phone: req.body.phone,
      ...(req.body.password && { user_password: req.body.password }),
      ...(req.body.isPrimaryContact !== undefined && { 
        is_primary_contact: req.body.isPrimaryContact 
      }),
      active: req.body.active,
      ...(req.body.jobTitle && { job_title: req.body.jobTitle }),
      sys_class_name: 'customer_contact'
    };
    
    // Update in ServiceNow using basic auth
    const snResponse = await axios.patch(
      `${config.serviceNow.url}/api/now/table/customer_contact/${servicenowId}`,
      snPayload,
      {
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-SN-Table-Name': 'customer_contact'
        },
        auth
      }
    );
    
    // Update in MongoDB
    const updatedContact = await Contact.findByIdAndUpdate(
      mongoId,
      req.body,
      { new: true }
    );
    
    res.json({
      message: 'Contact updated successfully in both systems',
      servicenow: snResponse.data.result,
      mongodb: updatedContact
    });
    
  } catch (error) {
    console.error('Error updating contact:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({ 
        error: 'Invalid MongoDB ID format',
        mongoId: req.params.id
      });
    }
    
    if (error.name?.includes('Mongo')) {
      const mongoError = handleMongoError(error);
      return res.status(mongoError.status).json({ error: mongoError.message });
    }
    
    const status = error.response?.status || 500;
    const message = error.response?.data?.error?.message || error.message;
    res.status(status).json({ error: message });
  }
};