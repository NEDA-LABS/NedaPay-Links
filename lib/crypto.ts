import crypto from 'crypto';

// AES-256-GCM encryption with key from env IDRX_ENC_KEY (base64 or hex or raw)
// The output format is base64-encoded string of: iv(12b) + ciphertext + authTag(16b)

function getKey(): Buffer {
  const raw = process.env.IDRX_ENC_KEY || process.env.ENCRYPTION_KEY;
  if (!raw) {
    throw new Error('Missing IDRX_ENC_KEY environment variable');
  }
  // try base64
  try {
    const buf = Buffer.from(raw, 'base64');
    if (buf.length === 32) return buf;
  } catch {}
  // try hex
  try {
    const buf = Buffer.from(raw, 'hex');
    if (buf.length === 32) return buf;
  } catch {}
  // use raw utf-8 and pad/trim to 32 bytes (not ideal, but fallback)
  const utf = Buffer.from(raw, 'utf-8');
  if (utf.length === 32) return utf;
  const out = Buffer.alloc(32);
  utf.copy(out, 0, 0, Math.min(utf.length, 32));
  return out;
}

export function encryptToBase64(plainText: string): string {
  const key = getKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const ciphertext = Buffer.concat([cipher.update(plainText, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return Buffer.concat([iv, ciphertext, authTag]).toString('base64');
}

export function decryptFromBase64(payload: string): string {
  const key = getKey();
  const buf = Buffer.from(payload, 'base64');
  const iv = buf.subarray(0, 12);
  const authTag = buf.subarray(buf.length - 16);
  const ciphertext = buf.subarray(12, buf.length - 16);
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(authTag);
  const plain = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  return plain.toString('utf8');
}
