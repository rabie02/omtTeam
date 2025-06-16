const config = require('../../utils/configCreateAccount');
const axios = require('axios');
const Contact = require('../../models/Contact');
const handleMongoError = require('../../utils/handleMongoError');

async function deleteContact(req, res) {
  try {
    const contactId = req.params.id;
    const contact = await Contact.findById(contactId);

    if (!contact) {
      return res.status(404).json({ error: 'Contact not found in MongoDB' });
    }

    // Create basic auth configuration
    const auth = {
      username: config.serviceNow.user,
      password: config.serviceNow.password
    };

    // Delete from ServiceNow if sys_id exists
    if (contact.sys_id) {
      await axios.delete(
        `${config.serviceNow.url}/api/now/table/customer_contact/${contact.sys_id}`,
        { auth }
      );
      console.log(`Deleted contact ${contact.sys_id} from ServiceNow`);
    }

    // Delete from MongoDB
    await Contact.findByIdAndDelete(contactId);
    console.log(`Deleted contact ${contactId} from MongoDB`);

    return res.json({
      message: 'Contact deleted successfully from both systems',
      deletedContactId: contactId,
      serviceNowId: contact.sys_id || null
    });

  } catch (error) {
    console.error('Error deleting contact:', error);
    
    if (error.name?.includes('Mongo')) {
      const mongoError = handleMongoError(error);
      return res.status(mongoError.status).json({ error: mongoError.message });
    }
    
    const status = error.response?.status || 500;
    const message = error.response?.data?.error?.message || error.message;
    return res.status(status).json({ error: message });
  }
}

module.exports = deleteContact;