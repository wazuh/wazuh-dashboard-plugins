# Credential and TLS resolution

The Wazuh dashboard package resolves its credentials and TLS material instead of shipping defaults.
This page covers how that works, what it needs from the host, and what to keep in mind when
changing the packaging. For the operator's view (the keys, the credentials file and the recovery
steps), see [Credentials](../ref/getting-started/credentials.md).

The implementation lives in the
[wazuh-dashboard](https://github.com/wazuh/wazuh-dashboard) repository, under
`dev-tools/build-packages/credentials/`, and is part of the install-time credential design shared
with the indexer and the manager
([wazuh-indexer#1928](https://github.com/wazuh/wazuh-indexer/issues/1928)).

## Two halves

| File                                                 | Owner                                              | Contents                                                                                                                                |
| ---------------------------------------------------- | -------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `bin/resolve-credentials` (`resolve-credentials.sh`) | `wazuh-dashboard` repository                       | What is specific to the dashboard: the keystore, the `opensearch_dashboards.yml` check, the AI Assistant key, the dashboard certificate |
| `lib/wazuh-credentials.sh`                           | `wazuh-installation-assistant`, `credentials_lib/` | What the three components must agree on exactly: the credentials file format, locking, path validation and the shared CA                |

The shared library is not committed to `wazuh-dashboard`: a copy there would be a copy that can
drift from the indexer's and the manager's. It is downloaded when the package is built. See
[Credentials resolver](build-packages.md#credentials-resolver) for the refs it is downloaded from
and the variables that control it.

## Resolver modes

`resolve-credentials` takes one of four modes:

| Mode         | Called from                                          | Does                                                                                                                                           | Exit status                                |
| ------------ | ---------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------ |
| `--install`  | DEB `postinst` / RPM `%post` on a fresh install      | Resolves the passwords, generates the AI Assistant key, issues the certificates, creates `/etc/wazuh` and an empty `credentials.env` if absent | always `0`                                 |
| `--upgrade`  | DEB `postinst` / RPM `%post` on an upgrade           | Resolves only what the keystore lacks; no key generation, no certificates                                                                      | always `0`                                 |
| `--prestart` | `ExecStartPre=+` in the unit, `start()` in SysV init | Runs the password order again, generates the AI Assistant key if absent                                                                        | `1` naming every missing or invalid key    |
| `--clear`    | image builds only; nothing in the product calls it   | Removes the keystore entries, the AI Assistant key, the certificates, and a shared CA with its private key                                     | non-zero if something could not be removed |

The maintainer scripts call `--install` or `--upgrade` with `|| true`. A maintainer script that
aborts leaves the package half-configured, breaks `apt install -f` and fails image builds, so the
installer never fails and never checks whether the dashboard can run.

Unlike the indexer, the dashboard keeps no "initialized" marker. Its equivalent of step 0 is the
keystore entry itself: once both entries exist, every later run finds them and writes nothing. The
start step therefore re-runs the whole order at every start, which is what lets a dashboard
installed before the indexer or the manager pick up their keys later.

## Why the configuration file is checked first

OpenSearch Dashboards merges the keystore **over** `opensearch_dashboards.yml` at start
(`src/cli/serve/serve.js`). If the resolver wrote a keystore entry for a setting the operator had
already configured in the file, the operator's value would be silently overridden. Worse, writing
`opensearch.username=kibanaserver` over a custom username would pair one account's name with
another's password.

So a setting present in the file counts as resolved, and the effective precedence is:
keystore entry > `opensearch_dashboards.yml` > environment > `credentials.env`. The file is read
with the dashboard's bundled Node.js and `@osd/config`, so flat keys, nested keys and `${ENV}`
references are interpreted exactly as at runtime, and no value is printed. That check lives in its
own section of the script, decoupled from the password order.

## Keystore writes

- Every keystore call runs as the service user through `runuser -u wazuh-dashboard`, so the
  keystore stays owned by the account that reads it.
- Secrets go through stdin (`keystore add --stdin`), never through `argv` or a
  `runuser --command="..."` string, where they would be visible in `ps`.
- `keystore add` trims the value and stores it `JSON.parse`d. A value that is JSON (a number,
  `true`, a quoted string, an array or an object) or has surrounding whitespace would be stored as
  something other than the password, so it is rejected as `INVALID` before the write. The password
  policy itself is enforced by the owners, the indexer and the manager, not here.
- Only key names are logged, never a value.

## Certificate resolution

Certificates are issued in `--install` only. `--upgrade` and `--prestart` never touch them, so a
pair the operator replaced out of band is never re-examined. The case is decided by what is
present, with no mode flag:

| In the CA directory | Pair in `/etc/wazuh-dashboard/certs/` | Result                             |
| ------------------- | ------------------------------------- | ---------------------------------- |
| Nothing             | No                                    | Mint a CA, then issue the pair     |
| Anchor and key      | No                                    | Issue the pair from the CA found   |
| Anchor only         | No                                    | Install the anchor; nothing issued |
| Anything            | Complete                              | Check it and keep it               |
| Anything            | Partial                               | Refuse; nothing completed          |
| Nothing             | Yes                                   | No CA minted                       |

The CA itself is handled by the shared library's `_wazuh_ca_ensure_locked`, under its lock, so two
components installed at the same time cannot mint two CAs. Because `/etc/wazuh-dashboard` is owned
by the service user, the leaf is issued in a root-only `0700` staging directory inside verified
directory inodes, and each file is published with `ln -T` (which never follows or replaces a name),
key first.

The default subject alternative names are the node name, the FQDN (`hostname -f`) and every
global-scope address reported by `ip -o addr show`. `WAZUH_DASHBOARD_CERT_SANS` replaces that list.
Loopback is always appended.

## File ownership

Root runs `bin/resolve-credentials` from the maintainer scripts and from `ExecStartPre=+`, and it
sources `lib/wazuh-credentials.sh`. A service account able to rewrite either file could have root
run its own code, so both are root-owned:

| Path                       | Owner                  | Mode   |
| -------------------------- | ---------------------- | ------ |
| `bin/resolve-credentials`  | `root:root`            | `0750` |
| `lib/`                     | `root:wazuh-dashboard` | `0750` |
| `lib/wazuh-credentials.sh` | `root:wazuh-dashboard` | `0640` |

`lib/` must stay readable by the service group: at startup, the OpenSearch Dashboards i18n loader
lists every top-level directory of the installation root and exits on `EACCES`.

The ownership is set in three places, which must agree: `debian/rules` (`override_dh_fixperms`),
the DEB `postinst` (after its recursive `chown` of the installation directory), and the RPM spec's
`%files`. **Adding a file that root executes or sources from the product tree means adding it to
all three.**

The `+` in `ExecStartPre=+` is required. Without it the step inherits `User=wazuh-dashboard`, cannot
read the `0600 root:root` credentials file, and fails quietly.

## Host dependencies

| Command                           | Provided by (yum / apt) | Declared by the package | Used for                                                                               |
| --------------------------------- | ----------------------- | ----------------------- | -------------------------------------------------------------------------------------- |
| `openssl`                         | `openssl`               | DEB and RPM             | Minting the bootstrap CA and issuing the dashboard certificate                         |
| `cmp`                             | `diffutils`             | RPM                     | Checking that the CA private key matches its trust anchor                              |
| `flock`, `runuser`                | `util-linux`            | RPM                     | Serializing writes to `/etc/wazuh/credentials.env`; keystore calls as the service user |
| `stat`, `install`, `ln`, `mktemp` | `coreutils`             | —                       | Validating ownership and modes; staging and publishing files                           |
| `ip`                              | `iproute` / `iproute2`  | —                       | Discovering the addresses for the default SANs                                         |
| `hostname`                        | `hostname`              | —                       | The certificate's common name and FQDN                                                 |

`diffutils`, `util-linux` and `coreutils` are Essential on Debian, so the DEB package does not list
them. A full server installation carries all of these. A minimal or container base image may not,
and the failures are easy to misread:

- A missing `openssl` leaves the dashboard with no certificates, reported by `--install`.
- A missing `flock` or `cmp` stops certificate issuance with `cannot issue certificates without
<command>`. In the shared library, a missing `cmp` can report a key mismatch against a CA that is
  valid.
- A missing `ip` does not fail the issuance: the certificate names only the host and loopback, and
  the log says so. Browsers that reach the dashboard by IP address then reject it.

## Changing the packaging

- Never add a hardcoded credential to a maintainer script or to the shipped
  `config/opensearch_dashboards.prod.yml`. The packaged file ships no `password` for
  `wazuh_core.hosts.default`.
- Never print a secret. Write it to the keystore through stdin and log only its key name.
- Do not start or enable the service on a fresh install, and do not check consumed credentials at
  install time: the answer changes between install and start, and only the answer at
  start matters.
- The package test scripts (`dev-tools/test-packages/deb-test-install-uninstall.sh`,
  `rpm-test-install-uninstall.sh`) check the certificate files, the refused start without
  credentials, and the `INVALID` report. `dev-tools/test-packages/vm-test-matrix.sh` runs the
  install, upgrade, removal and certificate scenarios on a throwaway VM (`--list` prints the cases).
