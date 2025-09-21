const Product = require('../models/product.model');
const { uploadImage } = require('../services/imageKit.service');

async function createProduct(req, res){
    try{
        const { title, description, priceAmount, priceCurrency = 'INR' } = req.body;

        const seller = req.user && req.user.id;

        if(!title || !priceAmount || !seller){
            return res.status(400).json({
                message: "title, priceAmount and seller are required!"
            });
        }

        const price = {
            amount: Number(priceAmount),
            currency: priceCurrency
        };

        // Upload files (if any) and collect image metadata
       const images = [];
       const files = await Promise.all((req.files || []).map(file => uploadImage({buffer:file.buffer})))

        const product = await Product.create({ title, description, price, seller, images });
        return res.status(201).json({
            message: "Product created",
            data: product
        });

    } catch(err){
        console.error('createProduct error', err);
        return res.status(500).json({ message: 'Internal server error' });
    }
}

module.exports = {
    createProduct
};