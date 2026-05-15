"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const rollNumber_1 = require("./rollNumber");
// generateUniqueRollNumber requires a live DB — tested via integration.
// These tests cover the pure functions only.
describe('generateRollNumber', () => {
    it('generates a 5-digit string', () => {
        const roll = (0, rollNumber_1.generateRollNumber)();
        expect(roll).toMatch(/^\d{5}$/);
    });
    it('generates numbers in the 10000–99999 range', () => {
        for (let i = 0; i < 100; i++) {
            const num = parseInt((0, rollNumber_1.generateRollNumber)(), 10);
            expect(num).toBeGreaterThanOrEqual(10000);
            expect(num).toBeLessThanOrEqual(99999);
        }
    });
});
describe('isValidRollNumber', () => {
    it('accepts valid 5-digit roll numbers', () => {
        expect((0, rollNumber_1.isValidRollNumber)('12345')).toBe(true);
        expect((0, rollNumber_1.isValidRollNumber)('00001')).toBe(true);
        expect((0, rollNumber_1.isValidRollNumber)('99999')).toBe(true);
    });
    it('rejects wrong length', () => {
        expect((0, rollNumber_1.isValidRollNumber)('1234')).toBe(false);
        expect((0, rollNumber_1.isValidRollNumber)('123456')).toBe(false);
        expect((0, rollNumber_1.isValidRollNumber)('')).toBe(false);
    });
    it('rejects non-numeric values', () => {
        expect((0, rollNumber_1.isValidRollNumber)('1234a')).toBe(false);
        expect((0, rollNumber_1.isValidRollNumber)('abcde')).toBe(false);
    });
});
//# sourceMappingURL=rollNumber.test.js.map