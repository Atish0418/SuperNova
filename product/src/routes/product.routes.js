const express = require('express');
const multer = require('multer');
const productController = require('../controllers/product.controller');
const createAuthMiddleware = require('../middlewares/auth.middleware');
const { createProductValidators } = require('../../validators/product.validator')

const router = express.Router();

const upload = multer({ storage: multer.memoryStorage() });

// POST /api/products/
router.post('/',
    createAuthMiddleware(['admin', 'seller']), 
    upload.array('images',5), 
    createProductValidators,
    productController.createProduct
);

// GET /api/products
router.get('/', productController.getProducts)

router.patch('/:id', createAuthMiddleware([ "seller" ]), productController.updateProduct)

router.delete('/:id', createAuthMiddleware([ "seller" ]), productController.deleteProduct)

router.get('/seller', createAuthMiddleware([ "seller" ]), productController.getProductBySeller)

// GET /api/products/:id
router.get('/:id', productController.getProductById);

module.exports = router;