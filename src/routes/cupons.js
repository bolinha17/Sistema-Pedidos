const express = require('express');
const router = express.Router();
const { postCupom, getCupons } = require('../controllers/cupomController');

router.post('/', postCupom);
router.get('/', getCupons);

module.exports = router;
