
const PriceList = require('../../models/priceList');
const getProductOfferingPriceByPriceList = require('../ProductOfferingPrice/getProductOfferingPriceByPriceList_includePO');
const Account = require('../../models/account')
module.exports = async (req, res) => {
  try {
    const id = req.params.id;
    const mongoDoc = await PriceList.findById(id).lean();
    const pop = await getProductOfferingPriceByPriceList(req);
    const account = await Account.findOne({'sys_id': mongoDoc.account});
    return res.status(200).json({...mongoDoc, pops: pop.result});

  } catch (error) {
    console.error('Error fetching price Lists:', error);
    const mongoError = handleMongoError(error);
    return res.status(mongoError.status).json({ error: mongoError.message });
  }
};