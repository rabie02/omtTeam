const axios = require('axios');
const config = require('./config');

const validateCoordinates = (latitude, longitude) => {
  if (typeof latitude !== 'number' || typeof longitude !== 'number') {
    return false;
  }
  return Math.abs(latitude) <= 90 && Math.abs(longitude) <= 180;
};

const getAddressFromCoordinates = async (latitude, longitude) => {
  if (!validateCoordinates(latitude, longitude)) {
    return emptyAddressDetails();
  }

  const apiUrl = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`;

  try {
    const response = await axios.get(apiUrl, {
      timeout: 10000,
      headers: {
        'User-Agent': `${config.app.name || 'locationregister'}/1.0`,
        'Referer': config.app.backendUrl || 'http://localhost',
        'Accept-Language': 'en'
      }
    });

    return parseNominatimResponse(response.data);
  } catch (error) {
    console.error('Geocoding error:', error.message);
    return emptyAddressDetails();
  }
};

const parseNominatimResponse = (data) => {
  const empty = emptyAddressDetails();
  
  if (!data?.address) return empty;

  const addr = data.address;
  return {
    address: [
      addr.house_number,
      addr.street,
      addr.road,
      addr.residential,
      addr.building,
      addr.commercial,
      addr.tourism,
      addr.leisure
    ].filter(Boolean).join(' ') || (addr.neighbourhood || addr.suburb || ''),
    city: addr.city || addr.town || addr.village || addr.hamlet || addr.municipality || addr.county || '',
    state: addr.state || addr.region || '',
    country: addr.country || '',
    postalCode: addr.postcode || ''
  };
};

const emptyAddressDetails = () => ({
  address: '',
  city: '',
  state: '',
  country: '',
  postalCode: ''
});

module.exports = {
  validateCoordinates,
  getAddressFromCoordinates
};