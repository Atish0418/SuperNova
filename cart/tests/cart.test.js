const request = require('supertest');
const app = require('../src/app');

// NOTE: These tests are skeletons. You'll need to implement mocks for product/stock
// services and the cart model persistence (e.g. in-memory or mocked DB) before
// they become green. Each test includes TODO comments where you'll wire mocks.

describe('Cart API', () => {

    beforeEach(() => {
        store.reset();
    })

    describe('GET /api/cart', () => {
        it('returns empty cart initially', async () => {
            const res = await request(app).get('/cart');
            expect(res.status).toBe(200);
            expect(res.body).toEqual({ items: [], subTotal: 0, currrncy: 'USD'});
        });
    });

    describe('POST/api/cart/items', () => {
        it('adds first item to cart', async () => {

            const res = await withAuth(request(app))
                 .post('api/cart/items')
                 .send({ productId: 'prod-1', qty: 2 })
            expect(res.status).toBe(201);
            expect(res.body.items).toHaveLength(1);
            expect(res.body.items[ 0 ]).toMatchObject({ product })
            expect(res.body.subTotal).toBeGreaterThanOrEqual(0);
        });

        it('validates missing productId', async () => {
            const res = await request(app)
                 .post('/cart/items')
                 .send({ qty: 1 });
            expect(res.status).toBe(400);
            expect(res.body.error).toMatch(/producId/i);
        });

        it('validates missing qty', async () =>{

        });

        it('rejects non-positive qty', async () =>{

        });
    });

    describe('PATCH/api/cart/items/:productId', () => {
        it('updates quantity and returns updated totals', async () => {
            // TODO: create existing cart state with product in it
            // TODO: mock product service availability/pricing

            const productId = 'prod-1';
            const payload = { qty: 3 };
            const res = await request(app).patch(`/cart/items/${productId}`).send(payload).expect(200);

            expect(res.body).toHaveProperty('items');
            const item = res.body.items.find(i => i.productId === productId);
            expect(item).toBeTruthy();
            expect(item.qty).toBe(payload.qty);
            expect(res.body).toHaveProperty('totals');
        });

        it('removes item when qty <= 0 and returns totals', async () => {
            const productId = 'prod-1';
            const payload = { qty: 0 };

            const res = await request(app).patch(`/cart/items/${productId}`).send(payload).expect(200);

            expect(res.body).toHaveProperty('items');
            const item = res.body.items.find(i => i.productId === productId);
            expect(item).toBeUndefined();
            expect(res.body).toHaveProperty('totals');
        });
    });

    describe('DELETE/api/cart/items/:productId', () => {
        it('removes the product line and returns updated totals', async () => {
            const productId = 'prod-1';

            // TODO: ensure cart contains the productId before deletion
            const res = await request(app).delete(`/cart/items/${productId}`).expect(200);

            expect(res.body).toHaveProperty('items');
            expect(res.body.items.find(i => i.productId === productId)).toBeUndefined();
            expect(res.body).toHaveProperty('totals');

            // TODO: verify any stock un-reservation if applicable
        });
    });

    describe('DELETE/api/cart', () => {
        it('clears the cart and returns empty items and zero totals', async () => {
            // TODO: create a cart with items first

            const res = await request(app).delete('/cart').expect(200);

            expect(res.body).toHaveProperty('items');
            expect(Array.isArray(res.body.items)).toBe(true);
            expect(res.body.items.length).toBe(0);
            expect(res.body).toHaveProperty('totals');
            expect(res.body.totals.subTotal).toBe(0);
            expect(res.body.totals.grandTotal).toBe(0);
        });
    });

    describe('Recompute prices on GET/api/cart', () =>{
        
    })
});
