const request = require('supertest');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const { MongoMemoryServer } = require('mongodb-memory-server');

jest.mock('../../services/imageKit.service.js', () => ({
    uploadImage: jest.fn(async () => ({ url: 'https://ik.mock/x', thumbnail: 'https://ik.mock/t', id: 'file_x' })),
}));

const app = require('../../app');
const Product = require('../../models/product.model');

describe('GET /api/products/seller (SELLER)', () => {
    let mongo;
    let sellerId1;
    let sellerId2;

    const signToken = (id, role = 'seller') => jwt.sign({ id, role }, process.env.JWT_SECRET);

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
            .get('/api/products/seller');
        expect(res.status).toBe(401);
    });

    it('requires seller role (403) when role is not seller', async () => {
        const prod = await createProduct();
        const token = signToken(sellerId1.toHexString(), 'user');
        const res = await request(app)
            .get('/api/products/seller')
            .set('Authorization', `Bearer ${token}`);
        expect(res.status).toBe(403);
    });

    it('list only products owned by the authenticated seller', async () => {
        await createProduct({ title: 'Seller1 Product 1', seller: sellerId1 });
        await createProduct({ title: 'Seller1 Product 2', seller: sellerId1 });
        await createProduct({ title: 'Seller2 Product', seller: sellerId2 });

        const token = signToken(sellerId1.toHexString(), 'seller');
        const res = await request(app)
            .get('/api/products/seller')
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(res.body.data).toHaveLength(2);
        res.body.data.forEach(p => expect(p.seller).toBe(sellerId1.toHexString()));
    });

    it('supports pagination with skip and limit', async () => {
        await Promise.all([
            createProduct({ title: 'Product 1', seller: sellerId1 }),
            createProduct({ title: 'Product 2', seller: sellerId1 }),
            createProduct({ title: 'Product 3', seller: sellerId1 }),
            createProduct({ title: 'Product 4', seller: sellerId1 }),
        ]);
        const token = signToken(sellerId1.toHexString(), 'seller');

        let res = await request(app)
            .get('/api/products/seller')
            .set('Authorization', `Bearer ${token}`)
            .query({ limit: '2' });
        expect(res.status).toBe(200);
        expect(res.body.data.length).toBe(2);

        res = await request(app)
            .get('/api/products/seller')
            .set('Authorization', `Bearer ${token}`)
            .query({ skip: '2', limit: '2' })
        expect(res.status).toBe(200);
        expect(res.body.data.length).toBe(2);
    });
});
