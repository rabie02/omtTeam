const ProductOffering = require('../../models/ProductOffering');

module.exports = async (req, res) => {
  try {
    const data = await ProductOffering.findOne({ sys_id: req.params.sys_id });
    if (!data) return res.status(404).send({ message: 'Product Offering not found' });
    res.send(data);
  } catch (err) {
    res.status(500).send(err);
  }
};