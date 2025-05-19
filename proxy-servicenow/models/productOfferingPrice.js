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
    value: String
  },
  lifecycleStatus: String,
  validFor: {
    startDateTime: Date,
    endDateTime: Date
  },
  productOffering: {
    id: String,
    name: String
  },
  priceType: String,
  recurringChargePeriodType: String,
  unitOfMeasure: {
    id: String,
    amount: Number,
    units: String
  },  
  priceList: {
    id: String,
    name: String,
    "@type": String
  },
  
  "@type": { type: String, default: "ProductOfferingPrice"}

}, {
  timestamps: true,
  strict: false
});

module.exports = mongoose.model('ProductOfferingPrice', productOfferingPriceSchema, 'product_offering_prices');