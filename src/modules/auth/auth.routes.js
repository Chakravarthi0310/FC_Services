const express = require('express');
const validate = require('../../common/middleware/validate');
const authValidation = require('./auth.validation');
const authController = require('./auth.controller');
const { authLimiter } = require('../../common/middleware/rateLimiter');

const router = express.Router();

router.post('/register', authLimiter, validate(authValidation.register), authController.register);
router.post('/login', authLimiter, validate(authValidation.login), authController.login);

module.exports = router;
