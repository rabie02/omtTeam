const mongoose = require('mongoose');

const productOfferingSchema = new mongoose.Schema({
  link: String,
  value: String
});

const priceListSchema = new mongoose.Schema({
  link: String,
  value: String
});

const unitOfMeasurementSchema = new mongoose.Schema({
  link: String,
  value: String
});

const opportunitySchema = new mongoose.Schema({
  link: String,
  value: String
});

const opportunityLineItemSchema = new mongoose.Schema({
  cumulative_acv: String,
  service_location: String,
  product_offering: productOfferingSchema,
  term_month: String,
  external_id: String,
  sys_updated_on: String,
  number: String,
  sys_id: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  price_list: priceListSchema,
  unit_of_measurement: unitOfMeasurementSchema,
  cumulative_tcv: String,
  sys_updated_by: String,
  sys_created_on: String,
  unit_net_price: String,
  cumulative_arr: String,
  sys_created_by: String,
  quantity: String,
  sys_mod_count: String,
  cumulative_mrr: String,
  opportunity: opportunitySchema,
  sys_tags: String,
  unit_list_price: String,
  total_one_time_price: String,
  work_notes: String,
  external_system: String
});

module.exports = mongoose.model('OpportunityLine', opportunityLineItemSchema, 'opportunity_lines');