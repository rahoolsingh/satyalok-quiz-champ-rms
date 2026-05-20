import jwt from 'jsonwebtoken';

const SESSION_EXPIRY_SECONDS = 30 * 24 * 60 * 60; // 30 days

function getSecret(): string {
  const secret = process.env.SESSION_JWT_SECRET;
  if (!secret) throw new Error('SESSION_JWT_SECRET environment variable is not set');
  return secret;
}

export interface SessionPayload {
  sub: string; // mobile number
  iat: number;
  exp: number;
}

/**
 * Signs a short-lived JWT session token for a verified mobile number.
 */
export function signSessionToken(mobileNumber: string): string {
  return jwt.sign({ sub: mobileNumber }, getSecret(), {
    expiresIn: SESSION_EXPIRY_SECONDS,
  });
}

/**
 * Verifies a session token and returns the payload.
 * Throws if the token is invalid or expired.
 */
export function verifySessionToken(token: string): SessionPayload {
  return jwt.verify(token, getSecret()) as SessionPayload;
}
