import * as crypto from 'crypto';
import { PROVIDER_SAVED_OBJECT_TYPE } from '../../common/constants';

/**
 * Encryption-at-rest for provider API keys (`wazuh-ai-assistant-provider` saved object's `apiKey`
 * attribute — see server/saved_objects/provider-settings.ts). The saved object is never returned
 * over the public API (server/routes/settings.ts's `toSummary` only ever exposes a `hasApiKey`
 * boolean), but it IS readable in plaintext by anyone with direct `.kibana`/saved-objects index
 * access; this closes that gap using a symmetric key supplied via this plugin's own OSD config
 * (`wazuh_ai_assistant.encryptionKey` in opensearch_dashboards.yml — see server/config.ts and
 * server/plugin.ts's setup()), with zero new npm dependencies (Node's builtin `crypto` only).
 *
 * ## Wire formats
 *
 * - `enc:v1:` + base64(iv[12] ‖ authTag[16] ‖ ciphertext) — AES-256-GCM, NO additional
 *   authenticated data (AAD). A pre-release format that `encrypt` never produces: it exists only
 *   so a value written by a pre-release build still decrypts (see `decrypt` below). No released
 *   version of this plugin ever wrote it, so the read path can be dropped once pre-release
 *   deployments are out of scope.
 * - `enc:v2:` + base64(iv[12] ‖ authTag[16] ‖ ciphertext) — identical AES-256-GCM construction,
 *   PLUS `cipher.setAAD(aad)`/`decipher.setAAD(aad)` binding the ciphertext to WHERE it lives:
 *   `buildAad` below derives `aad` deterministically from the saved object id the value is
 *   stored on. This closes a ciphertext-substitution / confused-deputy gap the platform
 *   precedent (OSD core's `data_source` plugin, same AES-256-GCM/IV12/TAG16 parameters) already
 *   guards against by binding its own wrapping-key name + namespace: without this binding, an
 *   `enc:v1:` blob is a bare AES-GCM ciphertext with no notion of where it belongs, so anyone able
 *   to write saved-object attributes (e.g. through a saved-objects import, a bug elsewhere, or an
 *   admin mistake) could copy provider A's encrypted `apiKey` blob into provider B's `apiKey`
 *   field and it would still decrypt there — v2's AAD makes that copy fail decryption instead
 *   (GCM auth-tag verification covers the AAD too, so a mismatched id is a hard decrypt failure,
 *   not a silent success).
 *
 * A fresh random 12-byte IV is generated on every encrypt call (v1 or v2, never reused); the
 * 16-byte auth tag is verified on every decrypt (tamper/corruption/wrong-AAD is a hard decrypt
 * failure, not silently accepted).
 *
 * ## The saved-object-id parameter
 *
 * Both `encrypt` and `decrypt` take a mandatory `savedObjectId: string` second parameter. For
 * legacy plaintext and `enc:v1:` values the id is UNUSED (v1 has no AAD to bind), but the
 * parameter is still required — not optional — so a caller can never forget to pass it once a
 * value becomes (or already is) `enc:v2:`. Threading a real id through in the plaintext/v1 case
 * costs nothing and keeps the two methods' signatures uniform.
 *
 * ## Compatibility contract
 *
 * Every method here is a PASSTHROUGH when no valid key is configured (`enabled === false`) —
 * `encrypt` returns its input unchanged and `decrypt` only ever transforms strings that already
 * carry the `enc:v1:` or `enc:v2:` prefix, returning anything else (including plaintext keys
 * stored before encryption was enabled) unchanged. Encryption is therefore opt-in: a deployment
 * that never sets a key behaves exactly as if this module did not exist. `enc:v1:` values are NEVER silently re-encrypted to v2 on
 * read by anything in this module — the only place a v1 blob turns into a v2 blob is an explicit
 * upgrade-on-write call site (server/routes/settings.ts's PUT handler), which must decrypt the v1
 * value (plaintext now in hand) and call `encrypt` again itself; this module does not do that
 * silently inside `decrypt`.
 */

const ENC_PREFIX_V1 = 'enc:v1:';
const ENC_PREFIX_V2 = 'enc:v2:';
const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH_BYTES = 32;
const IV_LENGTH_BYTES = 12;
const AUTH_TAG_LENGTH_BYTES = 16;

/** Fixed field/purpose label bound into every v2 AAD alongside the saved object id — see
 * `buildAad` below. Kept as its own constant only for readability; it is never used standalone. */
const API_KEY_ATTRIBUTE_NAME = 'apiKey';

/**
 * Builds the exact AAD bytes bound into a v2 ciphertext: `<saved-object-type>:<savedObjectId>:
 * <attribute-name>`, e.g. `wazuh-ai-assistant-provider:3f2504e0-...:apiKey`. This is the ONE place
 * that string is assembled — both `encrypt` and `decrypt` call it, so they can never disagree
 * about the exact bytes (a mismatch, even a single differing byte, is a hard GCM auth-tag failure
 * on decrypt, which is the whole point: it is what turns a copy-this-blob-into-another-field
 * substitution attempt into a decrypt error instead of a silent success).
 *
 * Uses `PROVIDER_SAVED_OBJECT_TYPE` (common/constants.ts) rather than a duplicated literal so the
 * AAD can never drift from the real saved-object type name.
 */
function buildAad(savedObjectId: string): Buffer {
  return Buffer.from(
    `${PROVIDER_SAVED_OBJECT_TYPE}:${savedObjectId}:${API_KEY_ATTRIBUTE_NAME}`,
    'utf8',
  );
}

export class ApiKeyCipher {
  private readonly key: Buffer | undefined;

  /**
   * @param key Raw 32-byte AES-256 key material, or `undefined` to construct a disabled
   *   (passthrough-only) cipher. Use `parseEncryptionKey` below to turn the base64 config string
   *   into this Buffer — this constructor does not decode base64 itself.
   */
  constructor(key: Buffer | undefined) {
    if (key !== undefined && key.length !== KEY_LENGTH_BYTES) {
      // Defensive: parseEncryptionKey already validates this, but the class must never silently
      // run with a wrong-length key (aes-256-gcm requires exactly 32 bytes) if constructed
      // directly with something else.
      throw new Error(
        `wazuhAiAssistant: ApiKeyCipher key must be exactly ${KEY_LENGTH_BYTES} bytes ` +
          `(got ${key.length}).`,
      );
    }
    this.key = key;
  }

  /** True iff a valid 32-byte key was supplied — i.e. encrypt/decrypt actually transform data
   * instead of passing it through unchanged. */
  get enabled(): boolean {
    return this.key !== undefined;
  }

  /**
   * Encrypts `plaintext`, binding the result to `savedObjectId` (the id of the
   * `wazuh-ai-assistant-provider` saved object `plaintext` will be stored on — see `buildAad`).
   * When disabled, returns `plaintext` unchanged (today's behavior) — this is the "safe by
   * default, no key configured" guarantee, not an error condition; `savedObjectId` is unused in
   * that case but still required, so a passthrough call site can't accidentally omit it and then
   * break the moment encryption gets enabled.
   *
   * Always produces `enc:v2:` output when enabled — this module never writes `enc:v1:` any more,
   * only reads it (see `decrypt`).
   */
  encrypt(plaintext: string, savedObjectId: string): string {
    if (!this.key) {
      return plaintext;
    }
    const iv = crypto.randomBytes(IV_LENGTH_BYTES);
    const cipher = crypto.createCipheriv(ALGORITHM, this.key, iv);
    cipher.setAAD(buildAad(savedObjectId));
    const ciphertext = Buffer.concat([
      cipher.update(plaintext, 'utf8'),
      cipher.final(),
    ]);
    const authTag = cipher.getAuthTag();
    const payload = Buffer.concat([iv, authTag, ciphertext]);
    return `${ENC_PREFIX_V2}${payload.toString('base64')}`;
  }

  /**
   * Decrypts `stored`, which may be (in order of precedence): `enc:v2:` ciphertext (AAD checked
   * against `savedObjectId` via `buildAad`), `enc:v1:` ciphertext (no AAD — decrypted exactly as
   * before this format existed), or legacy/current plaintext (anything not carrying either
   * prefix), returned unchanged — that is the backward-compat passthrough, not a failure mode.
   * `savedObjectId` is REQUIRED even for the v1/plaintext paths where it goes unused, so a caller
   * can never forget to supply the real id for a value that might be (or might one day become)
   * `enc:v2:`.
   *
   * Throws if `stored` is `enc:v1:`/`enc:v2:`-prefixed ciphertext but no key is configured
   * (`enabled === false`): that combination only happens if encryption was enabled when the value
   * was written and has since been disabled (or the key was rotated/removed) — a misconfiguration
   * worth surfacing loudly rather than silently returning garbage or the ciphertext itself as if
   * it were a usable API key.
   *
   * Also throws — same GCM auth-tag mechanism, same non-fail-open guarantee — if an `enc:v2:`
   * value's AAD doesn't match `savedObjectId`: this is the substitution-attack detection this
   * format exists for. It surfaces identically to every other decrypt failure (tamper, wrong key)
   * — never as "treated as empty key and proceed".
   */
  decrypt(stored: string, savedObjectId: string): string {
    if (stored.startsWith(ENC_PREFIX_V2)) {
      if (!this.key) {
        throw new Error(
          'wazuhAiAssistant: encountered an encrypted provider API key but no encryptionKey is ' +
            'configured (wazuh_ai_assistant.encryptionKey in opensearch_dashboards.yml). Configure ' +
            'the same key that was used to encrypt it, or re-enter the provider API key.',
        );
      }
      const payload = Buffer.from(stored.slice(ENC_PREFIX_V2.length), 'base64');
      const iv = payload.subarray(0, IV_LENGTH_BYTES);
      const authTag = payload.subarray(
        IV_LENGTH_BYTES,
        IV_LENGTH_BYTES + AUTH_TAG_LENGTH_BYTES,
      );
      const ciphertext = payload.subarray(
        IV_LENGTH_BYTES + AUTH_TAG_LENGTH_BYTES,
      );
      const decipher = crypto.createDecipheriv(ALGORITHM, this.key, iv);
      decipher.setAAD(buildAad(savedObjectId));
      decipher.setAuthTag(authTag);
      // Throws (auth tag mismatch) if the ciphertext was tampered with, truncated, encrypted
      // under a different key (e.g. after a key rotation with old ciphertext left in place), OR
      // bound to a DIFFERENT savedObjectId (the substitution attack this format defends against —
      // GCM authenticates the AAD along with the ciphertext, so a mismatched id fails exactly the
      // same way a flipped ciphertext byte would).
      const plaintext = Buffer.concat([
        decipher.update(ciphertext),
        decipher.final(),
      ]);
      return plaintext.toString('utf8');
    }

    if (stored.startsWith(ENC_PREFIX_V1)) {
      if (!this.key) {
        throw new Error(
          'wazuhAiAssistant: encountered an encrypted provider API key but no encryptionKey is ' +
            'configured (wazuh_ai_assistant.encryptionKey in opensearch_dashboards.yml). Configure ' +
            'the same key that was used to encrypt it, or re-enter the provider API key.',
        );
      }
      const payload = Buffer.from(stored.slice(ENC_PREFIX_V1.length), 'base64');
      const iv = payload.subarray(0, IV_LENGTH_BYTES);
      const authTag = payload.subarray(
        IV_LENGTH_BYTES,
        IV_LENGTH_BYTES + AUTH_TAG_LENGTH_BYTES,
      );
      const ciphertext = payload.subarray(
        IV_LENGTH_BYTES + AUTH_TAG_LENGTH_BYTES,
      );
      const decipher = crypto.createDecipheriv(ALGORITHM, this.key, iv);
      decipher.setAuthTag(authTag);
      // No setAAD call: v1 never had AAD, and never will — this branch must keep decrypting every
      // v1 blob ever written, forever, byte-for-byte as it did before v2 existed.
      const plaintext = Buffer.concat([
        decipher.update(ciphertext),
        decipher.final(),
      ]);
      return plaintext.toString('utf8');
    }

    return stored;
  }
}

/** True iff `value` is ANY recognized ciphertext format this module produces (`enc:v1:` or
 * `enc:v2:`) — used by server/routes/settings.ts's PUT handler to decide whether a kept-existing
 * (not re-supplied) apiKey is still legacy plaintext (and eligible for encryption) versus already
 * encrypted in some form (and NOT eligible for a bare re-encrypt — see `isLegacyV1Encrypted` for
 * the v1-specific upgrade-on-write decision). */
export function isEncrypted(value: string | undefined): boolean {
  return (
    typeof value === 'string' &&
    (value.startsWith(ENC_PREFIX_V1) || value.startsWith(ENC_PREFIX_V2))
  );
}

/** True iff `value` is specifically `enc:v1:`-prefixed (the OLD, unbound format) — used by
 * server/routes/settings.ts's PUT handler to decide whether a kept-existing apiKey should be
 * transparently upgraded to `enc:v2:` (decrypt the v1 value, re-encrypt as v2 bound to this
 * provider's id) as part of that write. Never true for `enc:v2:` values — those are never
 * "upgraded" again, there is nowhere further to go. */
export function isLegacyV1Encrypted(value: string | undefined): boolean {
  return typeof value === 'string' && value.startsWith(ENC_PREFIX_V1);
}

/**
 * Parses the `wazuh_ai_assistant.encryptionKey` config string (expected: base64 of exactly 32 raw
 * bytes, e.g. the output of `openssl rand -base64 32`) into the Buffer `ApiKeyCipher` needs.
 * Returns `undefined` when no key is configured (the normal, default, encryption-disabled case).
 * Throws a clear setup-time error for anything present but malformed — this is meant to be called
 * once, in server/plugin.ts's setup(), where throwing fails plugin startup fast and loudly rather
 * than limping along with a key that silently doesn't work.
 *
 * Never logs the input or decoded key material.
 */
export function parseEncryptionKey(
  configValue: string | undefined,
): Buffer | undefined {
  if (!configValue) {
    return undefined;
  }
  // Buffer.from(str, 'base64') decodes leniently (it does not throw on invalid base64 characters)
  // rather than throwing, so the exact-length check below is the real validation — it also
  // catches "valid base64 of the wrong length", not just "not base64 at all".
  const decoded = Buffer.from(configValue, 'base64');
  if (decoded.length !== KEY_LENGTH_BYTES) {
    throw new Error(
      `wazuhAiAssistant: wazuh_ai_assistant.encryptionKey must decode (base64) to exactly ` +
        `${KEY_LENGTH_BYTES} bytes (got ${decoded.length}). ` +
        'Generate one with: openssl rand -base64 32',
    );
  }
  return decoded;
}
