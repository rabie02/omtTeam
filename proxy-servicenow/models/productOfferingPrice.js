const mongoose = require('mongoose');

const productOfferingPriceSchema = new mongoose.Schema({
  sys_id: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  name: String,
  price: {
    unit: String,
    value: Number
  },
  lifecycleStatus: String,
  validFor: {
    startDateTime: Date,
    endDateTime: Date
  },
  productOffering: { type: mongoose.Schema.Types.Mixed, ref: 'ProductOffering'},
  priceType: String,
  recurringChargePeriodType: String,
  unitOfMeasure: String,
  priceList: { type: mongoose.Schema.Types.Mixed, ref: 'PriceList'},
  "@type": String
}, {
  timestamps: true,
  strict: false
});

module.exports = mongoose.model('ProductOfferingPrice', productOfferingPriceSchema, 'product_offering_prices');