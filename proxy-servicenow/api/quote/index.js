const express = require('express');
const router = express.Router();

// Import controllers
 const getAll = require('../../controllers/quote/getall')
// const create = require('../../controllers/quota/create')
const update = require('../../controllers/quote/update')

router.get('/quote', getAll);
// router.post('/quota', create);
router.patch('/quote', update);

module.exports = router;