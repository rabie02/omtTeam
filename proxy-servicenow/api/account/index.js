const express = require('express');
const router = express.Router();

// Import controllers
const getAll = require('../../controllers/account/getall');
const getOne = require('../../controllers/account/getone');
const create = require('../../controllers/account/create');
const deleteAccount = require('../../controllers/account/delete');
const update = require('../../controllers/account/update');

//routes
router.post('/account', create)
router.get('/account', getAll);
router.get('/account/:id', getOne);
router.delete('/account/:id', deleteAccount);
router.patch('/account/:id',update);

module.exports = router;