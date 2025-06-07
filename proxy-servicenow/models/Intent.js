const mongoose = require('mongoose');

const intentSchema = new mongoose.Schema({
  tag: String,
  patterns: [String],
  responses: [String],
  context: [String]
});

module.exports = mongoose.model('Intent', intentSchema);
