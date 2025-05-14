const mongoose = require('mongoose');

const priceListSchema = new mongoose.Schema({
  sys_id: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  name: String,
  description: String,
  status: String,
  validFor: {
    startDateTime: Date,
    endDateTime: Date
  }
}, {
  timestamps: true,
  strict: false
});

module.exports = mongoose.model('PriceList', priceListSchema, 'price_lists');