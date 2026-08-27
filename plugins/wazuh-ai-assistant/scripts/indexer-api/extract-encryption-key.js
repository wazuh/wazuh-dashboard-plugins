#!/usr/bin/env node
//
// extract-encryption-key.js
//
// Prints a single value (default: wazuh_ai_assistant.encryptionKey) out of the OpenSearch
// Dashboards keystore file. There is no `opensearch-dashboards-keystore` subcommand for this —
// that CLI only supports `create`, `list` (key NAMES, never values), `add`, and `remove` (verified
// against the actual wazuh-dashboard platform source, src/cli_keystore/*.js). This script
// re-implements the same decrypt routine the platform itself uses
// (src/legacy/server/keystore/keystore.js's `Keystore.decrypt`) so the value can be read back out
// without shelling into the platform's own source tree.
//
// Zero external dependencies — only Node's built-in `fs`/`crypto`/`path` — so this runs anywhere
// Node runs (the dashboard host/container is guaranteed to have Node; no `yarn`/`npm install`
// needed). Must be run with read access to the keystore file, i.e. on/inside the dashboard host
// or container.
//
// Keystore file format (one line): "<version>:<base64 of salt[64] || iv[12] || tag[16] || ciphertext>",
// AES-256-GCM, key = pbkdf2Sync(password, salt, 10000, 32, 'sha512'). This OSD version's own
// `create` command never wires up a password option (`new Keystore(getKeystore())` is always
// called with no password), so `password` is '' for any keystore created through the stock CLI —
// the --password flag below exists only as an escape hatch for a keystore created some other way.
//
// Usage:
//   ./extract-encryption-key.js [--keystore-path <path>] [--key <name>] [--password <pw>] [--list]
//
// Defaults: --keystore-path /etc/wazuh-dashboard/opensearch_dashboards.keystore (production path,
// per docs/ref/backup-restore.md; pass the dev container's own
// /home/node/kbn/config/opensearch_dashboards.keystore explicitly there), --key
// wazuh_ai_assistant.encryptionKey, --password ''.
//
// Prints ONLY the requested value (or, with --list, only the key names) to stdout — never the
// whole decrypted object by default, since the keystore may hold other plugins' secrets too.

'use strict';

const fs = require('fs');
const crypto = require('crypto');

const ALGORITHM = 'aes-256-gcm';
const ITERATIONS = 10000;
const SALT_LENGTH = 64;
const IV_LENGTH = 12;
const TAG_LENGTH = 16;

const DEFAULT_KEYSTORE_PATH =
  '/etc/wazuh-dashboard/opensearch_dashboards.keystore';
const DEFAULT_KEY = 'wazuh_ai_assistant.encryptionKey';

function usage() {
  process.stderr.write(
    [
      'Usage: extract-encryption-key.js [--keystore-path <path>] [--key <name>] [--password <pw>] [--list]',
      '',
      `  --keystore-path <path>  Default: ${DEFAULT_KEYSTORE_PATH}`,
      `  --key <name>            Default: ${DEFAULT_KEY}`,
      "  --password <pw>         Default: '' (stock OSD tooling never sets one)",
      '  --list                  Print key NAMES only (no values), then exit',
      '  -h, --help               Show this help',
      '',
    ].join('\n'),
  );
}

function parseArgs(argv) {
  const options = {
    keystorePath: DEFAULT_KEYSTORE_PATH,
    key: DEFAULT_KEY,
    password: '',
    list: false,
  };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--keystore-path') {
      options.keystorePath = argv[++i];
    } else if (arg === '--key') {
      options.key = argv[++i];
    } else if (arg === '--password') {
      options.password = argv[++i];
    } else if (arg === '--list') {
      options.list = true;
    } else if (arg === '-h' || arg === '--help') {
      usage();
      process.exit(0);
    } else {
      process.stderr.write(`Unknown argument: ${arg}\n`);
      usage();
      process.exit(2);
    }
  }
  return options;
}

// Byte-for-byte the same algorithm as src/legacy/server/keystore/keystore.js's Keystore.decrypt.
function decryptKeystore(rawFileContents, password) {
  const [, data] = rawFileContents.trim().split(':');
  if (!data) {
    throw new Error(
      'Unrecognized keystore file format (expected "<version>:<base64>").',
    );
  }
  const buffer = Buffer.from(data, 'base64');
  const salt = buffer.subarray(0, SALT_LENGTH);
  const iv = buffer.subarray(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
  const tag = buffer.subarray(
    SALT_LENGTH + IV_LENGTH,
    SALT_LENGTH + IV_LENGTH + TAG_LENGTH,
  );
  const ciphertext = buffer.subarray(SALT_LENGTH + IV_LENGTH + TAG_LENGTH);

  const key = crypto.pbkdf2Sync(password, salt, ITERATIONS, 32, 'sha512');
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);
  const plaintext =
    decipher.update(ciphertext, undefined, 'utf8') + decipher.final('utf8');
  return JSON.parse(plaintext);
}

function main() {
  const options = parseArgs(process.argv.slice(2));

  let rawFileContents;
  try {
    rawFileContents = fs.readFileSync(options.keystorePath, 'utf8');
  } catch (error) {
    process.stderr.write(
      `Could not read keystore file at ${options.keystorePath}: ${error.message}\n`,
    );
    process.exit(1);
  }

  let data;
  try {
    data = decryptKeystore(rawFileContents, options.password);
  } catch (error) {
    process.stderr.write(
      `Could not decrypt the keystore (wrong --password, or the file is not an OpenSearch ` +
        `Dashboards keystore): ${error.message}\n`,
    );
    process.exit(1);
  }

  if (options.list) {
    process.stdout.write(Object.keys(data).join('\n') + '\n');
    return;
  }

  if (!Object.prototype.hasOwnProperty.call(data, options.key)) {
    process.stderr.write(
      `Key "${options.key}" is not set in this keystore. Run with --list to see available keys.\n`,
    );
    process.exit(1);
  }

  process.stdout.write(String(data[options.key]) + '\n');
}

main();
