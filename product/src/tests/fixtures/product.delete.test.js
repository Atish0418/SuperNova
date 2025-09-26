const request = require('supertest');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const { MongoMemoryServer } = require('mongodb-memory-server');

jest.mock('../../services/imageKit.service.js', () => ({
    uploadImage: jest.fn(async () => ({url: 'https://ik.mock/x',thumbnail: 'https://ik.mock/t',id: 'file_x',})),
}));

const app = require('../../app');
const Product = require('../../models/product.model');

describe('DELETE /api/products/:id (SELLER)', () => {
    let mongo;
    let sellerId1;
    let sellerId2;

    const signToken = (id, role = 'seller') =>
        jwt.sign({ id, role }, process.env.JWT_SECRET);

    beforeAll(async () => {
        mongo = await MongoMemoryServer.create();
        const uri = mongo.getUri();
        process.env.MONGODB_URI = uri;
        process.env.JWT_SECRET = process.env.JWT_SECRET || 'testsecret';
        await mongoose.connect(uri);
        await Product.syncIndexes();

        sellerId1 = new mongoose.Types.ObjectId();
        sellerId2 = new mongoose.Types.ObjectId();
    });

    afterAll(async () => {
        await mongoose.connection.dropDatabase();
        await mongoose.connection.close();
        await mongo.stop();
    });

    afterEach(async () => {
        const collections = await mongoose.connection.db.collections();
        for (const c of collections) await c.deleteMany({});
    });

    const createProduct = (overrides = {}) => {
        return Product.create({
            title: overrides.title ?? 'Delete Target',
            description: overrides.description ?? 'To be deleted',
            price: overrides.price ?? { amount: 10, currency: 'USD' },
            seller: overrides.seller ?? sellerId1,
            images: overrides.images ?? []
        });
    };

    it('requires authentication (401) when no token provided', async () => {
        const prod = await createProduct();
        const res = await request(app)
            .delete(`/api/products/${prod._id}`);
        expect(res.status).toBe(401);
    });

    it('requires seller role (403) when role is not seller', async () => {
        const prod = await createProduct();
        const token = signToken(sellerId1.toHexString(), 'user');
        const res = await request(app)
            .delete(`/api/products/${prod._id}`)
            .set('Authorization', `Bearer ${token}`);
        expect(res.status).toBe(403);
    });

    it('requires 400 for invalid product id', async () => {
        const token = signToken(sellerId1.toHexString(), 'seller');
        const res = await request(app)
            .delete('/api/products/not-a-valid-id')
            .set('Authorization', `Bearer ${token}`);
        expect(res.status).toBe(400);
    });

    it('returns 404 when product not found', async () => {
        const token = signToken(sellerId1.toHexString(), 'seller');
        const missingId = new mongoose.Types.ObjectId().toHexString();
        const res = await request(app)
            .delete(`/api/products/${missingId}`)
            .set('Authorization', `Bearer ${token}`);
        expect(res.status).toBe(404);
    });

    it("forbids deleting another seller's product (403)", async () => {
        const prod = await createProduct({ seller: sellerId2 });
        const token = signToken(sellerId1.toHexString(), 'seller');
        const res = await request(app)
            .delete(`/api/products/${prod._id}`)
            .set('Authorization', `Bearer ${token}`);
        expect(res.status).toBe(403);
    });

    it('delete product and returns 200 with confirmation', async () => {
        const prod = await createProduct();
        const token = signToken(sellerId1.toHexString(), 'seller');
        const res = await request(app)
            .delete(`/api/products/${prod._id}`)
            .set('Authorization', `Bearer ${token}`);
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('message', 'Product deleted');
        const exists = await Product.findById(prod._id);
        expect(exists).toBeNull();
    });
});
