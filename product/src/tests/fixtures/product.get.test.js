const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const { uploadImage } = require('../../services/imageKit.service');

jest.mock('../../services/imageKit.service.js', ()=>({
    uploadImage: jest.fn(async ()=> ({ url: 'https://ik.mock/x', thumbnail:''}))
}));

const app = require('../../app');
const Product = require('../../models/product.model');

describe('GET /api/products', ()=>{
    let mongo;

    beforeAll(async () =>{
        mongo = await MongoMemoryServer.create();
        const uri = mongo.getUri();
        process.env.MONGODB_URI = uri;
        await mongoose.connect(uri);
        await Product.syncIndexes();
    });

    afterAll(async () => {
        await mongoose.connection.dropDatabase();
        await mongoose.connection.close();
        await mongo.stop();
    });

    afterEach(async ()=>{
        const collections = await mongoose.connection.db.collections();
        for(const c of collections) await c.deleteMany({});
    });

    const createProduct = (overrides = {}) => {
        return Product.create({
            title: overrides.title ?? 'sample product',
            description: overrides.description ?? 'A greate product',
            price: overrides.prce ?? {amount:100, currency: 'USD'},
            seller: overrides.seller ?? new mongoose.Types.ObjectId();
            images: overrides.images ?? []
        });
    };

    it('retuns empty list when no products exist', async ()=>{
        const res = await request(app).get('/api/products');
        expect(res.status).toBe(200);
        expect(Array.isArray(res.body?.data)).toBe(true);
        expect(res.body.data.length).toBe(0);
    });
})