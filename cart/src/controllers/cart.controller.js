const cartModel = require('../models/cart.model');

async function addItemToCart(req, res){

    const { productId, qty } = req.body;

    const user = req.user 

    let cart = await cartModel.findOne({ user: user._id});

    if(!cart){
        cart = new cartModel({ user: user._id, items: [] });
    } 

    const existingItemIndex = cart.items.findIndex(item => item.productId.toSring() === productId)

    if(existingItemIndex >= 0){
        cart.items[existingItemIndex].quantity += qty;
    }
    else{
        cart.items.push({ productId, quantity: qty})
    }

    await cart.save();

    req.status(200).json({
        message:"Item added to cart",
        cart
    });
}

module.exports = {
    addItemToCart
}