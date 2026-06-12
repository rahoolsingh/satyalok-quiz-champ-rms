import { validateRegistration, validateImageFormat } from './validation';

describe('validateRegistration', () => {
  const validInput = {
    name: 'Arjun Sharma',
    class: 'Class 8',
    batchType: 'SENIOR' as const,
    gender: 'MALE' as const,
    guardianName: 'Ramesh Sharma',
    address: '123 Main Street, Delhi',
    mobileNumber: '9876543210',
    questionPaperLanguage: 'ENGLISH' as const,
  };

  it('accepts a fully valid registration', () => {
    const result = validateRegistration(validInput);
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual({});
  });

  it('rejects missing name', () => {
    const result = validateRegistration({ ...validInput, name: '' });
    expect(result.valid).toBe(false);
    expect(result.errors.name).toBeDefined();
  });

  it('rejects missing class', () => {
    const result = validateRegistration({ ...validInput, class: '' });
    expect(result.valid).toBe(false);
    expect(result.errors.class).toBeDefined();
  });

  it('rejects missing guardianName', () => {
    const result = validateRegistration({ ...validInput, guardianName: '' });
    expect(result.valid).toBe(false);
    expect(result.errors.guardianName).toBeDefined();
  });

  it('rejects missing address', () => {
    const result = validateRegistration({ ...validInput, address: '' });
    expect(result.valid).toBe(false);
    expect(result.errors.address).toBeDefined();
  });

  it('rejects missing mobileNumber', () => {
    const result = validateRegistration({ ...validInput, mobileNumber: '' });
    expect(result.valid).toBe(false);
    expect(result.errors.mobileNumber).toBeDefined();
  });

  it('rejects invalid mobile number format', () => {
    const result = validateRegistration({ ...validInput, mobileNumber: '1234567890' });
    expect(result.valid).toBe(false);
    expect(result.errors.mobileNumber).toBeDefined();
  });

  it('rejects mobile number that is too short', () => {
    const result = validateRegistration({ ...validInput, mobileNumber: '98765432' });
    expect(result.valid).toBe(false);
    expect(result.errors.mobileNumber).toBeDefined();
  });

  it('rejects invalid batchType', () => {
    const result = validateRegistration({ ...validInput, batchType: 'INVALID' as never });
    expect(result.valid).toBe(false);
    expect(result.errors.batchType).toBeDefined();
  });

  it('rejects invalid gender', () => {
    const result = validateRegistration({ ...validInput, gender: 'OTHER' as never });
    expect(result.valid).toBe(false);
    expect(result.errors.gender).toBeDefined();
  });

  it('accepts missing gender', () => {
    const result = validateRegistration({ ...validInput, gender: undefined });
    expect(result.valid).toBe(true);
    expect(result.errors.gender).toBeUndefined();
  });

  it('accepts valid optional email', () => {
    const result = validateRegistration({ ...validInput, email: 'test@example.com' });
    expect(result.valid).toBe(true);
  });

  it('rejects invalid email format', () => {
    const result = validateRegistration({ ...validInput, email: 'not-an-email' });
    expect(result.valid).toBe(false);
    expect(result.errors.email).toBeDefined();
  });

  it('accepts empty email (optional field)', () => {
    const result = validateRegistration({ ...validInput, email: '' });
    expect(result.valid).toBe(true);
  });

  it('collects multiple errors at once', () => {
    const result = validateRegistration({ batchType: 'JUNIOR' });
    expect(result.valid).toBe(false);
    expect(Object.keys(result.errors).length).toBeGreaterThan(1);
  });
});

describe('validateImageFormat', () => {
  it('accepts JPEG', () => expect(validateImageFormat('image/jpeg')).toBe(true));
  it('accepts JPG', () => expect(validateImageFormat('image/jpg')).toBe(true));
  it('accepts PNG', () => expect(validateImageFormat('image/png')).toBe(true));
  it('accepts WebP', () => expect(validateImageFormat('image/webp')).toBe(true));
  it('rejects PDF', () => expect(validateImageFormat('application/pdf')).toBe(false));
  it('rejects GIF', () => expect(validateImageFormat('image/gif')).toBe(false));
  it('rejects plain text', () => expect(validateImageFormat('text/plain')).toBe(false));
});
