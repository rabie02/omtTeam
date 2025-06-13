const express = require('express');
const router = express.Router();

// Import controllers
const create = require('../../controllers/contact/create');
const getByAccount = require('../../controllers/contact/getByAccount');
const getContact = require('../../controllers/contact/getall');
const delContact = require('../../controllers/contact/delete');


//routes
router.post('/contact', create)
router.get('/contact/account/:id', getByAccount);
router.get('/contact/', getContact)
router.delete('/contact/:id', delContact)



module.exports = router;