const mongoose = require('mongoose');

const opportunityLineSchema = new mongoose.Schema({
  sys_id: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  priceList: {
    value: String,
    "@type": String
  },
  product_offering: {
    value: String
  },
  opportunity: {
    value: String
  },
  unit_of_measurement: {
    value: String
  }, 
  term_month: String,
  quantity: String
}, {
  timestamps: true,
  strict: false
});

module.exports = mongoose.model('OpportunityLine', opportunityLineSchema, 'opportunity_lines');