import { RegistrationInput } from '../types';
export interface ValidationResult {
    valid: boolean;
    errors: Record<string, string>;
}
export declare function validateRegistration(input: Partial<RegistrationInput>): ValidationResult;
export declare function validateImageFormat(mimetype: string): boolean;
//# sourceMappingURL=validation.d.ts.map