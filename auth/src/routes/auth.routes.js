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
    authController.getCurrentUser
);

router.get('/logout',
    authController.logoutUser
);

router.get('/users/me/addresses',
    authMiddleWare.authMiddleWare,
    authController.getUserAddresses
);

router.post('/users/me/addresses',
    validators.addUserAddressValidatoins,
    authMiddleWare.authMiddleWare,
    authController.addUserAddress
)

router.delete('/users/me/addresses/:aderssId',
    authMiddleWare.authMiddleWare,
    authController.deleteUserAddress
)
module.exports = router;
