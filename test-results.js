const mongoose = require('mongoose');
const { Result, Participant } = require('./backend/dist/db/models');
const dotenv = require('dotenv');

dotenv.config({ path: './backend/.env' });

async function check() {
  await mongoose.connect(process.env.MONGODB_URI);
  const results = await Result.find().lean();
  console.log('Results count:', results.length);
  if (results.length > 0) {
    console.log('Sample result:', results[0]);
    const participant = await Participant.findById(results[0].participantId).lean();
    console.log('Matching participant found:', !!participant);
  }
  process.exit(0);
}
check();
