const mongoose = require('mongoose');

const contactSchema = new mongoose.Schema({
  sys_id: String, // ServiceNow sys_id

  firstName: { type: String, required: true },
  lastName: { type: String },
  email: { type: String, required: true },
  phone: String,
  password: String, // Be sure to hash this before saving
  jobTitle: String,

  isPrimaryContact: { type: Boolean, default: true },
  active: { type: Boolean, default: true },

  // Reference to the related Account document
  account: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Account',
    required: true
  },

  // Reference to a single Location
  location: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Location',
    required: false // optional depending on your business rules
  },

  archived: {
    type: Boolean,
    default: false
  }

}, {
  timestamps: true,
  strict: false
});

module.exports = mongoose.model('Contact', contactSchema, 'contacts');
