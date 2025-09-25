const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const { uploadImage } = require('../../services/imageKit.service');

jest.mock('../../services/imageKit.service.js', () => ({
  uploadImage: jest.fn(async () => ({ url: 'https://ik.mock/x', thumbnail: '' }))
}));

const app = require('../../app');
const Product = require('../../models/product.model');

describe('GET /api/products', () => {
  let mongo;

  beforeAll(async () => {
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

  afterEach(async () => {
    const collections = await mongoose.connection.db.collections();
    for (const c of collections) await c.deleteMany({});
  });

  const createProduct = (overrides = {}) => {
    return Product.create({
      title: overrides.title ?? 'sample product',
      description: overrides.description ?? 'A great product',
      price: overrides.price ?? { amount: 100, currency: 'USD' },
      seller: overrides.seller ?? new mongoose.Types.ObjectId(),
      images: overrides.images ?? []
    });
  };

  it('returns empty list when no products exist', async () => {
    const res = await request(app).get('/api/products');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body?.data)).toBe(true);
    expect(res.body.data.length).toBe(0);
  });

  it('returns all products', async () => {
    await Promise.all([
      createProduct({ title: 'p1' }),
      createProduct({ title: 'p2' }),
      createProduct({ title: 'p3' })
    ]);

    const res = await request(app).get('/api/products');
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(3);
  });

  it('supports text search via a q parameter', async () => {
    await Promise.all([
      createProduct({ title: 'Red Shirt', description: 'cotton' }),
      createProduct({ title: 'Blue Shirt', description: 'Wool' }),
      createProduct({ title: 'Grey Pant', description: 'Linen' })
    ]);

    const res = await request(app).get('/api/products').query({ q: 'shirt' });
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(2);
  });

  it('filters by minprice and maxprice', async () => {
    await Promise.all([
      createProduct({ title: 'Low', price: { amount: 50, currency: 'USD' } }),
      createProduct({ title: 'Mid', price: { amount: 100, currency: 'USD' } }),
      createProduct({ title: 'High', price: { amount: 150, currency: 'USD' } })
    ]);

    const res = await request(app)
      .get('/api/products')
      .query({ minprice: 60, maxprice: 120 });

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(1);
  });

  it('supports skip and limit', async () => {
    await Promise.all([
      createProduct({ title: 'P1' }),
      createProduct({ title: 'P2' }),
      createProduct({ title: 'P3' })
    ]);

    const res = await request(app)
      .get('/api/products')
      .query({ skip: 1, limit: 1 });

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(1);
  });
});
