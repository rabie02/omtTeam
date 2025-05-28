const mongoose = require('mongoose');

const priceSchema = new mongoose.Schema({
  unit: String,
  value: String
});

const validForSchema = new mongoose.Schema({
  startDateTime: String,
  endDateTime: String
});

const productOfferingSchema = new mongoose.Schema({
  id: String
});

const unitOfMeasureSchema = new mongoose.Schema({
  id: String
});

const priceListSchema = new mongoose.Schema({
  id: String,
  name: String,
  "@type": String
});

const productOfferingPriceSchema = new mongoose.Schema({
  sys_id: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  id: String,
  name: String,
  price: priceSchema,
  lifecycleStatus: String,
  validFor: validForSchema,
  // MongoDB reference to ProductOffering collection
  productOffering: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ProductOffering'
  },
  // Keep the original productOffering schema for ServiceNow data
  productOfferingData: productOfferingSchema,
  priceType: String,
  recurringChargePeriodType: String,
  unitOfMeasure: unitOfMeasureSchema,
  // MongoDB reference to PriceList collection
  priceList: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PriceList'
  },
  // Keep the original priceList schema for ServiceNow data
  priceListData: priceListSchema,
  "@type": String,
  state: String,
  href: String
}, {
  timestamps: true,
  strict: false,
  // Handle the @type field properly
  toJSON: { 
    virtuals: true,
    transform: function(doc, ret) {
      ret['@type'] = ret.type;
      delete ret.type;
      return ret; 
    }
  },
  toObject: {
    virtuals: true,
    transform: function(doc, ret) {
      ret['@type'] = ret.type;
      delete ret.type;
      return ret;
    }
  }
});

// Virtual for @type since it's not a valid identifier in JavaScript
productOfferingPriceSchema.virtual('type').get(function() {
  return this['@type'];
}).set(function(value) {
  this['@type'] = value;
});

// Add indexes for better performance
productOfferingPriceSchema.index({ priceList: 1 });
productOfferingPriceSchema.index({ productOffering: 1 });

module.exports = mongoose.model('ProductOfferingPrice', productOfferingPriceSchema, 'product_offering_prices');