const request = require('supertest');
const express = require('express');
const bodyParser = require('body-parser');
const multer = require('multer');

jest.mock('../src/tests/fixtures/product.post.test.js', () => ({
  uploadImage: jest.fn(async ({ buffer, filename }) => ({
    url: `https://cdn.example.com/${filename || 'image'}`,
    thumbnail: `https://cdn.example.com/thumb-${filename || 'image'}`,
    id: `id-${Math.random().toString(36).slice(2,8)}`,
  }))
}));

jest.mock('../../src/models/product.model', () => ({
  create: jest.fn(async (data) => ({
    _id: 'prod_123',
    ...data
  }))
}));

const { uploadImage } = require('../../src/services/imageKit.service');
const Product = require('../../src/models/product.model');
const productController = require('../../src/controllers/product.controller');

function authStub(req, res, next){
  req.user = { id: 'seller_1', role: 'seller' };
  next();
}

const app = express();
const upload = multer({ storage: multer.memoryStorage() });
app.use(bodyParser.json());
app.post('/api/products', authStub, upload.array('images', 5), productController.createProduct);

describe('POST /api/products', () => {
  test('creates a product (happy path) with images', async () => {
    const res = await request(app)
      .post('/api/products')
      .field('title', 'Test product')
      .field('description', 'A nice product')
      .field('priceAmount', '99.99')
      .attach('images', Buffer.from('fake-image-1'), 'img1.jpg')
      .attach('images', Buffer.from('fake-image-2'), 'img2.jpg');

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('message', 'Product created');
    expect(res.body).toHaveProperty('data');
    const data = res.body.data;
    expect(data.title).toBe('Test product');
    expect(data.seller).toBe('seller_1');
    expect(Array.isArray(data.images)).toBe(true);

    expect(uploadImage).toHaveBeenCalledTimes(2);
    expect(Product.create).toHaveBeenCalledTimes(1);
  });

  test('returns 400 when required fields missing', async () => {
    const res = await request(app)
      .post('/api/products')
      .field('description', 'missing title and price');

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('message');
  });
});
