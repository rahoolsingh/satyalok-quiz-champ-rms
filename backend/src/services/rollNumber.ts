import { Participant } from '../db/models';

export function generateRollNumber(): string {
  const num = Math.floor(Math.random() * 90000) + 10000;
  return String(num);
}

export async function generateUniqueRollNumber(maxAttempts = 10): Promise<string> {
  for (let i = 0; i < maxAttempts; i++) {
    const rollNumber = generateRollNumber();
    const existing = await Participant.findOne({ rollNumber });
    if (!existing) return rollNumber;
  }
  throw new Error('Failed to generate unique roll number after maximum attempts');
}

export function isValidRollNumber(rollNumber: string): boolean {
  return /^\d{5}$/.test(rollNumber);
}
