import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'crypto';

// Encryption key MUST come from the environment. No insecure fallback key.
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || process.env.JWT_SECRET;

if (!ENCRYPTION_KEY || ENCRYPTION_KEY === 'humail_eli_secret_key_2026') {
  // Fails loudly outside tests; never silently uses a known key.
  if (process.env.NODE_ENV === 'production') {
    throw new Error('ENCRYPTION_KEY must be set (and not the default) in production.');
  } else if (process.env.NODE_ENV !== 'test') {
    console.warn('⚠️ Using weak/default encryption key. Set ENCRYPTION_KEY environment variable for production.');
  }
}

// Derive the key from the secret using a stable, per-deployment stored salt.
// The salt below is a compile-time constant ONLY used to derive the key; the
// per-message IV (random) is what protects individual ciphertexts (see encryptText).
const KEY_SALT = 'humail-eli-static-key-salt-v1';
function deriveKey(secret: string): Buffer {
  return scryptSync(secret, KEY_SALT, 32);
}

const KEY = deriveKey(ENCRYPTION_KEY || 'fallback-key-change-me');

/**
 * Encrypts text using AES-256-GCM with a random IV.
 * Layout: base64( iv(12) + authTag(16) + ciphertext )
 * The IV is random per call (GCM does not need a salt here).
 */
export function encryptText(text: string): string {
  if (text === undefined || text === null) {
    throw new Error('encryptText: input must be a string');
  }
  const iv = randomBytes(12); // 12 bytes recommended for GCM
  const cipher = createCipheriv('aes-256-gcm', KEY, iv);
  let encrypted = cipher.update(String(text), 'utf8', 'base64');
  encrypted += cipher.final('base64');
  const authTag = cipher.getAuthTag();
  const combined = Buffer.concat([iv, authTag, Buffer.from(encrypted, 'base64')]);
  return combined.toString('base64');
}

/**
 * Decrypts a text encrypted with encryptText.
 * Guards against malformed/truncated/legacy-plaintext input so a single bad
 * stored value can never crash the caller (e.g. API-key load, login).
 */
export function decryptText(encryptedBase64: string): string {
  if (typeof encryptedBase64 !== 'string' || encryptedBase64.length === 0) {
    throw new Error('decryptText: input must be a non-empty base64 string');
  }

  let combined: Buffer;
  try {
    combined = Buffer.from(encryptedBase64, 'base64');
  } catch {
    throw new Error('decryptText: invalid base64 input');
  }

  // 12 (iv) + 16 (authTag) minimum
  if (combined.length < 28) {
    throw new Error('decryptText: ciphertext too short');
  }

  const iv = combined.slice(0, 12);
  const authTag = combined.slice(12, 28);
  const ciphertext = combined.slice(28);

  try {
    const decipher = createDecipheriv('aes-256-gcm', KEY, iv);
    decipher.setAuthTag(authTag);
    let decrypted = decipher.update(ciphertext, undefined, 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (err) {
    throw new Error(`decryptText failed: ${(err as Error).message}`);
  }
}
