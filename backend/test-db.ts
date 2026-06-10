import mongoose from 'mongoose';
import * as dotenv from 'dotenv';

dotenv.config();

async function check() {
  await mongoose.connect(process.env.MONGODB_URI as string);
  const collections = await mongoose.connection.db.collections();
  for (const c of collections) {
    const count = await c.countDocuments();
    console.log(`Collection ${c.collectionName}: ${count} documents`);
  }
  
  // Show one Result document if exists
  const results = await mongoose.connection.db.collection('results').find().limit(1).toArray();
  console.log('Result sample:', results[0]);
  process.exit(0);
}
check().catch(console.error);
