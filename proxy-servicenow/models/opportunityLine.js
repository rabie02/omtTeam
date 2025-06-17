const mongoose = require('mongoose');



const unitOfMeasurementSchema = new mongoose.Schema({
  link: String,
  value: String
});


const opportunityLineItemSchema = new mongoose.Schema({
  cumulative_acv: String,
  service_location: String,
  productOffering: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ProductOffering'
  },
  term_month: String,
  external_id: String,
  sys_updated_on: String,
  number: String,
  sys_id: {
    type: String,
    unique: true,
    index: true
  },
  priceList: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PriceList'
  },
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
  opportunity: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Opportunity'
  },
  sys_tags: String,
  unit_list_price: String,
  total_one_time_price: String,
  work_notes: String,
  external_system: String
});

module.exports = mongoose.model('OpportunityLine', opportunityLineItemSchema, 'opportunity_lines');