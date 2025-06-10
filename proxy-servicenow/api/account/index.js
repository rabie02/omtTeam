const express = require('express');
const router = express.Router();

// Import controllers
const getAll = require('../../controllers/account/getall');
const getOne = require('../../controllers/account/getone');
const create = require('../../controllers/account/create');
const deleteAccount = require('../../controllers/account/delete');
const update = require('../../controllers/account/update');

const requestCreation = require('../../controllers/account/service/requestCreation');
const confirmCreation = require('../../controllers/account/service/confirmCreation');

//routes
router.post('/account', create)
router.get('/account', getAll);
router.get('/account/:id', getOne);
router.delete('/account/:id', deleteAccount);
router.patch('/account/:id',update);


router.post('/request-creation', requestCreation);
router.get('/confirm-creation', confirmCreation);


module.exports = router;