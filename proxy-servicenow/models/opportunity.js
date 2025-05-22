const mongoose = require('mongoose');


const opportunitySchema = new mongoose.Schema({
  sys_id: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  short_description: String,
  assignment_group: String,
  estimated_closed_date: Date,
  actual_closed_date: Date,
  description: String,
  term_month: Number,
  industry: String,
  source: String,
  sales_cycle_type: String,
  score: Number,
  contact: String,
  probability: Number,
  do_not_share: Boolean,
  stage: String,
  do_not_email: Boolean,
  do_not_call: Boolean,
  account: String,
  price_list: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PriceList',
  },
  number: String

}, {
  timestamps: true,
  strict: false
});

module.exports = mongoose.model('Opportunity', opportunitySchema, 'opportunities');