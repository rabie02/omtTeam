const mongoose = require('mongoose');

const locationSchema = new mongoose.Schema({
  sys_id: String, // ServiceNow sys_id
  name: { type: String, required: true },
  latitude: String,
  longitude: String,
  street: String,
  city: String,
  state: String,
  country: String,
  zip: String,

  // Reference to the related Account document by its MongoDB _id
  account: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Account',
    required: true
  },

  // Reference to a single Contact document
  contact: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Contact',
    required: true
  },

  // Archived flag
  archived: {
    type: Boolean,
    default: false
  }

}, {
  timestamps: true,
  strict: false
});

module.exports = mongoose.model('Location', locationSchema, 'locations');
