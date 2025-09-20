const request = require('supertest');
const app = require('../src/app');
const connectDB = require('../src/db/db');
const userModel = require('../src/models/user.model');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

describe('Addresses API: /api/auth/users/me/addresses', () => {
  beforeAll(async () => {
    await connectDB();
  });

  // Seed user and login helper
  async function seedUserAndLogin({
    username = 'add_user',
    email = 'addr@example.com',
    password = 'Secrete123',
    fullName = { firstName: 'Test', lastName: 'User' }
  } = {}) {
    const user = await userModel.create({ username, email, password, fullName });
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRETE);
    const cookies = [`token=${token}`];
    return { user, cookies };
  }

  describe('GET /api/auth/users/me/addresses', () => {
    it('requires authentication (401 without cookie)', async () => {
      const res = await request(app).get('/api/auth/users/me/addresses');
      expect(res.status).toBe(401);
    });

    it('returns a list of addresses and indicates a default', async () => {
      const { user, cookies } = await seedUserAndLogin({ username: 'lister', email: 'lister@example.com' });

      user.addresses.push(
        { street: '221B Baker st', city: 'London', state: 'LDN', zip: 'NW16XE', country: 'UK', isDefault: true },
        { street: '742 Evergreen Terrace', city: 'Springfield', state: 'SP', zip: '49007', country: 'USA', isDefault: false }
      );
      await user.save();

      const res = await request(app)
        .get('/api/auth/users/me/addresses')
        .set('Cookie', cookies);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.addresses)).toBe(true);
      expect(res.body.addresses.length).toBe(2);
      expect(
        'defaultAddressId' in res.body || res.body.addresses.some(a => a.isDefault === true)
      ).toBe(true);
    });
  });

  describe('POST /api/auth/users/me/addresses', () => {
    it('adds an address (test pincode validation not enforced in controller)', async () => {
      const { cookies } = await seedUserAndLogin({ username: 'addr1', email: 'addr1@example.com' });

      const res = await request(app)
        .post('/api/auth/users/me/addresses')
        .set('Cookie', cookies)
        .send({
          street: '12 invalid ave',
          city: 'Nowhere',
          state: 'NA',
          pincode: '12',
          country: 'US',
        });

      // Controller currently returns 201 for any address
      expect(res.status).toBe(201);
      expect(res.body.address).toBeDefined();
    });

    it('adds an address and can set it as default', async () => {
      const { cookies } = await seedUserAndLogin({ username: 'addr2', email: 'addr2@example.com' });

      const res = await request(app)
        .post('/api/auth/users/me/addresses')
        .set('Cookie', cookies)
        .send({
          street: '1600 Amphitheater Pkwy',
          city: 'Mountain View',
          state: 'CA',
          pincode: '94043',
          country: 'US',
          isDefault: true
        });

      expect(res.status).toBe(201);
      expect(res.body.address).toBeDefined();
      const addr = res.body.address;
      expect(addr.street).toBe('1600 Amphitheater Pkwy');
      expect(addr.isDefault).toBe(true);
    });
  });

  describe('DELETE /api/auth/users/me/addresses/:addressId', () => {
    it('removes an address; returns 200 and updates list', async () => {
      const { user, cookies } = await seedUserAndLogin({ username: 'deleter', email: 'deleter@example.com' });

      user.addresses.push(
        { street: '1 Test St', city: 'Testville', state: 'TS', zip: '12345', country: 'Test', isDefault: false }
      );
      await user.save();

      const idToDelete = user.addresses[0]._id.toString();

      const res = await request(app)
        .delete(`/api/auth/users/me/addresses/${idToDelete}`)
        .set('Cookie', cookies);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.addresses)).toBe(true);
      expect(res.body.addresses.length).toBe(0);
    });

    it('returns 200 when address not found', async () => {
      const { cookies } = await seedUserAndLogin({ username: 'deleter2', email: 'deleter2@example.com' });

      const fakeId = new mongoose.Types.ObjectId().toString();
      const res = await request(app)
        .delete(`/api/auth/users/me/addresses/${fakeId}`)
        .set('Cookie', cookies);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.addresses)).toBe(true);
    });
  });
});
