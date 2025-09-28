const { body, validatioResult} = require('express-validator');
const mongoose = require('mongoose');
const { addItemToCart } = require('../controllers/cart.controller');

function validateResult(req, res, next){
    const errors = validateResult(req);
    if(!errors.isEmpty()){
        return res.status(400).json({
            errors:errors.array()
        });
    }
    next();
}

const validateAddItemToCart = [
    body('productId')
        .isString()
        .withMessage('Product Id must be a srting')
        .custom(value => mongoose.Types.ObjectId.isValid(value))
        .withMessage('Invalid product ID format'),
    body('qty')
        .isInt({ gt:0 })
        .withMessage('Quantity must be a positive integer'),
    validateResult
        
]


module.exports  = {
    validateAddItemToCart
}