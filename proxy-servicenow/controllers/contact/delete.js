const config = require('../../utils/configCreateAccount');
const axios = require('axios');
const Contact = require('../../models/Contact');
const handleMongoError = require('../../utils/handleMongoError');

async function deleteContact(req, res) {
  try {
    const contactId = req.params.id;
    const contact = await Contact.findById(contactId).populate('location');

    if (!contact) {
      return res.status(404).json({ error: 'Contact not found in MongoDB' });
    }

    // Create basic auth configuration
    const auth = {
      username: config.serviceNow.user,
      password: config.serviceNow.password
    };

    // First delete the associated location if it exists
    if (contact.location) {
      try {
        // Call your existing deleteLocation API endpoint
        await axios.delete(
          `${config.app.backendUrl}/api/location/${contact.location._id}`,
          { headers: { 'Authorization': req.headers.authorization } }
        );
        console.log(`Deleted associated location ${contact.location._id}`);
      } catch (locError) {
        console.error('Error deleting location:', locError.message);
        // Continue with contact deletion even if location deletion fails
      }
    }

    // Delete from ServiceNow if sys_id exists
    if (contact.sys_id) {
      try {
        await axios.delete(
          `${config.serviceNow.url}/api/now/table/customer_contact/${contact.sys_id}`,
          { auth }
        );
        console.log(`Deleted contact ${contact.sys_id} from ServiceNow`);
      } catch (snError) {
        console.error('Error deleting ServiceNow contact:', snError.message);
        // Continue with MongoDB deletion even if ServiceNow fails
      }
    }

    // Finally delete from MongoDB
    await Contact.findByIdAndDelete(contactId);
    console.log(`Deleted contact ${contactId} from MongoDB`);

    return res.json({
      message: 'Contact and associated location deleted successfully',
      deletedContactId: contactId,
      deletedLocationId: contact.location?._id || null,
      serviceNowContactId: contact.sys_id || null
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