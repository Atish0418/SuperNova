const mongoose = require('mongoose');

module.exports = async () => {
  try {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
    if (global.__MONGOSERVER__) {
      await global.__MONGOSERVER__.stop();
    }
  } catch (err) {
    // ignore
  }
};
