const mongoose = require('mongoose');
const quoteLineSchema = new mongoose.Schema({
  sys_id: {
    type: String,
    required: true,
    unique: true
  },
  number: {
    type: String,
    required: true
  },
  product_offering: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'ProductOffering', 
    required: true 
  },
  term_month: String,
  quantity: String,
  unit_price: String,
  price_list: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'PriceList', 
    required: true 
  },
  unit_of_measurement: String,
   quote: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Quote', 
    required: true 
  },
  state: {
    type: String,
    default: 'draft'
  },
  action: {
    type: String,
  }
});

const QuoteLine = mongoose.model('QuoteLine', quoteLineSchema, 'quotelines');
module.exports = QuoteLine;
