const express = require('express');
const sessionController = require('../../controllers/session.controller');

const router = express.Router();

router.get('/start', sessionController.startSession);

module.exports = router;
