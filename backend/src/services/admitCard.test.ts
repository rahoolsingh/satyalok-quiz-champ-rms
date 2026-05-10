import { generateAdmitCardData, generateAdmitCardHtml } from './admitCard';
import { Participant } from '../types';

function makeParticipant(overrides: Partial<Participant> = {}): Participant {
  return {
    id: 'test-uuid',
    rollNumber: '12345',
    name: 'Priya Patel',
    class: 'Class 6',
    batchType: 'JUNIOR',
    guardianName: 'Suresh Patel',
    address: '456 Park Road',
    mobileNumber: '9876543210',
    paymentStatus: 'COMPLETED',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

describe('generateAdmitCardData', () => {
  it('generates admit card with all required fields', () => {
    const p = makeParticipant();
    const card = generateAdmitCardData(p);
    expect(card.rollNumber).toBe('12345');
    expect(card.name).toBe('Priya Patel');
    expect(card.class).toBe('Class 6');
    expect(card.batchType).toBe('JUNIOR');
    expect(card.guardianName).toBe('Suresh Patel');
    expect(card.mobileNumber).toBe('9876543210');
    expect(card.eventName).toBe('Quiz Champ 2026');
    expect(card.generatedAt).toBeDefined();
  });

  it('throws when participant has no roll number', () => {
    const p = makeParticipant({ rollNumber: null });
    expect(() => generateAdmitCardData(p)).toThrow();
  });
});

describe('generateAdmitCardHtml', () => {
  it('includes the event name in HTML output', () => {
    const p = makeParticipant();
    const card = generateAdmitCardData(p);
    const html = generateAdmitCardHtml(card);
    expect(html).toContain('Quiz Champ 2026');
  });

  it('includes the roll number in HTML output', () => {
    const p = makeParticipant();
    const card = generateAdmitCardData(p);
    const html = generateAdmitCardHtml(card);
    expect(html).toContain('12345');
  });

  it('includes participant name in HTML output', () => {
    const p = makeParticipant();
    const card = generateAdmitCardData(p);
    const html = generateAdmitCardHtml(card);
    expect(html).toContain('Priya Patel');
  });

  it('includes batch type in HTML output', () => {
    const p = makeParticipant();
    const card = generateAdmitCardData(p);
    const html = generateAdmitCardHtml(card);
    expect(html).toContain('JUNIOR');
  });
});
