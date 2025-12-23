const express = require('express');
const authRoute = require('./modules/auth/auth.routes');

const router = express.Router();

router.use('/auth', authRoute);

router.get('/', (req, res) => {
    res.json({ message: 'Welcome to FC Services API' });
});

module.exports = router;
