const request = require('supertest');
const app = require('../src/app');
const connectDB = require('../src/db/db');
const userModel = require('../src/models/user.model');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

describe('GET /api/auth/me', () => {
    beforeAll(async () => {
        await connectDB();
    });

    it('returns 401 when no token cookie is present', async () => {
        const res = await request(app).get('/api/auth/me');
        expect(res.status).toBe(401);
    });

    it('returns 401 when token is invalid/expired', async () => {
        const fakeToken = jwt.sign({ id: '00000000000000000000' }, 'wrong_secrete');
        const res = await request(app)
            .get('/api/auth/me')
            .set('Cookie', [`token=${fakeToken}`]);

        expect(res.status).toBe(401);
    });

    it('returns current user when valid token cookie is provided (200)', async () => {
        const password = 'Secrete123';
        const hash = await bcrypt.hash(password, 10);

        const user = await userModel.create({
            username: 'me_user',
            email: 'me_user@example.com',
            password: hash,
            fullName: { firstName: 'Me', lastName: 'User' },
        });

        const token = jwt.sign(
            { id: user._id, email:user.email }, 
            process.env.JWT_SECRETE || 'test_jwt_secrete', {
            expiresIn: '1h',
        });

        const res = await request(app)
            .get('/api/auth/me')
            .set('Cookie', [`token=${token};`]);

        expect(res.status).toBe(200);
        expect(res.body.user).toBeDefined();
        expect(res.body.user.email).toBe(user.email);
        expect(res.body.user.password).toBeUndefined();
    });

});
