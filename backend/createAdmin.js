const path = require('path');
const dns = require('dns');
try { dns.setServers(['8.8.8.8', '8.8.4.4']); } catch (e) {}
require('dotenv').config({ path: path.join(__dirname, '.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Admin = require('./models/Admin');

const createAdmin = async () => {
  const args = process.argv.slice(2);
  const email = args[0];
  const password = args[1];
  const name = args[2] || 'Admin';

  if (!email || !password) {
    console.log('⚠️  Usage: node createAdmin.js <email> <password> [name]');
    console.log('👉 Example: node createAdmin.js admin2@gmail.com 12345678 "Admin 2"');
    process.exit(1);
  }

  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/petzone';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB...');

    const existingAdmin = await Admin.findOne({ email });
    const hashedPassword = await bcrypt.hash(password, 10);

    if (existingAdmin) {
      existingAdmin.password = hashedPassword;
      existingAdmin.name = name;
      await existingAdmin.save();
      console.log(`✅ Admin "${email}" updated with new password!`);
      console.log(`   👤 Name:     ${existingAdmin.name}`);
      console.log(`   📧 Email:    ${existingAdmin.email}`);
      console.log(`   🔑 Password: ${password}`);
      process.exit(0);
    }

    const newAdmin = await Admin.create({
      email,
      password: hashedPassword,
      name,
    });

    console.log('✅ New Admin created successfully!');
    console.log(`   👤 Name:     ${newAdmin.name}`);
    console.log(`   📧 Email:    ${newAdmin.email}`);
    console.log(`   🔑 Password: ${password}`);
    process.exit(0);
  } catch (err) {
    console.error('❌ Error creating admin:', err.message);
    process.exit(1);
  }
};

createAdmin();
