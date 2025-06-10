const axios = require('axios');
const config = require('../../utils/configCreateAccount');

// Controller function to be used in router
const getAdresse = async (req, res) => {
  console.log('test');
  try {
    const { lat, lng } = req.query;
    if (!lat || !lng) {
      return res.status(400).json({ error: 'Latitude and longitude are required' });
    }

    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);

    if (!validateCoordinates(latitude, longitude)) {
      return res.status(400).json({ error: 'Invalid latitude or longitude values' });
    }

    const addressDetails = await getAddressFromCoordinates(latitude, longitude);
    res.json(addressDetails);
  } catch (error) {
    console.error('Geocoding error:', error);
    res.status(500).json({ 
      address: '', 
      city: '', 
      state: '', 
      country: '', 
      postalCode: '',
      error: 'Failed to process geocoding request' 
    });
  }
};

// Validate coordinate values
const validateCoordinates = (latitude, longitude) => {
  if (typeof latitude !== 'number' || typeof longitude !== 'number') {
    return false;
  }
  return Math.abs(latitude) <= 90 && Math.abs(longitude) <= 180;
};

// Call Nominatim API and return parsed address
const getAddressFromCoordinates = async (latitude, longitude) => {
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

// Parse response from Nominatim API
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

// Empty address template
const emptyAddressDetails = () => ({
  address: '',
  city: '',
  state: '',
  country: '',
  postalCode: ''
});

module.exports = getAdresse;
