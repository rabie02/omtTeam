const express = require('express');
const router = express.Router();
const deleteProductSpecification = require('../../controllers/ProductSpecification/deleteProductSpecification');

router.delete('/spec/:id', deleteProductSpecification);

module.exports = router;
