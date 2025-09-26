const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

const app = require('../../app');
const Product = require('../../models/product.model');

describe('GET /api/products/:id', () => {
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

  it('returns 200 and the product when id exists', async () => {
    const created = await createProduct({ title: 'ById Product' });

    const res = await request(app).get(`/api/products/${created._id}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('product');
    expect(res.body.product.title).toBe('ById Product');
  });

  it('returns 404 when product not found', async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const res = await request(app).get(`/api/products/${fakeId}`);
    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('message', 'Product not found');
  });
});
