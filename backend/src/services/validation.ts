import { RegistrationInput } from '../types';

export interface ValidationResult {
  valid: boolean;
  errors: Record<string, string>;
}

export function validateRegistration(input: Partial<RegistrationInput>): ValidationResult {
  const errors: Record<string, string> = {};

  if (!input.name || input.name.trim().length === 0) {
    errors.name = 'Name is required';
  } else if (input.name.trim().length < 2) {
    errors.name = 'Name must be at least 2 characters';
  }

  if (!input.class || input.class.trim().length === 0) {
    errors.class = 'Class is required';
  }

  if (!input.batchType || !['JUNIOR', 'SENIOR'].includes(input.batchType)) {
    errors.batchType = 'Batch type must be JUNIOR or SENIOR';
  }

  if (input.gender !== undefined && !['MALE', 'FEMALE'].includes(input.gender)) {
    errors.gender = 'Gender must be MALE or FEMALE';
  }

  if (!input.guardianName || input.guardianName.trim().length === 0) {
    errors.guardianName = 'Guardian name is required';
  }

  if (!input.address || input.address.trim().length === 0) {
    errors.address = 'Address is required';
  }

  if (!input.mobileNumber || input.mobileNumber.trim().length === 0) {
    errors.mobileNumber = 'Mobile number is required';
  } else if (!/^[6-9]\d{9}$/.test(input.mobileNumber.trim())) {
    errors.mobileNumber = 'Mobile number must be a valid 10-digit Indian mobile number';
  }

  if (input.email && input.email.trim().length > 0) {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email.trim())) {
      errors.email = 'Email must be a valid email address';
    }
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

export function validateImageFormat(mimetype: string): boolean {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  return allowedTypes.includes(mimetype);
}
