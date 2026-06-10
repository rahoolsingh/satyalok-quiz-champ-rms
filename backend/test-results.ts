import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import { Result } from './src/db/models/result.model';
import { Participant } from './src/db/models/participant.model';

dotenv.config();

async function check() {
  await mongoose.connect(process.env.MONGODB_URI as string);
  const results = await Result.find().lean();
  console.log('Results count:', results.length);
  if (results.length > 0) {
    console.log('Sample result:', results[0]);
    const participant = await Participant.findById(results[0].participantId).lean();
    console.log('Matching participant found:', !!participant);
  }
  process.exit(0);
}
check().catch(console.error);
