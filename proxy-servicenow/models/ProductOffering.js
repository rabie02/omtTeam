const mongoose = require('mongoose');
const Schema = mongoose.Schema;


const channelSchema = new Schema({
  description: { type: String, required: false, default: "" },
  id: { type: String, required: false },
  name: { type: String, required: false, default: "" },
});

const productSpecCharacteristicSchema = new Schema({
  name: { type: String, required: false, default: "" },
  valueType: { type: String, required: false },
  productSpecCharacteristicValue: [
    {
      value: {
        type: String,
        required: false,
      },
    },
  ],
});

const taxIncludedAmountSchema = new Schema({
  unit: { type: String, required: false },
  value: { type: String, required: false },
});

const priceSchema = new Schema({
  taxIncludedAmount: { type: taxIncludedAmountSchema, required: false },
});

const productOfferingPriceSchema = new Schema({
  price: {
    type: priceSchema,
    enum: ["nonRecurring", "recurring"],
    required: false,
  },
  priceType: { type: String, required: false },
});

const productSpecificationSchema = new Schema({
  id: { type: String, required: false },
  name: { type: String, required: false },
  internalId: { type: String, required: false },
  internalVersion: { type: String, required: false },
  version: { type: String, required: false },
});



const validForSchema = new Schema({
  endDateTime: { type: String, required: false, default: "" },
  startDateTime: { type: String, required: false, default: "" },
});

const productSpecCharacteristicValueSchema = new Schema({
  value: { type: String, required: false },
  validFor: { type: validForSchema, required: false },
});

const prodSpecCharValueUseSchema = new Schema({
  productSpecCharacteristicValue: {
    type: Array(productSpecCharacteristicValueSchema),
    required: false,
  },
  productSpecification: {
    id: { type: String, required: false },
    name: { type: String, required: false },
    version: { type: String, required: false },
    internalVersion: { type: String, required: false },
    internalId: { type: String, required: false },
  },
  description: { type: String, required: false, default: "" },
  name: { type: String, required: false },
  validFor: { type: validForSchema, required: false },
  valueType: { type: String, required: false },
});

const productOfferingSchema = new Schema({
  //number: { type: String, required: false }, 
  category: { type: Array({
  type: mongoose.Schema.Types.ObjectId,
  ref: 'ProductOfferingCategory'
}), required: false },
  channel: { type: Array(channelSchema), required: false },
  description: { type: String, required: false },
  externalId: { type: String, required: false, default: "" },
  id: { type: String, required: false }, 
  internalId: { type: String, required: false },
  lastUpdate: { type: String, required: false, default: "" },
  name: { type: String, required: true },
  productOfferingPrice: {
    type: Array(productOfferingPriceSchema),
    required: false,
  },
  productOfferingTerm: { type: String, required: false, default: "" },
  productSpecification: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ProductSpecification'
  },
  prodSpecCharValueUse: {
    type: [prodSpecCharValueUseSchema],
    required: false,
  },
  validFor: { type: validForSchema, required: false },
  version: { type: String, required: false },
  status: { type: String, required: false }, 
  lifecycleStatus:{ type: String, required: false }, 
  href:{ type: String, required: false },
});

module.exports = mongoose.model('ProductOffering', productOfferingSchema);