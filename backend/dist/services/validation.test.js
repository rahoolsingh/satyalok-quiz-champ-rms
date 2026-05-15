"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const validation_1 = require("./validation");
describe('validateRegistration', () => {
    const validInput = {
        name: 'Arjun Sharma',
        class: 'Class 8',
        batchType: 'SENIOR',
        guardianName: 'Ramesh Sharma',
        address: '123 Main Street, Delhi',
        mobileNumber: '9876543210',
    };
    it('accepts a fully valid registration', () => {
        const result = (0, validation_1.validateRegistration)(validInput);
        expect(result.valid).toBe(true);
        expect(result.errors).toEqual({});
    });
    it('rejects missing name', () => {
        const result = (0, validation_1.validateRegistration)({ ...validInput, name: '' });
        expect(result.valid).toBe(false);
        expect(result.errors.name).toBeDefined();
    });
    it('rejects missing class', () => {
        const result = (0, validation_1.validateRegistration)({ ...validInput, class: '' });
        expect(result.valid).toBe(false);
        expect(result.errors.class).toBeDefined();
    });
    it('rejects missing guardianName', () => {
        const result = (0, validation_1.validateRegistration)({ ...validInput, guardianName: '' });
        expect(result.valid).toBe(false);
        expect(result.errors.guardianName).toBeDefined();
    });
    it('rejects missing address', () => {
        const result = (0, validation_1.validateRegistration)({ ...validInput, address: '' });
        expect(result.valid).toBe(false);
        expect(result.errors.address).toBeDefined();
    });
    it('rejects missing mobileNumber', () => {
        const result = (0, validation_1.validateRegistration)({ ...validInput, mobileNumber: '' });
        expect(result.valid).toBe(false);
        expect(result.errors.mobileNumber).toBeDefined();
    });
    it('rejects invalid mobile number format', () => {
        const result = (0, validation_1.validateRegistration)({ ...validInput, mobileNumber: '1234567890' });
        expect(result.valid).toBe(false);
        expect(result.errors.mobileNumber).toBeDefined();
    });
    it('rejects mobile number that is too short', () => {
        const result = (0, validation_1.validateRegistration)({ ...validInput, mobileNumber: '98765432' });
        expect(result.valid).toBe(false);
        expect(result.errors.mobileNumber).toBeDefined();
    });
    it('rejects invalid batchType', () => {
        const result = (0, validation_1.validateRegistration)({ ...validInput, batchType: 'INVALID' });
        expect(result.valid).toBe(false);
        expect(result.errors.batchType).toBeDefined();
    });
    it('accepts valid optional email', () => {
        const result = (0, validation_1.validateRegistration)({ ...validInput, email: 'test@example.com' });
        expect(result.valid).toBe(true);
    });
    it('rejects invalid email format', () => {
        const result = (0, validation_1.validateRegistration)({ ...validInput, email: 'not-an-email' });
        expect(result.valid).toBe(false);
        expect(result.errors.email).toBeDefined();
    });
    it('accepts empty email (optional field)', () => {
        const result = (0, validation_1.validateRegistration)({ ...validInput, email: '' });
        expect(result.valid).toBe(true);
    });
    it('collects multiple errors at once', () => {
        const result = (0, validation_1.validateRegistration)({ batchType: 'JUNIOR' });
        expect(result.valid).toBe(false);
        expect(Object.keys(result.errors).length).toBeGreaterThan(1);
    });
});
describe('validateImageFormat', () => {
    it('accepts JPEG', () => expect((0, validation_1.validateImageFormat)('image/jpeg')).toBe(true));
    it('accepts JPG', () => expect((0, validation_1.validateImageFormat)('image/jpg')).toBe(true));
    it('accepts PNG', () => expect((0, validation_1.validateImageFormat)('image/png')).toBe(true));
    it('accepts WebP', () => expect((0, validation_1.validateImageFormat)('image/webp')).toBe(true));
    it('rejects PDF', () => expect((0, validation_1.validateImageFormat)('application/pdf')).toBe(false));
    it('rejects GIF', () => expect((0, validation_1.validateImageFormat)('image/gif')).toBe(false));
    it('rejects plain text', () => expect((0, validation_1.validateImageFormat)('text/plain')).toBe(false));
});
//# sourceMappingURL=validation.test.js.map