const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongo;

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  const uri = mongo.getUri();

  process.env.MONGO_URI = uri;
  process.env.JWT_SECRETE = "test_jwt_secrete";
  // Ensure tests do not connect to production Redis
  process.env.USE_REDIS_MOCK = 'true';

  await mongoose.connect(uri);
});

afterEach(async () => {
  const collections = await mongoose.connection.db.collections();
  for(let collection of collections){
    await collection.deleteMany({})
  }
});

afterAll(async()=>{
    await mongoose.connection.close();
    if(mongo) await mongo.stop();
})

