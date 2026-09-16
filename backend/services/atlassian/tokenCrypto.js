/**
 * AES-256-GCM Token Encryption & Decryption Utility
 */
const crypto = require('crypto');
const config = require('../../config/env');

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

function getEncryptionKey() {
  const rawKey = config.ATLASSIAN_TOKEN_ENCRYPTION_KEY || 'default_secret_key_32_bytes_len!!';
  // Ensure key is 32 bytes for aes-256-gcm
  return crypto.createHash('sha256').update(String(rawKey)).digest();
}

/**
 * Encrypts token string using AES-256-GCM
 * Returns string in format: iv:authTag:encryptedText (hex)
 */
function encryptToken(text) {
  if (!text) return '';
  const iv = crypto.randomBytes(IV_LENGTH);
  const key = getEncryptionKey();
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');
  
  return `${iv.toString('hex')}:${authTag}:${encrypted}`;
}

/**
 * Decrypts AES-256-GCM encrypted token string
 */
function decryptToken(encryptedData) {
  if (!encryptedData) return '';
  try {
    const parts = encryptedData.split(':');
    if (parts.length !== 3) {
      // If legacy or unencrypted string in fallback, return as is
      return encryptedData;
    }
    const iv = Buffer.from(parts[0], 'hex');
    const authTag = Buffer.from(parts[1], 'hex');
    const encryptedText = parts[2];
    const key = getEncryptionKey();

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error) {
    console.error('Token decryption failed:', error.message);
    throw new Error('FAILED_TO_DECRYPT_TOKEN');
  }
}

module.exports = {
  encryptToken,
  decryptToken
};
