import * as crypto from 'crypto';
import { PROVIDER_API_KEY_AAD_NAMESPACE } from '../../common/constants';

/**
 * Encryption-at-rest for provider API keys (a provider document's `api_key` field, under
 * `ASSISTANT_SETTINGS_INDEX` — see server/settings-store.ts). The value is never returned over the
 * public API (server/routes/settings.ts's `toSummary` only ever exposes a `hasApiKey` boolean),
 * but it IS readable in plaintext by anyone with direct read access to that index; this closes that
 * gap using a symmetric key supplied via this plugin's own OSD config
 * (`wazuh_ai_assistant.encryptionKey` in opensearch_dashboards.yml — see server/config.ts and
 * server/plugin.ts's setup()), with zero new npm dependencies (Node's builtin `crypto` only).
 *
 * ## Wire format
 *
 * `enc:v1:` + base64(iv[12] ‖ authTag[16] ‖ ciphertext) — AES-256-GCM, PLUS
 * `cipher.setAAD(aad)`/`decipher.setAAD(aad)` binding the ciphertext to WHERE it lives: `buildAad`
 * below derives `aad` deterministically from the id of the document the value is stored on. This
 * closes a ciphertext-substitution / confused-deputy gap the platform precedent (OSD core's
 * `data_source` plugin, same AES-256-GCM/IV12/TAG16 parameters) already guards against by binding
 * its own wrapping-key name + namespace: without this binding, a blob would be a bare AES-GCM
 * ciphertext with no notion of where it belongs, so anyone able to write document fields directly
 * (e.g. through a bulk import, a bug elsewhere, or an admin mistake) could copy provider A's
 * encrypted `api_key` blob into provider B's `api_key` field and it would still decrypt there —
 * the AAD makes that copy fail decryption instead (GCM auth-tag verification covers the AAD too,
 * so a mismatched id is a hard decrypt failure, not a silent success).
 *
 * A fresh random 12-byte IV is generated on every encrypt call (never reused); the 16-byte auth
 * tag is verified on every decrypt (tamper/corruption/wrong-AAD is a hard decrypt failure, not
 * silently accepted).
 *
 * ## The saved-object-id parameter
 *
 * Both `encrypt` and `decrypt` take a mandatory `savedObjectId: string` second parameter — the
 * provider document id the AAD is bound to (see `buildAad`). Required, not optional, so a caller
 * can never forget to pass the real id. Named `savedObjectId` for historical reasons (providers
 * were originally an OSD saved object); it is now an OpenSearch document id, but the AAD-binding
 * role is identical either way, and renaming it would not change any behavior.
 *
 * ## No-plaintext contract
 *
 * Plaintext API keys are NOT supported, in either direction: `encrypt` throws when no valid key
 * is configured (`enabled === false`) instead of passing plaintext through, and `decrypt` only
 * ever accepts `enc:v1:` values — anything else (e.g. a plaintext key stored by a pre-release
 * build) is a hard error, never returned as a usable credential. A stored plaintext value has no
 * supported exit: server/routes/settings.ts's PUT handler refuses to keep or manage it (503, same
 * as any other write without encryption configured) — the admin must re-enter the key so it is
 * encrypted fresh, or delete and recreate the provider.
 */

const ENC_PREFIX_V1 = 'enc:v1:';
const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH_BYTES = 32;
const IV_LENGTH_BYTES = 12;
const AUTH_TAG_LENGTH_BYTES = 16;

/** Fixed field/purpose label bound into every AAD alongside the provider document id — see
 * `buildAad` below. Kept as its own constant only for readability; it is never used standalone. */
const API_KEY_ATTRIBUTE_NAME = 'apiKey';

/**
 * Builds the exact AAD bytes bound into a ciphertext: `<namespace>:<savedObjectId>:
 * <attribute-name>`, e.g. `wazuh-ai-assistant-provider:3f2504e0-...:apiKey`. This is the ONE place
 * that string is assembled — both `encrypt` and `decrypt` call it, so they can never disagree
 * about the exact bytes (a mismatch, even a single differing byte, is a hard GCM auth-tag failure
 * on decrypt, which is the whole point: it is what turns a copy-this-blob-into-another-field
 * substitution attempt into a decrypt error instead of a silent success).
 *
 * Uses `PROVIDER_API_KEY_AAD_NAMESPACE` (common/constants.ts) rather than a duplicated literal so
 * the AAD can never accidentally drift from that one constant's value. This value must stay
 * byte-for-byte stable forever (see that constant's own doc comment) regardless of how or where a
 * provider is actually stored.
 */
function buildAad(savedObjectId: string): Buffer {
  return Buffer.from(
    `${PROVIDER_API_KEY_AAD_NAMESPACE}:${savedObjectId}:${API_KEY_ATTRIBUTE_NAME}`,
    'utf8',
  );
}

export class ApiKeyCipher {
  private readonly key: Buffer | undefined;

  /**
   * @param key Raw 32-byte AES-256 key material, or `undefined` to construct a disabled cipher
   *   (refuses to encrypt/decrypt). Use `parseEncryptionKey` below to turn the base64 config
   *   string into this Buffer — this constructor does not decode base64 itself.
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
   * Encrypts `plaintext`, binding the result to `savedObjectId` (the id of the provider document
   * `plaintext` will be stored on — see `buildAad`).
   * Throws when disabled: this module never writes plaintext, so a call without a configured key
   * is a bug in the caller (routes gate on `enabled`/`requireApiKeyEncryption` first), never a
   * silent plaintext write.
   */
  encrypt(plaintext: string, savedObjectId: string): string {
    if (!this.key) {
      throw new Error(
        'wazuhAiAssistant: cannot encrypt a provider API key because no encryptionKey is ' +
          'configured (wazuh_ai_assistant.encryptionKey). API keys are never stored in plain text.',
      );
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
    return `${ENC_PREFIX_V1}${payload.toString('base64')}`;
  }

  /**
   * Decrypts `stored`, which must be `enc:v1:` ciphertext (AAD checked against `savedObjectId` via
   * `buildAad`). Anything else — e.g. a plaintext key stored by a pre-release build — throws:
   * plaintext API keys are not supported and are never returned as a usable credential (re-enter
   * the key in the Settings UI).
   *
   * Throws if `stored` is `enc:v1:`-prefixed ciphertext but no key is configured
   * (`enabled === false`): that combination only happens if encryption was enabled when the value
   * was written and has since been disabled (or the key was rotated/removed) — a misconfiguration
   * worth surfacing loudly rather than silently returning garbage or the ciphertext itself as if
   * it were a usable API key.
   *
   * Also throws — same GCM auth-tag mechanism, same non-fail-open guarantee — if the AAD doesn't
   * match `savedObjectId`: this is the substitution-attack detection this format exists for. It
   * surfaces identically to every other decrypt failure (tamper, wrong key) — never as "treated as
   * empty key and proceed".
   */
  decrypt(stored: string, savedObjectId: string): string {
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

    throw new Error(
      'wazuhAiAssistant: the stored provider API key is not encrypted. Plaintext API keys are ' +
        'not supported — re-enter the provider API key in the Settings UI (with ' +
        'wazuh_ai_assistant.encryptionKey configured) so it is stored encrypted.',
    );
  }
}

/** True iff `value` is `enc:v1:`-prefixed ciphertext — used by server/routes/settings.ts's PUT
 * handler to decide whether a kept-existing (not re-supplied) apiKey is legacy plaintext (refused
 * with a 503 — plaintext keys are never managed, only re-entered) versus already encrypted. */
export function isEncrypted(value: string | undefined): boolean {
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
