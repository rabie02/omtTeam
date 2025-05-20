const express = require('express');
const ProductOfferingCategory = require('../../models/ProductOfferingCategory');

const router = express.Router();

// GET BY ID
router.get('/product-offering-category/:sys_id', async (req, res) => {
  try {
    const data = await ProductOfferingCategory.findOne({ sys_id: req.params.sys_id });
    if (!data) return res.status(404).send({ message: 'Category not found' });
    res.send(data);
  } catch (err) {
    res.status(500).send(err);
  }
});

module.exports = router;