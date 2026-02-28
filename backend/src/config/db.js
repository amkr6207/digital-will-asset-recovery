const mongoose = require('mongoose');
const env = require('./env');

const connectDB = async () => {
  await mongoose.connect(env.MONGO_URI, {
    autoIndex: env.NODE_ENV !== 'production',
  });

  console.log('MongoDB connected');
};

module.exports = connectDB;
