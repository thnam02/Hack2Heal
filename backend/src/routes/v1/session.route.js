const express = require('express');
const sessionController = require('../../controllers/session.controller');

const router = express.Router();

router.get('/start', sessionController.startSession);
router.post('/end', sessionController.endSession);
router.get('/check', sessionController.checkPythonScript);

module.exports = router;
