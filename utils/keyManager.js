const { webcrypto } = require('crypto');

const crypto = webcrypto;

// Generate X25519 key pair (for key exchange scenarios)
async function generateX25519KeyPair() {
  return crypto.subtle.generateKey('X25519', false, ['deriveKey']);
}

// Derive a shared AES-GCM key from X25519 key pair + HKDF
// (used for key-exchange flows, not needed for simple DB encryption)
async function deriveSharedKey({ privateKey, publicKey, salt }) {
  // Step 1: raw X25519 shared secret
  const rawSharedKey = await crypto.subtle.deriveKey(
    { name: 'X25519', public: publicKey },
    privateKey,
    { name: 'HKDF', length: 256 }, 
    false,
    ['deriveKey']
  );

  // Step 2: stretch with HKDF into an AES-GCM key
  const hkdfParams = {
    name: 'HKDF',
    hash: 'SHA-256',
    salt,
    info: new TextEncoder().encode('shared transport encryption key'),
  };

  return crypto.subtle.deriveKey(
    hkdfParams,
    rawSharedKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

// Random 32-byte salt (used when deriving a key from a password)
function generateSalt() {
  return crypto.getRandomValues(new Uint8Array(32));
}

// Random 12-byte IV for AES-GCM
function generateIV() {
  return crypto.getRandomValues(new Uint8Array(12));
}

module.exports = {
  crypto,
  generateX25519KeyPair,
  deriveSharedKey,
  generateSalt,
  generateIV,
};