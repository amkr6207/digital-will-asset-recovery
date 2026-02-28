require('dotenv').config();

const app = require('./app');
const env = require('./config/env');
const connectDB = require('./config/db');

connectDB()
  .then(() => {
    app.listen(env.PORT, () => {
      console.log(`Server running on port ${env.PORT}`);
    });
  })
  .catch((error) => {
    console.error('Failed to connect DB', error);
    process.exit(1);
  });
