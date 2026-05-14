const crypto = require('crypto');

// Base32
// Needed because authenticator apps expect secrets in base32
function base32Encode(buffer) {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let result = '';
  let bits = 0;
  let value = 0;

  for (const byte of buffer) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      result += alphabet[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) {
    result += alphabet[(value << (5 - bits)) & 31];
  }
  return result;
}

function base32Decode(secret) {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let bits = 0;
  let value = 0;
  const output = [];

  for (const char of secret.toUpperCase().replace(/=+$/, '')) {
    const idx = alphabet.indexOf(char);
    if (idx === -1) throw new Error('Invalid base32 character');
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      output.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  return Buffer.from(output);
}

// secret generation
function generateSecret() {
  const buffer = crypto.randomBytes(20); // 160 bits
  return base32Encode(buffer);
}

// TOTP
function generateTOTP(secret, window = 0) {
  // Get current 30-second time window
  const timeStep = Math.floor(Date.now() / 1000 / 30) + window;

  // Convert time to 8-byte big-endian buffer
  const timeBuffer = Buffer.alloc(8);
  let time = timeStep;
  for (let i = 7; i >= 0; i--) {
    timeBuffer[i] = time & 0xff;
    time = Math.floor(time / 256);
  }

  // HMAC-SHA1 the time buffer using the decoded secret
  const key = base32Decode(secret);
  const hmac = crypto.createHmac('sha1', key).update(timeBuffer).digest();

  // Dynamic truncation - extract 4 bytes starting at offset
  const offset = hmac[hmac.length - 1] & 0xf;
  const code = (
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff)
  ) % 1000000;

  // Pad to 6 digits
  return code.toString().padStart(6, '0');
}

// Verify
// Check current window and ±1 to allow for clock drift
function verifyTOTP(secret, token) {
  for (let window = -1; window <= 1; window++) {
    if (generateTOTP(secret, window) === token) return true;
  }
  return false;
}

// QR code URL
// This is the standard otpauth format authenticator apps expect
function generateOtpAuthUrl(secret, username, issuer = 'TutorBlog') {
  return `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(username)}?secret=${secret}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=6&period=30`;
}
module.exports = { generateSecret, generateTOTP, verifyTOTP, generateOtpAuthUrl };