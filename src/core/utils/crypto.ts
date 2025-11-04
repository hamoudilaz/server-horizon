// src/core/utils/crypto.ts
import crypto from 'crypto';
import logger from '../../config/logger.js';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;
const KEY_BYTE_LENGTH = 32;

const encryptionKey = process.env.ENCRYPTION_KEY;

if (!encryptionKey || Buffer.from(encryptionKey, 'hex').length !== KEY_BYTE_LENGTH) {
  logger.fatal('ENCRYPTION_KEY is not defined or is not a 32-byte hex string');
  process.exit(1);
}

const key = Buffer.from(encryptionKey, 'hex');

/**
 * Encrypts plaintext using AES-256-GCM.
 * @returns A string formatted as "iv:authTag:encryptedData"
 */
export function encrypt(text: string): string {
  try {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
    const authTag = cipher.getAuthTag();

    // Store as hex string with delimiters
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`;
  } catch (err) {
    logger.error({ err }, 'Encryption failed');
    throw new Error('Encryption failed');
  }
}

/**
 * Decrypts an AES-256-GCM encrypted string.
 * Expects "iv:authTag:encryptedData" format.
 */
export function decrypt(encryptedText: string): string {
  try {
    const parts = encryptedText.split(':');
    if (parts.length !== 3) {
      throw new Error('Invalid encrypted text format');
    }

    const [ivHex, authTagHex, encryptedDataHex] = parts;
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const encrypted = Buffer.from(encryptedDataHex, 'hex');

    if (iv.length !== IV_LENGTH || authTag.length !== AUTH_TAG_LENGTH) {
      throw new Error('Invalid encrypted component lengths');
    }

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
    return decrypted.toString('utf8');
  } catch (err) {
    // This will fail if the key is wrong or data is tampered with
    logger.error({ err }, 'Decryption failed. Key may be wrong or data corrupted.');
    throw new Error('Decryption failed');
  }
}
