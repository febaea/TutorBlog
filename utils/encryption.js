const { crypto, generateSalt, generateIV } = require('./keyManager');

//ENCRYPTION_KEY in .env is base64-encoded 32-byte random value.
//generate with node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
const SECRET_KEY = process.env.ENCRYPTION_KEY;

if (!SECRET_KEY) {
  throw new Error('ENCRYPTION_KEY environment variable is not set');
}

//derive an AES-256-GCM key from the secret using PBKDF2 + a given salt.
//new random salt generated when encryption called
async function deriveKey(salt) {
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    Buffer.from(SECRET_KEY, 'base64'), // treat env var as raw base64 key material
    'PBKDF2',
    false,
    ['deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,                // random per-value salt (stored alongside ciphertext)
      iterations: 100_000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

// Encrypt any JS value (string, object, number, etc.)
// Returns a single base64 string: [salt (32B)] + [iv (12B)] + [ciphertext]
// Store this directly in a single TEXT column in Postgres.
async function encrypt(data) {
  const salt = generateSalt(); // 32 bytes
  const iv = generateIV();     // 12 bytes
  const key = await deriveKey(salt);

  const encoded = new TextEncoder().encode(JSON.stringify(data));

  const encryptedBuffer = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoded
  );

  // Combine salt + iv + ciphertext into one buffer for easy DB storage
  const combined = Buffer.concat([
    Buffer.from(salt),
    Buffer.from(iv),
    Buffer.from(encryptedBuffer),
  ]);

  return combined.toString('base64');
}

// Decrypt a value produced by encrypt() above.
// Pass the raw base64 string from your DB column.
// Returns the original JS value (string, object, etc.)
async function decrypt(encryptedBase64) {
  const combined = Buffer.from(encryptedBase64, 'base64');

  // Slice out the three parts based on their fixed lengths
  const salt = combined.subarray(0, 32);        // bytes 0–31
  const iv = combined.subarray(32, 44);          // bytes 32–43
  const ciphertext = combined.subarray(44);      // bytes 44+

  const key = await deriveKey(salt);

  const decryptedBuffer = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    ciphertext
  );

  const decoded = new TextDecoder().decode(decryptedBuffer);
  return JSON.parse(decoded);
}

module.exports = { encrypt, decrypt };