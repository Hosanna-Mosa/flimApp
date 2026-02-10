const crypto = require('crypto');

const PREFIX = 'enc_v1:';
let warnedMissingKey = false;
let warnedInvalidKey = false;

const normalizeKey = (raw) => {
  if (!raw) return null;

  const trimmed = String(raw).trim();
  let keyBuf = null;

  // Hex-encoded 32 bytes (64 hex chars)
  if (/^[0-9a-fA-F]{64}$/.test(trimmed)) {
    keyBuf = Buffer.from(trimmed, 'hex');
  } else {
    // Base64 or UTF-8
    try {
      const b64 = Buffer.from(trimmed, 'base64');
      if (b64.length === 32) {
        keyBuf = b64;
      }
    } catch (_) {
      // fall through
    }
    if (!keyBuf) {
      keyBuf = Buffer.from(trimmed, 'utf8');
    }
  }

  if (keyBuf.length !== 32) {
    return null;
  }

  return keyBuf;
};

const getKey = () => normalizeKey(process.env.MESSAGE_ENCRYPTION_KEY);

const isEncrypted = (value) => typeof value === 'string' && value.startsWith(PREFIX);

const encryptMessage = (plaintext) => {
  if (plaintext == null) return plaintext;
  if (isEncrypted(plaintext)) return plaintext;

  const key = getKey();
  if (!key) {
    if (!warnedMissingKey) {
      warnedMissingKey = true;
      console.warn('[MessageCrypto] MESSAGE_ENCRYPTION_KEY missing or invalid; storing plaintext.');
    }
    return plaintext;
  }

  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const ciphertext = Buffer.concat([cipher.update(String(plaintext), 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();

  return `${PREFIX}${iv.toString('base64')}:${tag.toString('base64')}:${ciphertext.toString('base64')}`;
};

const decryptMessage = (value) => {
  if (value == null) return value;
  if (!isEncrypted(value)) return value;

  const key = getKey();
  if (!key) {
    if (!warnedMissingKey) {
      warnedMissingKey = true;
      console.warn('[MessageCrypto] MESSAGE_ENCRYPTION_KEY missing or invalid; returning ciphertext.');
    }
    return value;
  }

  const payload = value.slice(PREFIX.length);
  const parts = payload.split(':');
  if (parts.length !== 3) return value;

  try {
    const [ivB64, tagB64, ctB64] = parts;
    const iv = Buffer.from(ivB64, 'base64');
    const tag = Buffer.from(tagB64, 'base64');
    const ciphertext = Buffer.from(ctB64, 'base64');

    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(tag);
    const plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
    return plaintext.toString('utf8');
  } catch (err) {
    if (!warnedInvalidKey) {
      warnedInvalidKey = true;
      console.warn('[MessageCrypto] Failed to decrypt message. Check MESSAGE_ENCRYPTION_KEY.');
    }
    return value;
  }
};

module.exports = {
  encryptMessage,
  decryptMessage,
  isEncrypted,
};
