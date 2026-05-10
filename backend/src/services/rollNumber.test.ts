import { generateRollNumber, isValidRollNumber } from './rollNumber';

// generateUniqueRollNumber requires a live DB — tested via integration.
// These tests cover the pure functions only.

describe('generateRollNumber', () => {
  it('generates a 5-digit string', () => {
    const roll = generateRollNumber();
    expect(roll).toMatch(/^\d{5}$/);
  });

  it('generates numbers in the 10000–99999 range', () => {
    for (let i = 0; i < 100; i++) {
      const num = parseInt(generateRollNumber(), 10);
      expect(num).toBeGreaterThanOrEqual(10000);
      expect(num).toBeLessThanOrEqual(99999);
    }
  });
});

describe('isValidRollNumber', () => {
  it('accepts valid 5-digit roll numbers', () => {
    expect(isValidRollNumber('12345')).toBe(true);
    expect(isValidRollNumber('00001')).toBe(true);
    expect(isValidRollNumber('99999')).toBe(true);
  });

  it('rejects wrong length', () => {
    expect(isValidRollNumber('1234')).toBe(false);
    expect(isValidRollNumber('123456')).toBe(false);
    expect(isValidRollNumber('')).toBe(false);
  });

  it('rejects non-numeric values', () => {
    expect(isValidRollNumber('1234a')).toBe(false);
    expect(isValidRollNumber('abcde')).toBe(false);
  });
});
