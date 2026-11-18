const mongoose = require('mongoose');
const dns = require('dns');

// Use reliable DNS servers to avoid querySrv ECONNREFUSED issues on Windows/ISPs
try {
  dns.setServers(['8.8.8.8', '8.8.4.4']);
} catch (e) {}

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/petzone';

const connectDB = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('🍃 MongoDB Connected Successfully');
  } catch (err) {
    console.error('❌ MongoDB Connection Error:', err);
    process.exit(1);
  }
};

module.exports = connectDB;
