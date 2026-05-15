export interface SessionPayload {
    sub: string;
    iat: number;
    exp: number;
}
/**
 * Signs a short-lived JWT session token for a verified mobile number.
 */
export declare function signSessionToken(mobileNumber: string): string;
/**
 * Verifies a session token and returns the payload.
 * Throws if the token is invalid or expired.
 */
export declare function verifySessionToken(token: string): SessionPayload;
//# sourceMappingURL=sessionToken.d.ts.map