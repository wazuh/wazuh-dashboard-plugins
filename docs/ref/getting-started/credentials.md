# Credentials

The Wazuh dashboard ships no default password. It reads the passwords of the accounts it connects
with from a credentials file shared by the Wazuh central components, stores them in its keystore,
and checks them every time the service starts. It also issues its own TLS certificates from the
Wazuh root CA shared with the other components.

This follows the install-time credential resolution design shared by the indexer, the manager and
the dashboard ([wazuh-indexer#1928](https://github.com/wazuh/wazuh-indexer/issues/1928)). The packaged
resolver, `/usr/share/wazuh-dashboard/bin/resolve-credentials`, does this work. It runs from the
package scripts and from the service start, so you do not need to run it by hand.

Certificates are the exception to "every start", so note this before reading on: they are issued
**once, at installation**. A service start or a package upgrade never examines them again. See
[Certificates](#certificates).

## What the dashboard resolves

The dashboard owns neither account it connects with. Each password belongs to the component that
holds the account:

| Key                                   | Environment-only alias | Account                        | Owner   | Written to the keystore as                                    |
| ------------------------------------- | ---------------------- | ------------------------------ | ------- | ------------------------------------------------------------- |
| `WAZUH_INDEXER_KIBANASERVER_PASSWORD` | `INDEXER_PASSWORD`     | `kibanaserver` (Wazuh indexer) | Indexer | `opensearch.username` (`kibanaserver`), `opensearch.password` |
| `WAZUH_MANAGER_WUI_PASSWORD`          | `API_PASSWORD`         | `wazuh-wui` (Server API)       | Manager | `wazuh_core.hosts.default.password`                           |

The dashboard **consumes** both. It never generates them and never writes them to the credentials
file: a password the dashboard made up would not be accepted by the indexer or the Server API. So
the dashboard is the component most likely to be left unresolved on a fresh host, until the indexer
and the manager publish their keys or you supply them.

It **owns** two local assets, which nobody else reads:

- The [AI Assistant encryption key](#ai-assistant-encryption-key) (`wazuh_ai_assistant.encryptionKey`).
- Its [TLS certificate pair](#certificates).

The aliases keep the variable names used by `wazuh-docker`. They are read from the process
environment only, never from the file.

## The resolution order

For each of the two passwords, the resolver takes the first source that gives a value:

1. **Already in the keystore** (`/etc/wazuh-dashboard/opensearch_dashboards.keystore`): leave it
   untouched.
2. **Already set in `opensearch_dashboards.yml`**: leave it untouched. Nothing is written to the
   keystore.
3. **Set in the process environment**, as the scoped name first, then the alias: store it in the
   keystore.
4. **Set in `/etc/wazuh/credentials.env`**: store it in the keystore.
5. **None of the above**: the password is unresolved.

As on the other components, the environment wins over the file. The dashboard adds step 2 because
the keystore is merged over `opensearch_dashboards.yml` when the dashboard starts. If the resolver
wrote an entry for a setting you already configured in the file, it would silently override your
value. So a setting in the file counts as resolved:

- If `opensearch.password` is set in `opensearch_dashboards.yml`, the `kibanaserver` password is not
  resolved.
- If `opensearch.username` is set in `opensearch_dashboards.yml`, the resolver stores only
  `opensearch.password`. It never writes `kibanaserver` over your username.
- If `wazuh_core.hosts.default.password` is set, or `wazuh_core.hosts` has no `default` entry, the
  `wazuh-wui` password is not needed. Passwords for other hosts are configured as described in
  [Define Wazuh server hosts](../configuration.md#define-wazuh-server-hosts).

The resolver reads `opensearch_dashboards.yml` with the dashboard's own configuration loader. That
means flat and nested keys and `${ENV}` references work as they do at runtime. If the file cannot be
read, this check is skipped.

### Accepted values

The password policy (12 to 64 characters from `A-Z a-z 0-9 . , _ + : @ % ^ = ~ -`, with at least
one lowercase letter, one uppercase letter, one digit and one symbol) is enforced by the components
that own the accounts, the indexer and the manager. The dashboard only rejects a value that its
keystore would not store verbatim, because `opensearch-dashboards-keystore add` trims the value and
parses it as JSON:

- A JSON value: a number, `true`, `false`, a quoted string, an array or an object.
- A value with leading or trailing whitespace.

An invalid value does not fall through to the next source. It is reported as `INVALID <KEY>` with
the rule it failed, and the value itself is never printed.

## The credentials file

`/etc/wazuh/credentials.env` is shared by the indexer, the manager and the dashboard. It is the input,
the handoff between components, and the record of generated passwords.

- The file is `0600 root:root`, in a `0700 root:root` directory. It is refused outright, with the
  reason logged, if its owner, group or mode is wrong, if it is a symlink, or if any directory above
  it is group- or world-writable. The dashboard never repairs it.
- It holds one `KEY=VALUE` per line. Values can be bare, single-quoted or double-quoted. The file is
  **parsed, never sourced**, so nothing in it is ever executed.
- The packages own the block between the `# >>> wazuh generated — do not edit <<<` markers and
  nothing else. Lines you write outside that block are never touched.
- If the dashboard is the first Wazuh package on the host, it creates `/etc/wazuh` (`0700`) and an
  empty `credentials.env` (`0600 root:root`). No package ships either of them.

When the indexer and the manager run on the same host, their packages publish the keys the dashboard
reads, and there is nothing to do. When they run on other hosts, add the keys before starting the
dashboard. Replace `<KIBANASERVER_PASSWORD>` and `<WAZUH_WUI_PASSWORD>` with the passwords of the
`kibanaserver` account on the indexer and the `wazuh-wui` account on the Server API:

```bash
sudo install -d -m 0700 -o root -g root /etc/wazuh
sudo touch /etc/wazuh/credentials.env && sudo chmod 0600 /etc/wazuh/credentials.env
sudo tee -a /etc/wazuh/credentials.env > /dev/null <<'EOF'
WAZUH_INDEXER_KIBANASERVER_PASSWORD='<KIBANASERVER_PASSWORD>'
WAZUH_MANAGER_WUI_PASSWORD='<WAZUH_WUI_PASSWORD>'
EOF
```

To find those values, read `/etc/wazuh/credentials.env` on the indexer and manager hosts. Their
packages write every value double-quoted, and the quotes are not part of the password.

> **Important:** Once a password is in the keystore, step 1 of the order wins. Editing the
> credentials file afterwards does not change what the dashboard uses. See
> [Rotation](#rotation).

The file holds plaintext passwords. Delete it once every component is installed and has started
successfully, not earlier: until then, it is how the components hand credentials to one another.
After a successful start, the dashboard has both passwords in its keystore and does not need the
file again.

```bash
sudo rm /etc/wazuh/credentials.env
```

### Supplying a value through the environment

The same key names, and the aliases, are read from the process environment, which overrides the
file. On a package install, the value must be on the `sudo` command line. With `env_reset` active,
which is the default on every supported distribution, an exported variable never reaches the
maintainer script:

```bash
# Correct
sudo WAZUH_MANAGER_WUI_PASSWORD='<WAZUH_WUI_PASSWORD>' apt-get install wazuh-dashboard

# Silently dropped: env_reset discards it
export WAZUH_MANAGER_WUI_PASSWORD='<WAZUH_WUI_PASSWORD>'
sudo apt-get install wazuh-dashboard
```

That trap is why the file, not the command line, is the recommended way to supply a value. For the
service start, the unit also reads `/etc/default/wazuh-dashboard` (Debian-based) and
`/etc/sysconfig/wazuh-dashboard` (RPM-based).

## Installing and starting

The installer stores what it can and has no opinion about whether the dashboard can run. It exits
`0` whatever it could not resolve and prints no warning about missing passwords. You start the
service when you are ready:

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now wazuh-dashboard
```

Install order does not matter. A dashboard installed before the indexer or the manager resolves
nothing at install time. When you start it, the resolver runs the whole order again (not only a
check), picks up the keys published since, and stores them.

| Moment                | Resolver mode | Passwords                                 | AI Assistant key    | Certificates      |
| --------------------- | ------------- | ----------------------------------------- | ------------------- | ----------------- |
| Fresh package install | `--install`   | resolved; never fails                     | generated if absent | issued if missing |
| Package upgrade       | `--upgrade`   | resolved; never fails                     | not generated       | not touched       |
| Every service start   | `--prestart`  | resolved; **refuses to start** if missing | generated if absent | not touched       |

The start step runs from `ExecStartPre=+` in `wazuh-dashboard.service`, and from the `start` action of
the SysV init script. The unit also sets `StartLimitBurst=3` and `StartLimitIntervalSec=60`, so a
dashboard that cannot resolve its credentials stops retrying after three attempts in one minute
instead of flooding the journal.

## When the dashboard does not start

When a password is still missing at start, the dashboard refuses to start and names the key. There
is no repair command: fix the key and start the service again.

```
$ sudo systemctl enable --now wazuh-dashboard
Job for wazuh-dashboard.service failed.

$ journalctl -u wazuh-dashboard -n 50
  resolve-credentials: MISSING WAZUH_MANAGER_WUI_PASSWORD (the manager's wazuh-wui account)
  resolve-credentials:         set it in /etc/wazuh/credentials.env, or install wazuh-manager on this host first
```

1. Read the journal: `journalctl -u wazuh-dashboard -n 50`.
2. Set the missing key in `/etc/wazuh/credentials.env`.
3. Start the service again: `sudo systemctl start wazuh-dashboard`. If systemd reports that the start
   limit was hit, run `sudo systemctl reset-failed wazuh-dashboard` first.

| Message                                       | Meaning                                                                                                                         |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `MISSING WAZUH_INDEXER_KIBANASERVER_PASSWORD` | No source gives the `kibanaserver` password. Set it in the file, or install `wazuh-indexer` on this host first.                 |
| `MISSING WAZUH_MANAGER_WUI_PASSWORD`          | No source gives the `wazuh-wui` password. Set it in the file, or install `wazuh-manager` on this host first.                    |
| `INVALID <KEY>`                               | The value is JSON or has surrounding whitespace. Correct it in the file and start the service again.                            |
| `REFUSED /etc/wazuh/credentials.env`          | The file or a directory above it fails the ownership, mode or format rules. The reason is logged just above it. Fix it by hand. |
| `MISSING keystore`                            | `/etc/wazuh-dashboard/opensearch_dashboards.keystore` could not be created or read.                                             |

The start step checks **presence and format only**. It never opens a network connection, because
making the start depend on reaching a peer would break boot ordering and cluster restarts. A
password that is present but wrong still fails at runtime as a `401` from the indexer or the Server
API.

No value is ever printed, in the installer output or in the journal. An invalid value is reported by
the name of its key and the rule it failed.

## AI Assistant encryption key

The [AI Assistant](../modules/ai-assistant/configuration.md) encrypts the provider API keys it stores
with `wazuh_ai_assistant.encryptionKey`. The resolver generates that key (32 random bytes, base64)
straight into the keystore:

- At a fresh install and at every start, when neither the keystore nor `opensearch_dashboards.yml`
  has it.
- Never at upgrade: an upgrade adds no secret you did not already have.
- Never as a replacement for an existing key, because the key is required to decrypt the API keys
  already stored.

The key is never written to the credentials file and never printed. If it cannot be generated, a
warning is logged and the dashboard starts anyway, because the AI Assistant is optional.

## Certificates

`opensearch_dashboards.yml` serves HTTPS with a certificate pair and trusts the indexer through a CA
certificate:

| File                                           | Used for                           |
| ---------------------------------------------- | ---------------------------------- |
| `/etc/wazuh-dashboard/certs/dashboard.pem`     | The certificate served to browsers |
| `/etc/wazuh-dashboard/certs/dashboard-key.pem` | Its private key                    |
| `/etc/wazuh-dashboard/certs/root-ca.pem`       | The trust anchor for the indexer   |

### Issued at installation, and at no other moment

A fresh install issues whichever of these files are missing. A service start or a package upgrade
never issues, re-anchors or re-examines them. A certificate is the credential you are most likely
to replace out of band, and a pair you replaced must survive every upgrade.

Which flow applies depends on what is in `$WAZUH_CA_DIR`, which defaults to `/etc/wazuh/ca`. There is
no mode flag: the signal is whether a private key sits beside the anchor.

| In the CA directory | Pair already in `certs/` | Result                                                                                                    |
| ------------------- | ------------------------ | --------------------------------------------------------------------------------------------------------- |
| nothing             | no                       | mint a bootstrap CA (`root-ca.pem` and `root-ca.key`) and record that it did, then issue the pair from it |
| anchor + key        | no                       | issue the pair from the CA found                                                                          |
| anchor only         | no                       | install `root-ca.pem`; **nothing issued**                                                                 |
| anything            | yes, complete            | keep the pair as it is, after checking it                                                                 |
| anything            | one of the two files     | **nothing issued**: a partial pair is refused, not completed                                              |
| nothing             | yes                      | no CA is minted, since its anchor would not match the pair                                                |

When the install mints the bootstrap CA, it also creates `.wazuh-dashboard-bootstrap-ca` in the CA
directory. That marker is what lets [`--clear`](#container-images) remove the CA later; `--clear`
never removes a CA without it.

An existing `certs/root-ca.pem` is kept, even when it is not the shared CA. A new `certs/` directory
gets the layout `wazuh-certs-tool` produces: `0500`, files `0400`, owned by
`wazuh-dashboard:wazuh-dashboard`.

When the install issues nothing, it says so and still exits `0`. The dashboard then has no
certificates and does not start until you provision them:

```
resolve-credentials: the dashboard has no TLS certificates and this install could not issue them
resolve-credentials:         provision dashboard.pem, dashboard-key.pem and root-ca.pem into /etc/wazuh-dashboard/certs
```

Every step is logged with public data only: the CA created or reused (subject, expiry, SHA-256
fingerprint), where the SANs came from, and the issued certificate (subject, expiry, fingerprint,
serial, SANs). A private key is never printed.

### The issued certificate

| Property                  | Value                                                                                             |
| ------------------------- | ------------------------------------------------------------------------------------------------- |
| Key and signature         | RSA 2048, SHA-256                                                                                 |
| Validity                  | 3650 days                                                                                         |
| Extended key usage        | `serverAuth`, `clientAuth`                                                                        |
| Common name               | `WAZUH_DASHBOARD_NODE_NAME`, or `hostname -s`                                                     |
| Subject alternative names | `WAZUH_DASHBOARD_CERT_SANS`, or by default the node name, the FQDN and every global-scope address |

`WAZUH_DASHBOARD_CERT_SANS` is an exact, comma-separated list. Each entry is `DNS:`, `IP:` or
untyped. The variable **replaces** the derived list; it does not extend it. `localhost`,
`127.0.0.1` and `::1` are appended either way. Both variables are read from the environment first,
then from `credentials.env`, so set them before installing:

```sh
WAZUH_DASHBOARD_NODE_NAME='dashboard'
WAZUH_DASHBOARD_CERT_SANS='DNS:dashboard.corp.local,IP:10.0.1.12'
```

Changing either variable later renews nothing. To reissue, stop the dashboard, remove the pair, and
run the install mode again:

```bash
sudo rm /etc/wazuh-dashboard/certs/dashboard.pem /etc/wazuh-dashboard/certs/dashboard-key.pem
sudo /usr/share/wazuh-dashboard/bin/resolve-credentials --install
```

The browser warns about a certificate issued by the Wazuh root CA. Import `root-ca.pem` into the
browser's certificate store, or replace the pair with one from a trusted authority.

### Using certificates issued elsewhere

A distributed deployment, a corporate PKI or the Wazuh installation assistant's `wazuh-certs-tool`
all issue the dashboard's certificates outside the host. Place the pair and the CA that signs it in
`/etc/wazuh-dashboard/certs/`, either **before** installing the package, so the install issues
nothing, or afterwards, overwriting the pair it issued. Nothing checks them again after that. See
[Deploying certificates](installation.md#deploying-certificates).

The service reads the pair as `wazuh-dashboard`, so the files must be owned by that user. Files
placed before installing are owned by `root`, because the user does not exist yet: the package
changes the owner of `/etc/wazuh-dashboard/certs/` to `wazuh-dashboard:wazuh-dashboard` before it
looks at them, on both DEB and RPM, and keeps their modes. Files placed after installing need that
ownership set by hand.

A bootstrap CA is local to the host that minted it and can be thrown away. It trusts only itself: a
dashboard issued from it does not trust an indexer issued from a different CA. In a multi-host
deployment, either stage the same CA in `/etc/wazuh/ca` on every host before installing, or
provision each host's pair from your own PKI. A CA you stage must be `root:root 0700` for the
directory, `root:root 0644` for `root-ca.pem` and `root:root 0400` for `root-ca.key`:

```bash
sudo install -d -m 0700 -o root -g root /etc/wazuh/ca
sudo install -m 0644 -o root -g root root-ca.pem /etc/wazuh/ca/root-ca.pem
sudo install -m 0400 -o root -g root root-ca.key /etc/wazuh/ca/root-ca.key
```

On a host that must not sign, stage only `root-ca.pem` (no key) and provide the dashboard pair
yourself. A host that never receives the CA private key cannot leak it.

A CA you stage, with or without its key, is not removed by [`--clear`](#container-images), which
deletes only a CA the dashboard minted and marked with `.wazuh-dashboard-bootstrap-ca`. When you
stage a CA over one the dashboard minted, delete that marker too, or `--clear` removes your CA and
its private key:

```bash
sudo rm -f /etc/wazuh/ca/.wazuh-dashboard-bootstrap-ca
```

Removing the package can still delete it with the rest of `/etc/wazuh`: see
[Upgrades and removal](#upgrades-and-removal).

## Container images

An image built by installing the package carries whatever the `postinst` resolved on the build host:
keystore entries, the AI Assistant key, the certificates and, when the install minted it, a
bootstrap CA **including its private key**. Every container started from that image would share
them. Clear them at the end of the image build:

```dockerfile
RUN /usr/share/wazuh-dashboard/bin/resolve-credentials --clear
```

Certificates are issued only in install mode, so run it once in the entrypoint before the first
start. It is idempotent, so a restarted container that already resolved is a no-op:

```bash
/usr/share/wazuh-dashboard/bin/resolve-credentials --install
```

`--clear` removes the `opensearch.username`, `opensearch.password` and
`wazuh_core.hosts.default.password` keystore entries, the AI Assistant key, the dashboard
certificates, and any staging directory an interrupted install left in `certs/`. It removes the
shared CA only when this dashboard minted it, as recorded by `.wazuh-dashboard-bootstrap-ca` in the
CA directory, and removes that marker with it. Any other CA is kept, and the output says why: one
with a private key but no marker was staged by you, and one without a private key was issued
elsewhere.

`--clear` must run as root and exits `1` otherwise. It also refuses to run while the dashboard is
running.

## Upgrades and removal

An upgrade resolves only what the keystore does not already hold. Once both entries exist, step 1
applies to both and nothing changes, whatever the credentials file contains. An upgrade never
generates the AI Assistant key and never looks at the certificates.

> **Note:** If you upgrade from a build that kept `wazuh_core.hosts.default.password` in
> `opensearch_dashboards.yml` and you accept the new packaged file, that password is gone from the
> file. Supply `WAZUH_MANAGER_WUI_PASSWORD` in `/etc/wazuh/credentials.env` before starting, or keep
> the setting in your file.

The dashboard owns no key in `/etc/wazuh/credentials.env`, so removing it never edits the file.
Whether the shared directory survives depends on what is still installed:

| Command                                | Effect on `/etc/wazuh`                                                        |
| -------------------------------------- | ----------------------------------------------------------------------------- |
| `apt remove wazuh-dashboard`           | untouched                                                                     |
| `apt purge wazuh-dashboard`            | removed, but only when neither `wazuh-indexer` nor `wazuh-manager` is present |
| `yum remove` / `dnf remove` / `rpm -e` | removed, but only when neither `wazuh-indexer` nor `wazuh-manager` is present |

On DEB, a package removed with its configuration files still on the host (`config-files` state)
counts as present. A CA relocated with `WAZUH_CA_DIR` is not removed.

## Rotation

Use `wazuh-passwords-tool.sh` to change a password on a running deployment. No rotation path updates
`/etc/wazuh/credentials.env`, so a value left there after a change is stale.

After the password of `kibanaserver` or `wazuh-wui` changes on the indexer or the Server API, update
the matching keystore entry as the service user and restart the dashboard. For example, for
`wazuh-wui`:

```bash
sudo -u wazuh-dashboard /usr/share/wazuh-dashboard/bin/opensearch-dashboards-keystore \
  add --force wazuh_core.hosts.default.password
sudo systemctl restart wazuh-dashboard
```

For `kibanaserver`, use the `opensearch.password` entry.
