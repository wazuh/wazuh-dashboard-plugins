import assert from 'node:assert/strict';
import * as crypto from 'node:crypto';
import {
  ApiKeyCipher,
  isEncrypted,
  isLegacyV1Encrypted,
  parseEncryptionKey,
} from './api-key-cipher';

// A valid 32-byte key, base64-encoded (32 raw ASCII bytes -> base64), as config would supply it.
const RAW_KEY = Buffer.from('a'.repeat(32), 'utf8');
const KEY_B64 = RAW_KEY.toString('base64');

const PROVIDER_ID_A = 'provider-aaaaaaaa-1111-2222-3333-444444444444';
const PROVIDER_ID_B = 'provider-bbbbbbbb-5555-6666-7777-888888888888';

/** Hand-builds an `enc:v1:` blob exactly the way the pre-v2 `ApiKeyCipher.encrypt` used to: plain
 * AES-256-GCM, fresh random IV, NO `setAAD` call. Used to exercise the "v1 stays readable
 * forever" and "v1 -> v2 upgrade" paths without depending on any encrypt() call ever having
 * produced v1 output (it no longer does). */
function buildLegacyV1Blob(key: Buffer, plaintext: string): string {
  const iv = crypto.randomBytes(12);
  const rawCipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const ciphertext = Buffer.concat([
    rawCipher.update(plaintext, 'utf8'),
    rawCipher.final(),
  ]);
  const authTag = rawCipher.getAuthTag();
  return `enc:v1:${Buffer.concat([iv, authTag, ciphertext]).toString(
    'base64',
  )}`;
}

test('v2 round-trip: encrypt then decrypt with the SAME saved object id returns the original plaintext', () => {
  const key = parseEncryptionKey(KEY_B64);
  assert.ok(
    key,
    'expected parseEncryptionKey to return a Buffer for a valid 32-byte key',
  );
  const cipher = new ApiKeyCipher(key);
  const plaintext = 'sk-super-secret-api-key-12345';
  const ciphertext = cipher.encrypt(plaintext, PROVIDER_ID_A);
  assert.ok(
    ciphertext.startsWith('enc:v2:'),
    'encrypt() must always produce enc:v2: output',
  );
  const decrypted = cipher.decrypt(ciphertext, PROVIDER_ID_A);
  assert.equal(decrypted, plaintext);
});

test('v2 ciphertext format: enc:v2: prefix, differs from plaintext, fresh IV per call', () => {
  const key = parseEncryptionKey(KEY_B64);
  const cipher = new ApiKeyCipher(key);
  const plaintext = 'my-api-key-value';
  const c1 = cipher.encrypt(plaintext, PROVIDER_ID_A);
  const c2 = cipher.encrypt(plaintext, PROVIDER_ID_A);

  assert.ok(
    c1.startsWith('enc:v2:'),
    'ciphertext must start with enc:v2: prefix',
  );
  assert.notEqual(c1, plaintext, 'ciphertext must differ from the plaintext');
  assert.notEqual(
    c1,
    c2,
    'two encryptions of the same plaintext must differ (fresh IV each time)',
  );
});

test('v2 SUBSTITUTION ATTACK: ciphertext bound to provider id A fails to decrypt as provider id B', () => {
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
    'decrypting a v2 blob under the WRONG saved object id must throw (GCM AAD mismatch)',
  );

  // Sanity: the same ciphertext still decrypts correctly under its OWN, correct id.
  assert.equal(cipher.decrypt(ciphertext, PROVIDER_ID_A), plaintext);
});

test('v1 blob still decrypts (no AAD involved) and is not itself an enc:v2: value', () => {
  const key = parseEncryptionKey(KEY_B64);
  assert.ok(key);
  const cipher = new ApiKeyCipher(key);

  const plaintext = 'sk-legacy-v1-key';
  const v1Blob = buildLegacyV1Blob(key, plaintext);

  assert.ok(
    isLegacyV1Encrypted(v1Blob),
    'hand-built blob should be recognized as legacy v1',
  );
  assert.ok(
    !v1Blob.startsWith('enc:v2:'),
    'a v1 blob must never be mistaken for enc:v2:',
  );

  // decrypt() must still recover the plaintext -- the savedObjectId argument is required but
  // unused for v1 (no AAD to check), so ANY id here must produce the same, correct result.
  assert.equal(cipher.decrypt(v1Blob, PROVIDER_ID_A), plaintext);
  assert.equal(cipher.decrypt(v1Blob, PROVIDER_ID_B), plaintext);
});

test('tamper (v2): flipping a char in the ciphertext body throws on decrypt (GCM auth tag)', () => {
  const key = parseEncryptionKey(KEY_B64);
  const cipher = new ApiKeyCipher(key);
  const ciphertext = cipher.encrypt('a value worth protecting', PROVIDER_ID_A);

  const body = ciphertext.slice('enc:v2:'.length);
  // Flip one base64 character in the middle of the payload (IV/authTag/ciphertext all live here).
  const idx = Math.floor(body.length / 2);
  const original = body[idx];
  const replacement = original === 'A' ? 'B' : 'A';
  const tamperedBody = body.slice(0, idx) + replacement + body.slice(idx + 1);
  const tampered = `enc:v2:${tamperedBody}`;

  assert.throws(
    () => cipher.decrypt(tampered, PROVIDER_ID_A),
    /.+/,
    'decrypt of tampered v2 ciphertext must throw, not return garbage',
  );
});

test('tamper (v1): flipping a char in the ciphertext body throws on decrypt (GCM auth tag)', () => {
  const key = parseEncryptionKey(KEY_B64);
  assert.ok(key);
  const cipher = new ApiKeyCipher(key);

  const v1Blob = buildLegacyV1Blob(key, 'a legacy value');

  const body = v1Blob.slice('enc:v1:'.length);
  const idx = Math.floor(body.length / 2);
  const original = body[idx];
  const replacement = original === 'A' ? 'B' : 'A';
  const tamperedBody = body.slice(0, idx) + replacement + body.slice(idx + 1);
  const tampered = `enc:v1:${tamperedBody}`;

  assert.throws(
    () => cipher.decrypt(tampered, PROVIDER_ID_A),
    /.+/,
    'decrypt of tampered v1 ciphertext must throw, not return garbage',
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

test('isEncrypted: true for both enc:v1: and enc:v2:-prefixed strings, false otherwise', () => {
  assert.equal(isEncrypted('enc:v1:abcdef=='), true);
  assert.equal(isEncrypted('enc:v2:abcdef=='), true);
  assert.equal(isEncrypted('plain-api-key'), false);
  assert.equal(isEncrypted(''), false);
  assert.equal(isEncrypted(undefined), false);
});

test('isLegacyV1Encrypted: true only for enc:v1:, false for enc:v2: and plaintext', () => {
  assert.equal(isLegacyV1Encrypted('enc:v1:abcdef=='), true);
  assert.equal(isLegacyV1Encrypted('enc:v2:abcdef=='), false);
  assert.equal(isLegacyV1Encrypted('plain-api-key'), false);
  assert.equal(isLegacyV1Encrypted(''), false);
  assert.equal(isLegacyV1Encrypted(undefined), false);
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

test('decrypt throws when ciphertext is enc:v2: but cipher has no key configured', () => {
  const key = parseEncryptionKey(KEY_B64);
  const enabledCipher = new ApiKeyCipher(key);
  const ciphertext = enabledCipher.encrypt('some-key', PROVIDER_ID_A);

  const disabledCipher = new ApiKeyCipher(undefined);
  assert.throws(() => disabledCipher.decrypt(ciphertext, PROVIDER_ID_A));
});

test('decrypt throws when ciphertext is enc:v1: but cipher has no key configured', () => {
  const key = parseEncryptionKey(KEY_B64);
  assert.ok(key);
  const v1Blob = buildLegacyV1Blob(key, 'some-key');

  const disabledCipher = new ApiKeyCipher(undefined);
  assert.throws(() => disabledCipher.decrypt(v1Blob, PROVIDER_ID_A));
});

test('v1 -> v2 upgrade-on-write: decrypt(v1) then encrypt(v2, id) yields a v2 blob decrypting to the same plaintext', () => {
  const key = parseEncryptionKey(KEY_B64);
  assert.ok(key);
  const cipher = new ApiKeyCipher(key);

  const plaintext = 'sk-being-upgraded-from-v1';
  const v1Blob = buildLegacyV1Blob(key, plaintext);

  // Mirrors server/routes/settings.ts PUT's upgrade-on-write branch: decrypt the v1 value (no id
  // needed), then re-encrypt the recovered plaintext as v2 bound to the provider's real id.
  const recoveredPlaintext = cipher.decrypt(v1Blob, PROVIDER_ID_A);
  assert.equal(recoveredPlaintext, plaintext);

  const upgraded = cipher.encrypt(recoveredPlaintext, PROVIDER_ID_A);
  assert.ok(upgraded.startsWith('enc:v2:'), 'upgraded value must be enc:v2:');
  assert.equal(cipher.decrypt(upgraded, PROVIDER_ID_A), plaintext);
  // And the upgraded blob is now properly bound -- it must NOT decrypt under a different id.
  assert.throws(() => cipher.decrypt(upgraded, PROVIDER_ID_B));
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
