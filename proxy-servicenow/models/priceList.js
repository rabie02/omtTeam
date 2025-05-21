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
  state: String,
  defaultflag: String,
  currency:String,
  validFor: {
    startDateTime: Date,
    endDateTime: Date
  }
}, {
  timestamps: true,
  strict: false
});

module.exports = mongoose.model('PriceList', priceListSchema, 'price_lists');