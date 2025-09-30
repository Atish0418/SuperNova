const cartModel = require('../models/cart.model');

async function addItemToCart(req, res) {

    const { productId, qty } = req.body;

    const user = req.user

    let cart = await cartModel.findOne({ user: user.id });

    if (!cart) {
        cart = new cartModel({ user: user.id, items: [] });
    }

    const existingItemIndex = cart.items.findIndex(item => item.productId.toString() === productId);

    if (existingItemIndex >= 0) {
        cart.items[ existingItemIndex ].quantity += qty;
    } else {
        cart.items.push({ productId, quantity: qty });
    }

    await cart.save();

    res.status(200).json({
        message: 'Item added to cart',
        cart,
    });

}

module.exports = {
    addItemToCart
}