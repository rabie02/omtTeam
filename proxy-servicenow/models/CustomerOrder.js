const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Price subdocument schema
const PriceSchema = new Schema({
  taxIncludedAmount: {
    unit: String,
    value: Number
  }
});

// Item Price subdocument schema
const ItemPriceSchema = new Schema({
  priceType: String,
  recurringChargePeriod: String,
  price: PriceSchema
});

// Product Characteristic subdocument schema
const ProductCharacteristicSchema = new Schema({
  name: String,
  valueType: String,
  value: String,
  previousValue: String
});

// Product Specification subdocument schema
const ProductSpecificationSchema = new Schema({
  id: String,
  name: String,
  version: String,
  internalVersion: String,
  internalId: String,
  "@type": String
});

// Product subdocument schema
const ProductSchema = new Schema({
  "@type": String,
  productCharacteristic: [ProductCharacteristicSchema],
  productSpecification: ProductSpecificationSchema
});

// Product Offering subdocument schema
const ProductOfferingSchema = new Schema({
  id: String,
  name: String,
  version: String,
  internalVersion: String,
  internalId: String
});

// Product Order Item subdocument schema
const ProductOrderItemSchema = new Schema({
  id: String,
  ponr: String,
  quantity: Number,
  priority: Number,
  action: String,
  itemPrice: [ItemPriceSchema],
  product: ProductSchema,
  productOffering: ProductOfferingSchema,
  state: String,
  version: String,
  "@type": String
});

// Channel subdocument schema
const ChannelSchema = new Schema({
  id: String,
  name: String
});

// Related Party subdocument schema
const RelatedPartySchema = new Schema({
  id: String,
  name: String,
  "@type": String,
  "@referredType": String
});

// Main Product Order schema
const CustomerOrderSchema = new Schema({
  pont: String,
  orderCurrency: String,
  priority: Number,
  orderDate: Date,
  channel: [ChannelSchema],
  productOrderItem: [ProductOrderItemSchema],
  relatedParty: [RelatedPartySchema],
  state: String,
  version: String,
  "@type": String,
  id: String,
  href: String
}, { timestamps: true });

// Create the model
const CustomerOrder = mongoose.model('CustomerOrder', CustomerOrderSchema);

module.exports = CustomerOrder;