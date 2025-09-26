const { mongo, default: mongoose } = require('mongoose');
const productModel = require('../models/product.model');
const Product = require('../models/product.model');
const { uploadImage } = require('../services/imageKit.service');


async function createProduct(req, res) {
    try {
        const { title, description, priceAmount, priceCurrency = 'INR' } = req.body;
        const seller = req.user.id;

        // Validation: required fields
        if (!title || !priceAmount) {
            return res.status(400).json({ message: "Title and price are required" });
        }

        const price = {
            amount: Number(priceAmount),
            currency: priceCurrency
        };

        // Upload files (if any) and collect image metadata
        const images = [];
        for (const file of (req.files || [])) {
            const uploaded = await uploadImage({ buffer: file.buffer, filename: file.originalname });
            images.push(uploaded);
        }

        const product = await Product.create({ title, description, price, seller, images });
        return res.status(201).json({
            message: "Product created",
            data: product
        });

    } catch (err) {
        console.error('createProduct error', err);
        return res.status(500).json({ message: 'Internal server error' });
    }
}

async function getProducts(req, res) {
    try {
        const { q, minprice, maxprice, skip = 0, limit = 20 } = req.query;

        const filter = {};

        if (q) {
            filter.$text = { $search: q };
        }

        if (minprice) {
            filter['price.amount'] = { ...filter['price.amount'], $gte: Number(minprice) };
        }

        if (maxprice) {
            filter['price.amount'] = { ...filter['price.amount'], $lte: Number(maxprice) };
        }

        const products = await Product.find(filter)
            .skip(Number(skip))
            .limit(Math.min(Number(limit), 20));

        return res.status(200).json({ data: products });
    } catch (err) {
        console.error('getProducts error', err);
        return res.status(500).json({ message: 'Internal server error' });
    }
}

async function getProductById(req, res){

    const { id } = req.params;

    const product = await productModel.findById(id);

    if(!product){
        return res.status(404).json({
            message:"Product not found"
        })
    }

    res.status(200).json({
        message:"Product found!",
        product:product
    })
}

async function updateProduct(req, res){

    const { id } = req.params;

    if(!mongoose.Types.ObjectId.isValid(id)){
        return res.status(400).json({
            message:"Invalid product id!"
        })
    }

    const product = await productModel.findOne({
        _id:id,
    })

    if(!product){
        return res.status(404).json({
            message:"Product not found!"
        })
    }

    if(product.seller.toString() !== req.user.id){
        return res.status(403).json({
            message:"Forbidden: You can update your own product"
        })
    }
    const allowedUpdates = [ 'title', 'description', 'price' ];
    for(const key of Object.keys(req.body)){
        if(allowedUpdates.includes(key)){
            if(key === 'price' && typeof req.body.price === 'object'){
                if(req.body.price.amount !== undefined){
                    product.price.amount = Number(req.body.price.amount);
                }
                if(req.body.price.currency !== undefined){
                    product.price.currency = req.body.price.currency;
                }
            }else{
                product[ key ] = req.body[ key ];
            }
        }
        
    }
    await product.save();
    return res.status(200).json({
        message: "Product updated",
        product
    })
}

async function deleteProduct(req, res){

    const { id } = req.params;

    if(!mongoose.Types.ObjectId.isValid(id)){
        return res.status(400).json({
            message:"Invalid product id"
        });
    };

    const product = await productModel.findOne({
        _id: id,
    });

    if(!product){
        return res.status(404).json({
            message: "Product not found!"
        });
    };

    if(product.seller.toString() !== req.user.id){
        return res.status(403).json({
            message:"Forbidden: You can only delete your own products"
        });
    };

    await productModel.findOneAndDelete({ _id: id });
    return res.status(200).json({
        message:"Product deleted"
    })

}

module.exports = {
    createProduct,
    getProducts,
    getProductById,
    updateProduct,
    deleteProduct
};