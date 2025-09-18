const request = require('supertest');
const app = require('../src/app');
const connectDB = require('../src/db/db');
const userModel = require('../src/models/user.model');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

describe('GET /api/auth/logout', () => {
    beforeAll(async () => {
        await connectDB();
    });

    // const token = jwt.sign({ id: user._id }, process.env.JWT_SECRETE || 'test_jwt_secrete', {
    //     expiresIn: '1h',
    // });


    it('clears token cookie and returns 200 when token present', async () => {
        const password = 'Secrete123';
        const hash = await bcrypt.hash(password, 10);

        await userModel.create({
            username: 'logout_user',
            email: 'logout_user@example.com',
            password: hash,
            fullName: { firstName: 'Logout', lastName: 'User' },
        });


        const loginRes = await request(app)
            .post('/api/auth/login')
            .send({ email: 'logout_user@example.com', password });

        expect(loginRes.status).toBe(200);
        const cookies = loginRes.headers['set-cookie'];
        expect(cookies).toBeDefined();

        const res = await request(app)
            .get('/api/auth/logout')
            .set('Cookie', cookies);

        expect(res.status).toBe(200);
        const setCookie = res.headers['set-cookie']
        const cookieStr = setCookie.join(';');

        expect(cookieStr).toMatch(/token=;/);
        expect(cookieStr.toLowerCase()).toMatch(/expires=/)
    });

    it('is idempotent and returns 200 when no token present', async () => {
        const res = await request(app).get('/api/auth/logout');
        expect(res.status).toBe(200);
    });
});
