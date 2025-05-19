const mongoose = require('mongoose');

const quoteSchema = new mongoose.Schema({
  sys_id: { type: String, required: true, unique: true, index: true },
  number: String,
  short_description: String,
  total_amount: String,
  account: String,
  valid_until: String,
  status: String
}, {
  timestamps: true,
  strict: false
});

const Quote = mongoose.model('Quote', quoteSchema, 'quotes');

module.exports = Quote;
