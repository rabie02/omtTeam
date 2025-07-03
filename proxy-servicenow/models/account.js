const mongoose = require('mongoose');

const accountSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  sys_id: String,
  sys_created_on: {
    type: Date
  },
  sys_created_by: String,
  business_owners: String,
  phone: String,
  industry: String,
  email: String,
  website: String,
  customer: String,
  number: String,

  // New field
  archived: {
    type: Boolean,
    default: false // Default to false so it's active by default
  },

  contacts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Contact'
  }],

  locations: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Location'
  }]
}, {
  timestamps: true,
  strict: false
});

module.exports = mongoose.model('Account', accountSchema, 'accounts');
