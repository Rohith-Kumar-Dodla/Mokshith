import dotenv from 'dotenv';
import { connectDatabase, disconnectDatabase } from '../config/database.js';
import User from '../models/User.js';

dotenv.config();

const seedUsers = async () => {
  try {
    await connectDatabase();
    console.log('Database connected successfully');

    // Super Admin credentials from environment
    const superAdminEmail = process.env.SUPER_ADMIN_EMAIL || 'superadmin@mokshith.com';
    const superAdminPassword = process.env.SUPER_ADMIN_PASSWORD || 'SuperAdmin@123';
    const superAdminPhone = process.env.SUPER_ADMIN_PHONE || '+919999999999';

    // Admin credentials from environment
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@mokshith.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@123';
    const adminPhone = process.env.ADMIN_PHONE || '+919888888888';

    // Default Vendor credentials from environment
    const vendorEmail = process.env.DEFAULT_VENDOR_EMAIL || 'vendor@mokshith.com';
    const vendorPassword = process.env.DEFAULT_VENDOR_PASSWORD || 'Vendor@123';
    const vendorPhone = process.env.DEFAULT_VENDOR_PHONE || '+919877777777';

    // Default Delivery credentials from environment
    const deliveryEmail = process.env.DEFAULT_DELIVERY_EMAIL || 'delivery@mokshith.com';
    const deliveryPassword = process.env.DEFAULT_DELIVERY_PASSWORD || 'Delivery@123';
    const deliveryPhone = process.env.DEFAULT_DELIVERY_PHONE || '+919866666666';

    // Check if Super Admin already exists
    const existingSuperAdmin = await User.findOne({ email: superAdminEmail });
    if (existingSuperAdmin) {
      console.log('Super Admin already exists, skipping creation');
    } else {
      await User.create({
        name: 'Super Admin',
        email: superAdminEmail,
        phone: superAdminPhone,
        password: superAdminPassword,
        role: 'superadmin',
        status: 'active',
        isVerified: true,
      });
      console.log('Super Admin created successfully');
    }

    // Check if Admin already exists
    const existingAdmin = await User.findOne({ email: adminEmail });
    if (existingAdmin) {
      console.log('Admin already exists, skipping creation');
    } else {
      await User.create({
        name: 'Admin',
        email: adminEmail,
        phone: adminPhone,
        password: adminPassword,
        role: 'admin',
        status: 'active',
        isVerified: true,
      });
      console.log('Admin created successfully');
    }

    // Check if Default Vendor already exists
    const existingVendor = await User.findOne({ email: vendorEmail });
    if (existingVendor) {
      console.log('Default Vendor already exists, skipping creation');
    } else {
      await User.create({
        name: 'Default Vendor',
        email: vendorEmail,
        phone: vendorPhone,
        password: vendorPassword,
        role: 'vendor',
        status: 'active',
        isVerified: true,
      });
      console.log('Default Vendor created successfully');
    }

    // Check if Default Delivery already exists
    const existingDelivery = await User.findOne({ email: deliveryEmail });
    if (existingDelivery) {
      console.log('Default Delivery already exists, skipping creation');
    } else {
      await User.create({
        name: 'Default Delivery',
        email: deliveryEmail,
        phone: deliveryPhone,
        password: deliveryPassword,
        role: 'delivery',
        status: 'active',
        isVerified: true,
      });
      console.log('Default Delivery created successfully');
    }

    console.log('Seed data completed successfully');
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  } finally {
    await disconnectDatabase();
    console.log('Database disconnected');
    process.exit(0);
  }
};

seedUsers();
