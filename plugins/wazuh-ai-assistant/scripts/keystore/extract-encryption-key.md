# extract-encryption-key.js

Prints a single value (default: `wazuh_ai_assistant.encryptionKey`) back out of an OpenSearch
Dashboards keystore file. It exists because the platform's own
`opensearch-dashboards-keystore` CLI only supports `create`, `list` (key **names**, never
values), `add`, and `remove` — there is no built-in way to read a value back out once it's
stored. This script reimplements the same decrypt routine the platform itself uses
(`src/legacy/server/keystore/keystore.js`'s `Keystore.decrypt`) so a value can be recovered
without shelling into the platform's own source tree.

Zero external dependencies (only Node's built-in `fs`/`crypto`) — runs anywhere Node runs, no
`yarn`/`npm install` needed. Must be run with read access to the keystore file, i.e. on/inside
the dashboard host or container.

## Usage

```bash
./extract-encryption-key.js [--keystore-path <path>] [--key <name>] [--password <pw>] [--list]
```

- `--keystore-path <path>` — default `/etc/wazuh-dashboard/opensearch_dashboards.keystore`
  (production path). In the `docker/osd-dev` container, pass
  `/home/node/kbn/config/opensearch_dashboards.keystore` explicitly.
- `--key <name>` — default `wazuh_ai_assistant.encryptionKey`.
- `--password <pw>` — default `''` (the stock keystore CLI never sets one).
- `--list` — print key **names** only (no values), then exit.

Example, run inside the dev container after `wazuh_ai_assistant.encryptionKey` has been added
to the keystore:

```bash
node plugins/wazuh-ai-assistant/scripts/keystore/extract-encryption-key.js \
  --keystore-path /home/node/kbn/config/opensearch_dashboards.keystore
```

## Security note

Prints **only** the one requested value (or, with `--list`, only key names) to stdout — never
the whole decrypted keystore object, since it may hold other plugins' secrets too.
