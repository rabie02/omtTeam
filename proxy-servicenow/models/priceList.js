const mongoose = require('mongoose');

const priceListSchema = new mongoose.Schema({
  sys_id: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  name: String,
  description: String,
  state: String,
  defaultflag: String,
  currency:String,
  validFor: {
    startDateTime: Date,
    endDateTime: Date
  }
}, {
  timestamps: true,
  strict: false
});

priceListSchema.pre('deleteOne', { document: true, query: false }, async function(next) {
  try {
    await mongoose.model('ProductOfferingPrice').deleteMany({ priceList: this._id });
    next();
  } catch (err) {
    next(err);
  }
});

priceListSchema.pre('deleteMany', async function(next) {
  try {
    const priceLists = await this.model.find(this.getFilter());
    const priceListIds = priceLists.map(pl => pl._id);
    await mongoose.model('ProductOfferingPrice').deleteMany({ 
      priceList: { $in: priceListIds } 
    });
    next();
  } catch (err) {
    next(err);
  }
});


module.exports = mongoose.model('PriceList', priceListSchema, 'price_lists');