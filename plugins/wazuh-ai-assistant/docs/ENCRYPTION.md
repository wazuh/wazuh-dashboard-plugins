# Encryption at rest for provider API keys

Provider API keys (`wazuh-ai-assistant-provider` saved object's `apiKey` attribute) are never
returned by this plugin's public API — `GET/POST/PUT /api/wazuh_ai_assistant/providers` only ever
expose a `hasApiKey` boolean (see `server/routes/settings.ts`'s `toSummary`). But the saved object
itself is stored in the `.kibana`/saved-objects index, which is readable in plaintext by anyone
with direct access to that index (e.g. via the Wazuh indexer API, snapshots, or index backups).

This plugin can encrypt `apiKey` at rest with AES-256-GCM using a key supplied through Wazuh dashboard
own config file — no new npm dependency, no separate secrets service, Node's builtin
`crypto` module only.

## Enabling it

1. Generate a 32-byte key, base64-encoded:
   ```
   openssl rand -base64 32
   ```
2. Store it as `wazuh_ai_assistant.encryptionKey`. **Prefer the keystore** —
   the key then never sits in a readable config file:

   ```
   sudo -u wazuh-dashboard /usr/share/wazuh-dashboard/bin/opensearch-dashboards-keystore \
     add wazuh_ai_assistant.encryptionKey
   ```

   This is the same mechanism Wazuh's own installer already uses for `opensearch.username` /
   `opensearch.password`, and it is **verified working for this key on 5.0.0-beta3**: supplied via
   the keystore alone, with no `opensearch_dashboards.yml` entry at all, startup reports
   encryption `ENABLED`.

   Alternatively — less protected, since the value is readable by anyone who can read the dashboard
   config file — add it to `opensearch_dashboards.yml`:

   ```yaml
   wazuh_ai_assistant.encryptionKey: '<the base64 value from step 1>'
   ```

   Either way the config key is `wazuh_ai_assistant.encryptionKey` — it follows this plugin's
   `configPath` (`opensearch_dashboards.json`'s `"configPath": ["wazuh_ai_assistant"]`), not its
   `wazuhAiAssistant` plugin id.

3. Restart Wazuh dashboard. On startup this plugin logs one line stating whether encryption
   is `ENABLED` (info) or `DISABLED` (a **warning**, since provider API keys cannot be saved until
   it is configured) — never the key itself; see `server/plugin.ts`'s `setup()`.
4. Nothing else to do: every provider API key created or updated (via the Settings UI's provider
   form) from this point on is encrypted before being written to the saved object.

## What happens if you don't set it

The key is never generated automatically — an operator must configure it manually, once, as
described above. With no `encryptionKey` configured, this plugin refuses to store provider API
keys, on both sides of the wire:

- **Settings UI**: the provider form learns encryption is unconfigured from the
  `GET /settings/access` probe (`apiKeyEncryptionEnabled`), shows a warning callout walking
  through the setup above (generate a key, store it via the keystore — recommended — or
  `opensearch_dashboards.yml`, restart), and keeps the Save button disabled while an API key is
  typed.
- **Server (backstop for direct API calls)**: `POST /api/wazuh_ai_assistant/providers` and
  `PUT /api/wazuh_ai_assistant/providers/{id}` reject any request carrying a non-empty `apiKey`
  with HTTP 503 and a message naming the same configuration options (`requireApiKeyEncryption`
  in `server/routes/settings.ts`, covered by `server/routes/provider-encryption-gate.test.ts`).

Providers with no credential (the `wazuh_brain` hosted endpoint, unauthenticated local gateways
such as Ollama) are unaffected. Stored keys are NOT readable without the encryption key either:
plaintext API keys are not supported anywhere — a plaintext value written by a pre-release build
fails decryption (chat and the provider connectivity test surface a clear error) and is never
managed or upgraded; it must be re-entered.

## Enabling encryption on an existing deployment

- Plaintext keys stored before encryption was enabled do NOT keep working — `ApiKeyCipher.decrypt`
  (`server/crypto/api-key-cipher.ts`) rejects any value that is not `enc:v1:` ciphertext, so chat
  and the provider connectivity test fail with a clear error for such a provider until its key is
  re-entered. A plaintext-stored key is never managed: editing ANY field of a provider that still
  holds one is refused with the same 503 as re-supplying a key, regardless of whether an
  encryption key is now configured — re-enter the API key (encrypting it fresh) or delete the
  provider.
- New and updated keys are encrypted once a key is configured (see "Format" below).

## Format

Provider API keys are encrypted as **`enc:v1:<base64>`** using AES-256-GCM with a fresh random
12-byte IV generated on every encrypt call and a 16-byte auth tag verified on every decrypt. The
base64 payload is `iv (12 bytes) ‖ auth tag (16 bytes) ‖ ciphertext`.

The GCM call additionally binds an **Additional Authenticated Data (AAD)** value:
`wazuh-ai-assistant-provider:<saved object id>:apiKey` (built by the one shared `buildAad` helper
in `server/crypto/api-key-cipher.ts` that both `encrypt` and `decrypt` call, so the two can never
disagree on the exact bytes). This mirrors OSD core's own `data_source` plugin — the platform
precedent for this exact AES-256-GCM/IV-12/tag-16 construction — which binds its own wrapping-key
name and namespace into its ciphertexts for the same reason.

**What this prevents:** without an AAD binding, a ciphertext blob would be bare and portable —
anyone able to write saved-object attributes (a saved-objects import, a bug elsewhere, an admin
mistake, or a lower-privilege actor with unexpected write access) could copy provider A's
encrypted `apiKey` value into provider B's `apiKey` field (or any other field entirely) and it
would still decrypt there, silently handing provider B the wrong key. Binding the AAD to the exact
saved-object id (and a fixed `apiKey` purpose label) turns that copy into a **hard decrypt
failure**: GCM authenticates the AAD together with the ciphertext, so a value decrypted under the
wrong id fails auth-tag verification exactly the same way a tampered ciphertext byte would — never
a silent, wrong-provider success. This is a ciphertext-substitution / confused-deputy defense, not
a confidentiality feature on its own.

Anything not starting with `enc:v1:` is rejected by `decrypt()` — plaintext API keys are not
supported.

### The saved-object-id parameter

`ApiKeyCipher.encrypt(plaintext, savedObjectId)` and `ApiKeyCipher.decrypt(stored, savedObjectId)`
both take the provider's saved-object id as a **mandatory** second parameter — the id the AAD is
bound to. Required, never optional, so no call site can forget to supply the real id. Every call
site in `server/routes/settings.ts` and `server/routes/chat.ts` threads the real provider id
through.

One subtlety this created: `POST /providers` (create) needs the id to encrypt the key, but the
saved-objects `create()` call is what normally mints that id — not available until after it
returns. Rather than create the object first and `update()` it a moment later with the real
ciphertext (two separate writes, with a genuine "provider left with no key" failure window if the
second write fails), the create route pre-generates the id client-side with `crypto.randomUUID()`
and passes it through the saved-objects client's explicit-id create option
(`client.create(type, attributes, {id})`) — the same explicit-id contract this plugin already
relies on elsewhere (the `wazuh-ai-assistant-settings` singleton is created with a fixed id the same
way). This keeps provider creation a single atomic write: it either fully succeeds (the provider
exists, with its `apiKey` already correctly bound to its own id) or fully fails and nothing is
created at all — there is no intermediate state where a provider exists without a working key.

## Key rotation

There is no key-versioning/rotation scheme — this is a single static key. If you change or remove
`wazuh_ai_assistant.encryptionKey`, any previously encrypted API key becomes **undecryptable**: this
plugin will surface a clear error (server logs, and a failed connectivity test / chat request for
that provider) rather than silently failing. Recovery is manual: re-enter the affected providers'
API keys in the Settings UI after rotating the key (the PUT route will re-encrypt them under the
new key).

## Threat model notes

- This protects `apiKey` against read access to the saved-objects index/snapshots. It does not
  protect against an attacker who can read `opensearch_dashboards.yml` (which holds the key
  itself) or who can reach the running dashboard process's memory.
- The key never leaves the server: it is not exposed to the browser (`exposeToBrowser: {}` in
  `server/config.ts`) and is never logged (`server/plugin.ts` logs only an ENABLED/DISABLED
  boolean).
- The AAD binding (see "Format" above) additionally protects against ciphertext substitution: even
  someone able to write raw `apiKey` bytes into a saved object (bypassing this plugin's own routes
  entirely — e.g. via a saved-objects import/restore, or a bug in an unrelated code path) cannot
  make a copied `enc:v1:` blob from a different provider decrypt successfully. A value only ever
  decrypts under the exact saved-object id it was encrypted for; anything else is a hard failure,
  never a silent wrong-key success.
