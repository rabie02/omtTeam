const config = require('../../utils/configCreateAccount');
const axios = require('axios');
const handleMongoError = require('../../utils/handleMongoError');
const Location = require('../../models/location');
const Account = require('../../models/account');

async function createLocation(req, res = null) {
  let locationSysId;
  let savedLocation;

  try {
    console.log('Creating location with payload:', req.body);

    // Validate account reference
    if (!req.body.account) {
      throw new Error('Account reference is required');
    }

    const accountDoc = await Account.findById(req.body.account);
    if (!accountDoc) {
      throw new Error('Account not found in MongoDB');
    }

    // Create basic auth configuration
    const auth = {
      username: config.serviceNow.user,
      password: config.serviceNow.password
    };

    // 1. First create in MongoDB to get the ID
    const location = new Location({
      ...req.body,
      account: accountDoc._id // Use _id for MongoDB
    });
    savedLocation = await location.save();

    // 2. Prepare ServiceNow location payload with MongoDB ID as external_id
    const locationPayload = {
      name: req.body.name,
      latitude: req.body.latitude,
      longitude: req.body.longitude,
      street: req.body.street || '',
      city: req.body.city || '',
      state: req.body.state || '',
      country: req.body.country || '',
      zip: req.body.zip || '',
      account: accountDoc.sys_id, // Use sys_id for ServiceNow
      external_id: savedLocation._id.toString(), // Add MongoDB ID here
      sys_class_name: 'cmn_location'
    };

    // 3. Create location in ServiceNow
    const locationResponse = await axios.post(
      `${config.serviceNow.url}/api/now/table/cmn_location`,
      locationPayload,
      {
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        auth
      }
    );

    locationSysId = locationResponse.data.result.sys_id;
    console.log('Location created in ServiceNow:', locationSysId);

    // 4. Update MongoDB record with ServiceNow sys_id
    savedLocation.sys_id = locationSysId;
    await savedLocation.save();

    // 5. Create account-location relationship in ServiceNow
    const relationshipPayload = {
      account: accountDoc.sys_id,
      location: locationSysId,
      type: 'Primary',
      is_primary: true
    };

    await axios.post(
      `${config.serviceNow.url}/api/now/table/account_address_relationship`,
      relationshipPayload,
      {
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        auth
      }
    );

    console.log('Account-location relationship created in ServiceNow');

    const result = {
      _id: savedLocation._id,
      message: 'Location and account relationship created successfully',
      servicenow: {
        location: locationResponse.data.result,
        relationship: relationshipPayload
      },
      mongodb: savedLocation
    };

    if (res) return res.status(201).json(result);
    return result;

  } catch (error) {
    console.error('Error creating location:', error);
    
    // Clean up if anything failed
    if (savedLocation && !locationSysId) {
      // If MongoDB was created but ServiceNow failed
      await Location.findByIdAndDelete(savedLocation._id);
    } else if (locationSysId) {
      // If ServiceNow location was created but relationship failed
      await axios.delete(
        `${config.serviceNow.url}/api/now/table/cmn_location/${locationSysId}`,
        { auth }
      ).catch(cleanupError => {
        console.error('Failed to clean up location:', cleanupError);
      });
    }

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

module.exports = createLocation;