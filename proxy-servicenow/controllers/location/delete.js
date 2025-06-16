const config = require('../../utils/configCreateAccount');
const axios = require('axios');
const Location = require('../../models/location');
const handleMongoError = require('../../utils/handleMongoError');

async function deleteLocation(req, res) {
  try {
    const locationId = req.params.id;
    const location = await Location.findById(locationId);

    if (!location) {
      return res.status(404).json({ error: 'Location not found in MongoDB' });
    }

    // Create basic auth configuration
    const auth = {
      username: config.serviceNow.user,
      password: config.serviceNow.password
    };

    // Delete from ServiceNow if sys_id exists
    if (location.sys_id) {
      try {
        // First, find and delete relationships using GET + DELETE pattern
        const relationships = await axios.get(
          `${config.serviceNow.url}/api/now/table/account_address_relationship?sysparm_query=location=${location.sys_id}`,
          { auth }
        );

        // Delete each relationship record individually
        for (const rel of relationships.data.result) {
          await axios.delete(
            `${config.serviceNow.url}/api/now/table/account_address_relationship/${rel.sys_id}`,
            { auth }
          );
        }

        // Then delete the location
        await axios.delete(
          `${config.serviceNow.url}/api/now/table/cmn_location/${location.sys_id}`,
          { auth }
        );
        console.log(`Deleted location ${location.sys_id} from ServiceNow`);
      } catch (error) {
        console.error('ServiceNow deletion error:', error.message);
        // Continue with MongoDB deletion even if ServiceNow fails
      }
    }

    // Delete from MongoDB
    await Location.findByIdAndDelete(locationId);
    console.log(`Deleted location ${locationId} from MongoDB`);

    return res.json({
      message: 'Location deleted successfully',
      deletedLocationId: locationId,
      serviceNowDeleted: !!location.sys_id
    });

  } catch (error) {
    console.error('Error deleting location:', error);
    
    if (error.name?.includes('Mongo')) {
      const mongoError = handleMongoError(error);
      return res.status(mongoError.status).json({ error: mongoError.message });
    }
    
    const status = error.response?.status || 500;
    const message = error.response?.data?.error?.message || error.message;
    return res.status(status).json({ error: message });
  }
}

module.exports = deleteLocation;