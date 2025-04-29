const ProductOfferingCatalog = require('../../models/ProductOfferingCatalog');

module.exports = async (req, res) => {
  try {
    const data = await ProductOfferingCatalog.findOne({ _id: req.params.id });
    if (!data) return res.status(404).send({ message: 'Catalog not found' });
    res.send(data);
  } catch (err) {
    res.status(500).send(err);
  }
};