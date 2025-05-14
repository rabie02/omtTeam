const mongoose = require('mongoose');

const opportunityLineSchema = new mongoose.Schema({
  sys_id: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  price_list: { type: mongoose.Schema.Types.ObjectId, ref: 'PriceList' },
  product_offering: { type: mongoose.Schema.Types.ObjectId, ref: 'ProductOffering' },
  term_month: Number,
  opportunity: { type: mongoose.Schema.Types.ObjectId, ref: 'Opportunity' },
  quantity: Number
}, {
  timestamps: true,
  strict: false
});

module.exports = mongoose.model('OpportunityLine', opportunityLineSchema, 'opportunity_lines');