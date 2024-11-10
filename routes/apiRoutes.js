const express = require('express');
const { proxyRequest } = require('../controllers/proxyController');
const router = express.Router();

router.get('/api', proxyRequest);

module.exports = router;
