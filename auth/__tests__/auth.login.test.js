const request = require('supertest');
const app = require('../src/app');
const connectDB = require('../src/db/db');
const bcrypt = require('bcryptjs');
const userModel = require('../src/models/user.model');

describe('POST /api/auth/login', () => {
  beforeAll(async () => {
    await connectDB();
  });

  const userPayload = {
    username: 'test_user',
    email: 'test_user@example.com',
    password: 'Password123!',
    fullName: { firstName: 'Test', lastName: 'User' },
  };

  async function register() {
    return await request(app).post('/api/auth/register').send(userPayload);
  }

  it('logs in successfully with correct credentials and sets token cookie', async () => {
    
    const password = 'Secrete123';
    const hash = await bcrypt.hash(password, 10);

    await userModel.create({
        username:'john_doe',
        email:'johnd@example.com',
        password:hash,
        fullName:{firstName:'john', lastName:'doe'}
    });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email:'johnd@example.com', password});

    expect(res.status).toBe(200);
    expect(res.body.user).toBeDefined();
    expect(res.body.user.email).toBe('johnd@example.com');
    // expect(res.body.user.password).toBeUndefined();

    // supertest exposes cookies via header 'set-cookie'
    const setCookie = res.headers['set-cookie'];
    expect(setCookie).toBeDefined();
    expect(setCookie.join(';')).toMatch(/token=/);
  });

  it('rejects login with wrong password (401)', async () => {

    const password = "Secrete123";
    const hash = await bcrypt.hash(password, 10);

    await userModel.create({
        username:"jack_smith",
        email:"jack@example.com",
        password:hash,
        fullName:{firstName:"jack", lastName:"smith"}
    })

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email:"jack@example.com", password:"wrongPass1!" });

    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Invalid credentials')
  });

  it('validates missing fields with 400', async () => {
    const res = await request(app)
        .post('/api/auth/login')
        .send({});

    expect(res.status).toBe(400);
    expect((res.body.errors)).toBeDefined();
  });
});
