const express = require('express');
const router = express.Router();

// Import controllers
const create = require('../../controllers/contact/create');
const update = require('../../controllers/contact/update');
const deleteContact = require('../../controllers/contact/delete');
const getAll = require('../../controllers/contact/getall');


//routes
router.post('/contact', create)
router.patch('/contact/:id',update);
router.delete('/contact/:id',deleteContact);
router.get('/contact', getAll);

module.exports = router;