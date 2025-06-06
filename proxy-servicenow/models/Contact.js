const mongoose = require('mongoose');

const contactSchema = new mongoose.Schema({
  sys_id: String, // ServiceNow sys_id
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true },
  phone: String,
  password: String, // Usually avoid storing passwords here unless hashed
  jobTitle: String,
  isPrimaryContact: { type: Boolean, default: true },
  active: { type: Boolean, default: true },

  // Reference to the related Account document by its MongoDB _id
  account: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Account',
    required: true
  }
}, {
  timestamps: true,
  strict: false
});

module.exports = mongoose.model('Contact', contactSchema, 'contacts');
