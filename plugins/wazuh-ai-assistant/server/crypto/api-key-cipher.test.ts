import assert from 'node:assert/strict';
import {
  ApiKeyCipher,
  isEncrypted,
  parseEncryptionKey,
} from './api-key-cipher';

// A valid 32-byte key, base64-encoded (32 raw ASCII bytes -> base64), as config would supply it.
const RAW_KEY = Buffer.from('a'.repeat(32), 'utf8');
const KEY_B64 = RAW_KEY.toString('base64');

const PROVIDER_ID_A = 'provider-aaaaaaaa-1111-2222-3333-444444444444';
const PROVIDER_ID_B = 'provider-bbbbbbbb-5555-6666-7777-888888888888';

test('round-trip: encrypt then decrypt with the SAME saved object id returns the original plaintext', () => {
  const key = parseEncryptionKey(KEY_B64);
  assert.ok(
    key,
    'expected parseEncryptionKey to return a Buffer for a valid 32-byte key',
  );
  const cipher = new ApiKeyCipher(key);
  const plaintext = 'sk-super-secret-api-key-12345';
  const ciphertext = cipher.encrypt(plaintext, PROVIDER_ID_A);
  assert.ok(
    ciphertext.startsWith('enc:v1:'),
    'encrypt() must always produce enc:v1: output',
  );
  const decrypted = cipher.decrypt(ciphertext, PROVIDER_ID_A);
  assert.equal(decrypted, plaintext);
});

test('ciphertext format: enc:v1: prefix, differs from plaintext, fresh IV per call', () => {
  const key = parseEncryptionKey(KEY_B64);
  const cipher = new ApiKeyCipher(key);
  const plaintext = 'my-api-key-value';
  const c1 = cipher.encrypt(plaintext, PROVIDER_ID_A);
  const c2 = cipher.encrypt(plaintext, PROVIDER_ID_A);

  assert.ok(
    c1.startsWith('enc:v1:'),
    'ciphertext must start with enc:v1: prefix',
  );
  assert.notEqual(c1, plaintext, 'ciphertext must differ from the plaintext');
  assert.notEqual(
    c1,
    c2,
    'two encryptions of the same plaintext must differ (fresh IV each time)',
  );
});

test('SUBSTITUTION ATTACK: ciphertext bound to provider id A fails to decrypt as provider id B', () => {
  const key = parseEncryptionKey(KEY_B64);
  const cipher = new ApiKeyCipher(key);
  const plaintext = 'sk-belongs-only-to-provider-a';
  const ciphertext = cipher.encrypt(plaintext, PROVIDER_ID_A);

  // Simulates copying provider A's encrypted apiKey blob into provider B's apiKey field (or any
  // other saved object) -- the whole point of the AAD binding is that this must be a hard decrypt
  // failure, not a silent success that hands provider B the wrong key.
  assert.throws(
    () => cipher.decrypt(ciphertext, PROVIDER_ID_B),
    /.+/,
    'decrypting a blob under the WRONG saved object id must throw (GCM AAD mismatch)',
  );

  // Sanity: the same ciphertext still decrypts correctly under its OWN, correct id.
  assert.equal(cipher.decrypt(ciphertext, PROVIDER_ID_A), plaintext);
});

test('tamper: flipping a char in the ciphertext body throws on decrypt (GCM auth tag)', () => {
  const key = parseEncryptionKey(KEY_B64);
  const cipher = new ApiKeyCipher(key);
  const ciphertext = cipher.encrypt('a value worth protecting', PROVIDER_ID_A);

  const body = ciphertext.slice('enc:v1:'.length);
  // Flip one base64 character in the middle of the payload (IV/authTag/ciphertext all live here).
  const idx = Math.floor(body.length / 2);
  const original = body[idx];
  const replacement = original === 'A' ? 'B' : 'A';
  const tamperedBody = body.slice(0, idx) + replacement + body.slice(idx + 1);
  const tampered = `enc:v1:${tamperedBody}`;

  assert.throws(
    () => cipher.decrypt(tampered, PROVIDER_ID_A),
    /.+/,
    'decrypt of tampered ciphertext must throw, not return garbage',
  );
});

test('NO PLAINTEXT: decrypt of a non-enc:-prefixed string throws, never returns it as a usable key', () => {
  const key = parseEncryptionKey(KEY_B64);
  const cipher = new ApiKeyCipher(key);
  const legacyPlaintext = 'sk-plain-legacy-key-not-encrypted';
  assert.throws(
    () => cipher.decrypt(legacyPlaintext, PROVIDER_ID_A),
    /not encrypted/,
    'a stored plaintext API key must be rejected, not passed through',
  );
});

test('isEncrypted: true for enc:v1:-prefixed strings, false otherwise', () => {
  assert.equal(isEncrypted('enc:v1:abcdef=='), true);
  assert.equal(isEncrypted('plain-api-key'), false);
  assert.equal(isEncrypted(''), false);
  assert.equal(isEncrypted(undefined), false);
});

test('NO PLAINTEXT: a disabled cipher (no key) refuses to encrypt and to decrypt plaintext', () => {
  const cipher = new ApiKeyCipher(undefined);
  const plaintext = 'unencrypted-key';
  assert.equal(cipher.enabled, false);
  assert.throws(
    () => cipher.encrypt(plaintext, PROVIDER_ID_A),
    /no encryptionKey is configured/,
    'encrypt without a key must throw, never write plaintext',
  );
  assert.throws(
    () => cipher.decrypt(plaintext, PROVIDER_ID_A),
    /not encrypted/,
    'a stored plaintext API key must be rejected even when the cipher is disabled',
  );
});

test('decrypt throws when ciphertext is present but cipher has no key configured', () => {
  const key = parseEncryptionKey(KEY_B64);
  const enabledCipher = new ApiKeyCipher(key);
  const ciphertext = enabledCipher.encrypt('some-key', PROVIDER_ID_A);

  const disabledCipher = new ApiKeyCipher(undefined);
  assert.throws(() => disabledCipher.decrypt(ciphertext, PROVIDER_ID_A));
});

test('parseEncryptionKey: rejects a non-32-byte key', () => {
  const tooShort = Buffer.from('short-key').toString('base64');
  assert.throws(() => parseEncryptionKey(tooShort));
});

test('parseEncryptionKey: returns undefined when no key configured', () => {
  assert.equal(parseEncryptionKey(undefined), undefined);
  assert.equal(parseEncryptionKey(''), undefined);
});

test('ApiKeyCipher constructor throws for a wrong-length key Buffer', () => {
  assert.throws(() => new ApiKeyCipher(Buffer.from('too-short')));
});
