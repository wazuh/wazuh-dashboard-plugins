# Credential and TLS resolution

The Wazuh dashboard package resolves its credentials and TLS material instead of shipping defaults.
This page covers how that works, what it needs from the host, and what to keep in mind when
changing the packaging. For the operator's view (the keys, `local.env`, the peer CAs and the
recovery steps), see [Credentials](../ref/getting-started/credentials.md).

The implementation lives in the `wazuh-dashboard` repository, under
`dev-tools/build-packages/credentials/`.

## Files

| Installed as                                            | Mode             | Source                   |
| ------------------------------------------------------- | ---------------- | ------------------------ |
| `/usr/share/wazuh-dashboard/bin/resolve-credentials`    | `root:root 0750` | `resolve-credentials`    |
| `/usr/share/wazuh-dashboard/bin/resolve-credentials.js` | `root:root 0644` | `resolve-credentials.js` |

`resolve-credentials` is a short launcher. It fixes `PATH`, unsets `LD_PRELOAD`,
`LD_LIBRARY_PATH`, `NODE_OPTIONS`, `NODE_PATH` and `NODE_EXTRA_CA_CERTS`, and runs
`resolve-credentials.js` with the bundled `node/bin/node`. Certificates are issued with
`node-forge` and parsed with Node's `crypto`; `opensearch_dashboards.yml` is read with `js-yaml`.
Both modules are already in `node_modules`. Nothing is downloaded at build time, and no file is
shared with the indexer or the manager packages.

## Per-package model

Each Wazuh package owns exactly one configuration directory and publishes what its peers need in
its own `export/`. The dashboard reads the indexer's and the manager's `export/` directories read
only, after checking that they are owned by root, and publishes only its own CA certificate in
`/etc/wazuh-dashboard/export/ca.pem`. `/etc/wazuh` is never created or read.

```
/etc/wazuh-dashboard                 root:wazuh-dashboard 0750
  opensearch_dashboards.yml          root:wazuh-dashboard 0640
  node.options                       root:wazuh-dashboard 0640
  opensearch_dashboards.keystore     root:wazuh-dashboard 0640
  local.env                          root:root            0600   optional, the operator's
  ca/                                root:root            0700   root-ca.pem, root-ca.key, .wazuh-dashboard-bootstrap-ca
  export/                            root:root            0700   ca.pem
  certs/                             root:wazuh-dashboard 0750   files 0640
    dashboard.pem, dashboard-key.pem
    indexer-ca.pem                   opensearch.ssl.certificateAuthorities
    manager-ca.pem                   wazuh_core.hosts.default.ca
    .indexer-ca.imported, .manager-ca.imported
```

Each connection is verified with its own peer's CA. There is no merged bundle.

## Value lookup

| Key                                   | Env-only alias     | Publisher                                   | Keystore entries                                              |
| ------------------------------------- | ------------------ | ------------------------------------------- | ------------------------------------------------------------- |
| `WAZUH_INDEXER_KIBANASERVER_PASSWORD` | `INDEXER_PASSWORD` | `/etc/wazuh-indexer/export/credentials.env` | `opensearch.username` (`kibanaserver`), `opensearch.password` |
| `WAZUH_MANAGER_WUI_PASSWORD`          | `API_PASSWORD`     | `/etc/wazuh-manager/export/credentials.env` | `wazuh_core.hosts.default.password`                           |
| `WAZUH_DASHBOARD_CERT_SANS`           |                    |                                             | (certificate SANs)                                            |

The first hit wins: the process environment (scoped name, then alias), then
`/etc/wazuh-dashboard/local.env`, then the publisher's `export/credentials.env`. An empty value is
no hit. Env files are parsed, never sourced.

## Why the configuration file is checked first

OpenSearch Dashboards merges the keystore **over** `opensearch_dashboards.yml` at start
(`src/cli/serve/serve.js`). If the resolver wrote a keystore entry for a setting the operator had
already configured in the file, the operator's value would be silently overridden. Worse, writing
`opensearch.username=kibanaserver` over a custom username would pair one account's name with
another's password.

So a setting present in the file counts as resolved. The effective precedence is:

1. The keystore entry, unless the same-host publisher's export holds a different value written
   after the keystore was last written (see [Following the peer's export](#following-the-peers-export)).
2. `opensearch_dashboards.yml`.
3. The environment.
4. `local.env`.
5. The publisher's `export/credentials.env`.

Without a
`wazuh_core.hosts.default` host, the manager password is not needed.

## Following the peer's export

A reinstalled peer publishes a new password with its new CA. The CA is re-imported whenever it
differs, so the password follows it. When the entry is in the keystore, the lookup resolves to the
publisher's `export/credentials.env` (not the environment or `local.env`), the value differs from
the stored one, and the export file is newer than the keystore, the resolver replaces the entry
with `keystore add --force` and logs `replaced <entry> in the keystore with the one from <file>`.

- The keystore CLI has no `get`, so the resolver decrypts `opensearch_dashboards.keystore` itself
  (PBKDF2-SHA512, AES-256-GCM, empty password: the format of `src/legacy/server/keystore/`). The
  value stays in memory and is never logged.
- The newer-than check keeps a stale export from reverting a password that an operator changed
  with `wazuh-passwords-tool.sh`, which writes the keystore. `rbac_control` never updates the
  export.
- A keystore that refuses the new value, or a value it would not store as text, is `INVALID` and
  refuses the start.
- The environment and `local.env` only fill an empty keystore, and a password in
  `opensearch_dashboards.yml` is never replaced.

## Keystore writes

- The keystore CLI runs as root with `--allow-root`, an empty environment (`OSD_PATH_CONF` and
  `NODE_ENV` only), from `/`. That is safe because the tree it loads (`/usr/share/wazuh-dashboard`)
  and `node.options` both belong to root: the service account can plant nothing.
- The keystore is set to `root:wazuh-dashboard 0640` after every operation, because the CLI writes
  it `0600`.
- Secrets go through stdin (`keystore add --stdin`), never through `argv`.
- `keystore add` trims the value and stores it `JSON.parse`d. A value that is JSON or has
  surrounding whitespace would be stored as something other than the password, so it is rejected as
  `INVALID` before the write. The password policy itself is enforced by the owners, the indexer and
  the manager.
- Only key names are logged, never a value.

## Trust rules

Every file read as root must be a regular file (no symlink) in a regular directory, both owned by
root and neither group- nor world-writable. Anything else is reported as `UNSAFE <path>: <reason>`
and is never used, repaired or followed. Files are opened with `O_NOFOLLOW` and checked through the
descriptor. `--prestart` runs the same checks over `local.env`, `certs/`, `ca/` and `export/` at
every start, whether or not anything is left to resolve.

Writes go to a temporary file followed by a rename, through a descriptor on the target directory
opened with `O_DIRECTORY|O_NOFOLLOW` and checked with `fstat`. Node has no `renameat`, so the names
are resolved through `/proc/self/fd/<fd>/`. A new directory is created with `mkdir`, and its owner
and mode are set through a descriptor, never by path.

## Certificates

Issued by `--install` only. `--upgrade` and `--prestart` never touch them.

- `certs/dashboard.pem` and `dashboard-key.pem` both present: left alone. Only one of them: error.
- Both absent: the CA in `ca/` is used, or minted when `ca/` has none
  (`CN=wazuh-dashboard-<host>, OU=Wazuh, O=Wazuh, L=California, C=US`, 10 years), and the
  `.wazuh-dashboard-bootstrap-ca` marker is dropped. A pair staged in `ca/` by the operator (no
  marker) is validated, used, and never removed by the resolver. RPM `%postun` still deletes `ca/`
  (and `export/`) on erase, marker or not; DEB `postrm` keeps it.
- The leaf is RSA 2048, SHA-256, 10 years backdated one day, `serverAuth,clientAuth`, `CN=<host>`.
  `dashboard.pem` holds the leaf followed by the CA. Its SANs are `DNS:<host>`, the FQDN when it
  differs, and every global address of the default-route interfaces, or
  `WAZUH_DASHBOARD_CERT_SANS` (an empty list is refused). `localhost`, `127.0.0.1` and `::1` are
  always added.
- The CA certificate is published as `export/ca.pem`.

The marker is the only thing that lets `--clear` delete the CA and its private key later. A private
key on disk cannot answer that question: an operator who stages their own CA leaves the same files.

## Peer CAs

`--install` and `--prestart` keep `certs/indexer-ca.pem` and `certs/manager-ca.pem`:

1. **Staged:** present without its `.<peer>-ca.imported` marker. Used as is, never replaced, never
   cleared.
2. **Imported:** absent, or present with the marker. Copied from the peer's `export/ca.pem` whenever
   it differs, so a reinstalled peer is picked up at the next start.
3. Either way it must be a CA certificate, otherwise `--prestart` reports `INVALID <path>`.

A missing `indexer-ca.pem` stops the start. A missing `manager-ca.pem` is only a warning: the
dashboard starts and serves indexer data, and the manager API connection is refused until the CA is
present.

## Resolver modes

`bin/resolve-credentials --install|--upgrade|--prestart|--clear [-H <config-dir>]`, as root.
`WAZUH_DASHBOARD_VERBOSE=1` prints detail lines.

| Mode         | Called from                                        | Does                                                                                                              | Exit status                                                                                                                      |
| ------------ | -------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `--install`  | DEB `postinst` / RPM `%post` on a fresh install    | Everything; ends with the dashboard URL and where the `admin` password is                                         | always `0`                                                                                                                       |
| `--upgrade`  | DEB `postinst` / RPM `%post` on an upgrade         | Keystore and passwords only                                                                                       | always `0`                                                                                                                       |
| `--prestart` | `ExecStartPre=+` in the unit                       | File checks, passwords, AI Assistant key, peer CAs                                                                | `1` with one `MISSING`, `INVALID` or `UNSAFE` line per problem: a password, `indexer-ca.pem`, an invalid peer CA or the TLS pair |
| `--clear`    | image builds only; nothing in the product calls it | Removes the keystore entries, the pair, the imported peer CAs, the minted CA (a staged one is kept) and `export/` | `1` when the dashboard is running or something could not be removed                                                              |

The maintainer scripts call `--install` or `--upgrade` with `|| true`. A maintainer script that
aborts leaves the package half-configured, breaks `apt install -f` and fails image builds, so the
installer never fails and never checks whether the dashboard can run.

The dashboard keeps no "initialized" marker for its credentials: the keystore entry itself plays
that role. The start step re-runs the whole order at every start, which is what lets a dashboard
installed before the indexer or the manager pick up their values later.

The `+` in `ExecStartPre=+` is required. Without it the step inherits `User=wazuh-dashboard` and
cannot read `local.env` or write the keystore.

## Host dependencies

From the host, the resolver uses only `getent` (glibc), `systemctl`, and `restorecon` when present.
Everything else, including certificate issuance, runs on the bundled Node.js.

## Changing the packaging

- Never add a hardcoded credential to a maintainer script or to the shipped
  `config/opensearch_dashboards.prod.yml`. The packaged file ships no `password` for
  `wazuh_core.hosts.default`.
- Never print a secret. Write it to the keystore through stdin and log only its key name.
- Never read or write another package's directory other than its `export/`, and never create or
  read `/etc/wazuh`.
- Do not start or enable the service on a fresh install, and do not check consumed credentials at
  install time: the answer changes between install and start, and only the answer at start matters.
- The resolver's unit tests run with
  `node --test dev-tools/build-packages/credentials/resolve-credentials.test.js`.
