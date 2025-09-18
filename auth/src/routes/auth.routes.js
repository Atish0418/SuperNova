const express = require('express');
const validators = require('../middlewares/validator.middleware');
const authController = require('../controllers/auth.controller')
const authMiddleWare = require('../middlewares/auth.middleware');

const router = express.Router();

// POST /api/auth/register
router.post('/register', 
    validators.registerUserValidations, 
    authController.registerUser
);

// POST /api/auth/login
router.post('/login',
    validators.loginUserValidations,
    authController.loginUser
);

// GET /api/auth/me
router.get('/me',
    authMiddleWare.authMiddleWare,
    authController.getCurrentUser);

module.exports = router ;
