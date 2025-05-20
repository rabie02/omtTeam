const axios = require('axios');
const config = require('./config');
const User = require('../../models/User'); // Import MongoDB model

const getAuthHeader = () => {
  const basicAuth = Buffer.from(`${config.serviceNow.user}:${config.serviceNow.password}`).toString('base64');
  return `Basic ${basicAuth}`;
};

const serviceNowRequest = async (method, endpoint, data = null) => {
  const url = `${config.serviceNow.url}${endpoint}`;
  
  const options = {
    method,
    url,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': getAuthHeader()
    },
    timeout: 20000,
    data
  };

  try {
    const response = await axios(options);
    return response.data.result;
  } catch (error) {
    console.error('ServiceNow API error:', {
      endpoint,
      status: error.response?.status,
      message: error.message
    });
    throw error;
  }
};

const checkEmailExists = async (email) => {
  // Check both MongoDB and ServiceNow
  const [mongoUser, serviceNowResults] = await Promise.all([
    User.findOne({ email }),
    serviceNowRequest('GET', `/api/now/table/customer_contact?sysparm_query=email=${encodeURIComponent(email)}`)
  ]);

  return mongoUser || serviceNowResults.length > 0;
};

const createServiceNowRecords = async (userData) => {
  let mongoUser, serviceNowRecords;
  
  try {
    // 1. First create ServiceNow records
    serviceNowRecords = await createServiceNowRecordsOnly(userData);
    
    // 2. Then save to MongoDB
    mongoUser = await saveToMongoDB(userData, serviceNowRecords);
    
    return { serviceNowRecords, mongoUser };
  } catch (error) {
    // Cleanup if partial creation occurred
    if (serviceNowRecords && !mongoUser) {
      await cleanupServiceNowRecords(serviceNowRecords).catch(cleanupError => {
        console.error('Cleanup failed:', cleanupError);
      });
    }
    throw error;
  }
};

const createServiceNowRecordsOnly = async (userData) => {
    const username = `${userData.first_name.toLowerCase()}.${userData.last_name.toLowerCase()}`;
    
    // Account creation
    const accountPayload = {
      name: userData.type === 'company' ? userData.company_name : `${userData.first_name} ${userData.last_name}`,
      account_type: userData.type === 'company' ? 'business' : 'individual',
      phone: userData.mobile_phone || '',
      email: userData.email,
      user_name: username // Add username field if your ServiceNow table has it
    };
  
  const account = await serviceNowRequest('POST', '/api/now/table/customer_account', accountPayload);
  
  // Contact creation
  const contactPayload = {
    first_name: userData.first_name,
    last_name: userData.last_name,
    email: userData.email,
    phone: userData.mobile_phone || '',
    account: account.sys_id,
    user_password: userData.password, // ServiceNow will handle hashing
    is_primary_contact: true,
    active: true,
    ...(userData.type === 'company' && { job_title: userData.job_title || 'Representative' })
  };
  
  const contact = await serviceNowRequest('POST', '/api/now/table/customer_contact?sysparm_input_display_value=true', contactPayload);
  
  // Location creation
  const locationPayload = {
    name: `${userData.first_name} ${userData.last_name} Location`,
    latitude: userData.location?.latitude?.toString() || '',
    longitude: userData.location?.longitude?.toString() || '',
    street: userData.location?.address || 'Not specified',
    city: userData.location?.city || 'Unknown',
    state: userData.location?.state || 'Unknown',
    country: userData.location?.country || 'Unknown',
    zip: userData.location?.postalCode || '00000',
    u_account: account.sys_id
  };
  
  const location = await serviceNowRequest('POST', '/api/now/table/cmn_location', locationPayload);
  
  // Relationship creation
  const relationshipPayload = {
    account: account.sys_id,
    location: location.sys_id,
    type: 'Primary',
    is_primary: true
  };
  
  await serviceNowRequest('POST', '/api/now/table/account_address_relationship', relationshipPayload);
  
  return { account, contact, location };
};

const saveToMongoDB = async (userData, serviceNowRecords) => {
    const username = `${userData.first_name.toLowerCase()}.${userData.last_name.toLowerCase()}`;
    
    const user = new User({
      serviceNowId: serviceNowRecords.contact.sys_id,
      firstName: userData.first_name,
      lastName: userData.last_name,
      username: username, // Add username field
      email: userData.email,
      mobilePhone: userData.mobile_phone,
      password: userData.password,
      type: userData.type,
      companyName: userData.type === 'company' ? userData.company_name : undefined,
      location: userData.location
    });
  
    return await user.save();
  };

const cleanupServiceNowRecords = async (records) => {
  // Implement cleanup logic if MongoDB save fails
  try {
    await Promise.all([
      records.account && serviceNowRequest('DELETE', `/api/now/table/customer_account/${records.account.sys_id}`),
      records.contact && serviceNowRequest('DELETE', `/api/now/table/customer_contact/${records.contact.sys_id}`),
      records.location && serviceNowRequest('DELETE', `/api/now/table/cmn_location/${records.location.sys_id}`)
    ].filter(Boolean));
  } catch (error) {
    console.error('Failed to cleanup ServiceNow records:', error);
    throw error;
  }
};

module.exports = {
  checkEmailExists,
  createServiceNowRecords
};