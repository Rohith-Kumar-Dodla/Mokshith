/**
 * Backfills user.phone from mobile and removes a stale unique index on phone.
 * Run once if registrations fail with "Duplicate value for field: phone".
 *
 * Usage: node scripts/fixUserPhoneIndex.js
 */
import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config();

const run = async () => {
  if (!process.env.MONGO_URI) {
    throw new Error('MONGO_URI is required');
  }

  await mongoose.connect(process.env.MONGO_URI);
  const collection = mongoose.connection.collection('users');

  const backfill = await collection.updateMany(
    {
      $or: [{ phone: { $exists: false } }, { phone: null }, { phone: '' }],
      mobile: { $exists: true, $ne: '' },
    },
    [{ $set: { phone: '$mobile' } }]
  );

  console.log(`Backfilled phone from mobile for ${backfill.modifiedCount} user(s).`);

  const indexes = await collection.indexes();
  const phoneIndexes = indexes.filter(
    (index) => index.key?.phone === 1 && index.unique
  );

  for (const index of phoneIndexes) {
    await collection.dropIndex(index.name);
    console.log(`Dropped unique index on phone: ${index.name}`);
  }

  if (phoneIndexes.length === 0) {
    console.log('No unique index on phone found (nothing to drop).');
  }

  await mongoose.disconnect();
  console.log('Done.');
};

run().catch(async (error) => {
  console.error('fixUserPhoneIndex failed:', error.message);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
