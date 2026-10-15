# Credentials

The Wazuh dashboard ships no default password and no shared certificate authority. At installation,
and again every time the service starts, it resolves the passwords of the accounts it connects with,
the certificate authorities (CA) it verifies its peers with, and its own TLS certificate.

The packaged resolver, `/usr/share/wazuh-dashboard/bin/resolve-credentials`, does this work. It runs
from the package scripts and from the service start, so you do not need to run it by hand.

Certificates are the exception to "every start": the dashboard certificate is issued **once, at
installation**. A service start or a package upgrade never issues it again. See
[Certificates](#certificates).

## One directory per component

Each Wazuh central component owns exactly one configuration directory and shares nothing with the
others:

| Component       | Directory               | Publishes in `export/`                                                          |
| --------------- | ----------------------- | ------------------------------------------------------------------------------- |
| Wazuh indexer   | `/etc/wazuh-indexer/`   | `credentials.env` (including `kibanaserver` and `admin`), `ca.pem` (indexer CA) |
| Wazuh manager   | `/etc/wazuh-manager/`   | `credentials.env` (including `wazuh-internal-client`), `ca.pem` (manager CA)    |
| Wazuh dashboard | `/etc/wazuh-dashboard/` | `ca.pem` (dashboard CA)                                                         |

Each component mints its own CA and publishes what its peers need in its own `export/` directory.
On a single host, the dashboard reads the indexer and manager `export/` directories directly, read
only, after checking that they are owned by root. On a separate host there is no peer `export/`
directory, so you stage the values yourself before installing: see
[Dashboard on a separate host](installation.md#dashboard-on-a-separate-host).

The dashboard never creates or reads `/etc/wazuh`.

### The configuration directory

`/etc/wazuh-dashboard/` is owned by root. The service only reads it, through its group:

```
/etc/wazuh-dashboard                 root:wazuh-dashboard 0750
  opensearch_dashboards.yml          root:wazuh-dashboard 0640
  opensearch_dashboards.keystore     root:wazuh-dashboard 0640   passwords and the AI Assistant key
  local.env                          root:root            0600   optional, the operator's values
  ca/                                root:root            0700   the dashboard CA
    root-ca.pem, root-ca.key
    .wazuh-dashboard-bootstrap-ca                                this install minted the CA
  export/                            root:root            0700
    ca.pem                                                       the dashboard CA certificate
  certs/                             root:wazuh-dashboard 0750
    dashboard.pem, dashboard-key.pem                             the certificate served to browsers
    indexer-ca.pem                                               verifies the Wazuh indexer
    manager-ca.pem                                               verifies the manager API
    .indexer-ca.imported, .manager-ca.imported                   the package imported the file
```

Every file the resolver reads as root must be a regular file, not a symbolic link, owned by root and
writable by nobody else, in a directory with the same properties. Anything else is reported as
`UNSAFE <path>: <reason>` and is never used, repaired or followed. The check runs at every start.

## What the dashboard resolves

The dashboard owns neither account it connects with. Each password belongs to the component that
holds the account:

| Key                                   | Environment-only alias | Account                               | Published by                                | Written to the keystore as                                    |
| ------------------------------------- | ---------------------- | ------------------------------------- | ------------------------------------------- | ------------------------------------------------------------- |
| `WAZUH_INDEXER_KIBANASERVER_PASSWORD` | `INDEXER_PASSWORD`     | `kibanaserver` (Wazuh indexer)        | `/etc/wazuh-indexer/export/credentials.env` | `opensearch.username` (`kibanaserver`), `opensearch.password` |
| `WAZUH_MANAGER_WUI_PASSWORD`          | `API_PASSWORD`         | `wazuh-internal-client` (manager API) | `/etc/wazuh-manager/export/credentials.env` | `wazuh_core.hosts.default.password`                           |

The dashboard **consumes** both. It never generates them: a password the dashboard made up would not
be accepted by the indexer or the manager API.

It also verifies each peer with that peer's own CA, never with a merged bundle:

| File                                        | Imported from                      | Configured in `opensearch_dashboards.yml` |
| ------------------------------------------- | ---------------------------------- | ----------------------------------------- |
| `/etc/wazuh-dashboard/certs/indexer-ca.pem` | `/etc/wazuh-indexer/export/ca.pem` | `opensearch.ssl.certificateAuthorities`   |
| `/etc/wazuh-dashboard/certs/manager-ca.pem` | `/etc/wazuh-manager/export/ca.pem` | `wazuh_core.hosts.default.ca`             |

It **owns** three local assets:

- The [AI Assistant encryption key](#ai-assistant-encryption-key) (`wazuh_ai_assistant.encryptionKey`).
- Its [TLS certificate pair](#certificates).
- Its own CA, in `ca/`, published as `export/ca.pem`.

The aliases keep the variable names used by `wazuh-docker`. They are read from the process
environment only, never from a file.

`wazuh-internal-client` is a service account: the dashboard backend uses it to call the Server API
on behalf of the indexer user who logged in (`run_as`). It is not an account to log into the
dashboard with. It was named `wazuh-wui` before Wazuh 5.0.0; the credentials key keeps its `WUI`
name.

## The resolution order

For each of the two passwords, the resolver takes the first source that gives a value:

1. **Already in the keystore** (`/etc/wazuh-dashboard/opensearch_dashboards.keystore`): leave it
   untouched.
2. **Already set in `opensearch_dashboards.yml`**: leave it untouched. Nothing is written to the
   keystore.
3. **Set in the process environment**, as the scoped name first, then the alias: store it in the
   keystore.
4. **Set in [`/etc/wazuh-dashboard/local.env`](#the-localenv-file)**: store it in the keystore.
5. **Set in the publisher's `export/credentials.env`**, on the same host: store it in the keystore.
6. **None of the above**: the password is unresolved.

An empty value counts as no value. The dashboard adds step 2 because the keystore is merged over
`opensearch_dashboards.yml` when the dashboard starts. If the resolver wrote an entry for a setting
you already configured in the file, it would silently override your value. So a setting in the file
counts as resolved:

- If `opensearch.password` is set in `opensearch_dashboards.yml`, the `kibanaserver` password is not
  resolved.
- If `opensearch.username` is set in `opensearch_dashboards.yml`, the resolver stores only
  `opensearch.password`. It never writes `kibanaserver` over your username.
- If `wazuh_core.hosts.default.password` is set, or `wazuh_core.hosts` has no `default` entry, the
  `wazuh-internal-client` password is not needed. Passwords for other hosts are configured as
  described in [Define Wazuh server hosts](../configuration.md#define-wazuh-server-hosts).

### Accepted values

The password policy (12 to 64 characters from `A-Z a-z 0-9 . , _ + : @ % ^ = ~ -`, with at least
one lowercase letter, one uppercase letter, one digit and one symbol) is enforced by the components
that own the accounts, the indexer and the manager. The dashboard only rejects a value that its
keystore would not store verbatim, because `opensearch-dashboards-keystore add` trims the value and
parses it as JSON:

- A JSON value: a number, `true`, `false`, a quoted string, an array or an object.
- A value with leading or trailing whitespace.

An invalid value does not fall through to the next source. It is reported as `INVALID <KEY>`, and
the value itself is never printed.

## The local.env file

`/etc/wazuh-dashboard/local.env` holds the values that you, the operator, supply. It is optional: on
a single host the dashboard reads everything it needs from its peers' `export/` directories. You
need it when the indexer or the manager runs on another host, or to choose the names in the
dashboard certificate.

- The file is owned by `root:root` with mode `0600`. No package ships or creates it.
- It holds one `KEY=VALUE` per line. Values can be bare, single-quoted or double-quoted. Lines
  starting with `#` are comments. The file is **parsed, never sourced**, so nothing in it is ever
  executed.
- A file that is a symbolic link, or that is not owned by root, or that is readable or writable by
  another user (group or world), is reported as `UNSAFE` and ignored.

Supported keys:

| Key                                   | Used for                                                                                                                                                                                                              |
| ------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `WAZUH_INDEXER_KIBANASERVER_PASSWORD` | The password of the `kibanaserver` account on the Wazuh indexer.                                                                                                                                                      |
| `WAZUH_MANAGER_WUI_PASSWORD`          | The password of the `wazuh-internal-client` account on the manager API.                                                                                                                                               |
| `WAZUH_DASHBOARD_CERT_SANS`           | A comma-separated list of names and addresses for the dashboard certificate. See [The issued certificate](#the-issued-certificate). `localhost`, `127.0.0.1` and `::1` are always appended; an empty list is refused. |

Create it before installing the package, as described in
[Dashboard on a separate host](installation.md#dashboard-on-a-separate-host). Replace
`<KIBANASERVER_PASSWORD>` and `<WAZUH_INTERNAL_CLIENT_PASSWORD>` with the values of
`WAZUH_INDEXER_KIBANASERVER_PASSWORD` in `/etc/wazuh-indexer/export/credentials.env` on the indexer
host and of `WAZUH_MANAGER_WUI_PASSWORD` in `/etc/wazuh-manager/export/credentials.env` on the
manager host:

```bash
sudo mkdir -m 750 -p /etc/wazuh-dashboard
sudo install -m 600 -o root -g root /dev/null /etc/wazuh-dashboard/local.env
sudo tee /etc/wazuh-dashboard/local.env > /dev/null <<'EOF'
WAZUH_INDEXER_KIBANASERVER_PASSWORD='<KIBANASERVER_PASSWORD>'
WAZUH_MANAGER_WUI_PASSWORD='<WAZUH_INTERNAL_CLIENT_PASSWORD>'
EOF
```

> **Important:** Once a password is in the keystore, step 1 of the order wins. Editing `local.env`
> afterwards does not change what the dashboard uses. See [Rotation](#rotation).

After the dashboard has started successfully, both passwords are in its keystore and the passwords
in `local.env` are no longer read. You can remove them from the file; keep
`WAZUH_DASHBOARD_CERT_SANS` if you will [re-issue the certificate](#re-issuing-the-dashboard-certificate)
later.

### Supplying a value through the environment

The same key names, and the aliases, are read from the process environment, which overrides
`local.env`. On a package install, the value must be on the `sudo` command line. With `env_reset`
active, which is the default on every supported distribution, an exported variable never reaches the
maintainer script:

```bash
# Correct
sudo WAZUH_MANAGER_WUI_PASSWORD='<WAZUH_INTERNAL_CLIENT_PASSWORD>' apt-get install wazuh-dashboard

# Silently dropped: env_reset discards it
export WAZUH_MANAGER_WUI_PASSWORD='<WAZUH_INTERNAL_CLIENT_PASSWORD>'
sudo apt-get install wazuh-dashboard
```

That trap is why `local.env`, not the command line, is the recommended way to supply a value. For the
service start, the unit also reads `/etc/default/wazuh-dashboard` (Debian-based) and
`/etc/sysconfig/wazuh-dashboard` (RPM-based). The packages install `/etc/default/wazuh-dashboard` as
`root:wazuh-dashboard 0640`, because root reads it at every start: edit it as root. No package ships
`/etc/sysconfig/wazuh-dashboard`; if you create it, make it `root:wazuh-dashboard 0640` too.

## Peer certificate authorities

The dashboard keeps one CA file per peer in `/etc/wazuh-dashboard/certs/`: `indexer-ca.pem` and
`manager-ca.pem`. At installation and at every start, each file follows these rules:

1. **Staged.** The file is present and has no import marker (`.indexer-ca.imported` or
   `.manager-ca.imported`). It belongs to you, for example because the peer runs on another host or
   uses an external PKI. It is used as is and **never replaced**.
2. **Imported.** The file is absent, or present with its import marker. It is copied from the peer's
   `export/ca.pem` on the same host whenever the peer's copy differs. A peer reinstalled with a new CA
   is therefore picked up at the next dashboard start.
3. **Validated either way.** The file must be a valid, current CA certificate. Otherwise the start
   reports `INVALID <path>` and the dashboard does not start.

The two files are never merged: the indexer is verified only with `indexer-ca.pem`, and the manager
API only with `manager-ca.pem`. A certificate issued by the indexer CA is refused on the manager API
connection, and the other way round.

### When a peer CA is missing

- **Indexer CA missing.** The dashboard does not start. The journal shows
  `MISSING /etc/wazuh-dashboard/certs/indexer-ca.pem: no CA to verify the indexer with`.
- **Manager CA missing.** When the manager password is resolved (for example from `local.env`), the
  dashboard starts and serves indexer data, but refuses every manager API connection until the CA
  is in place. The journal shows
  `warning: MISSING /etc/wazuh-dashboard/certs/manager-ca.pem: the Server API connection is refused until it is present; once wazuh-manager is installed, the next start imports it`,
  and the dashboard reports that it cannot reach the manager API. Without the manager password, the
  dashboard does not start at all: the start also reports `MISSING WAZUH_MANAGER_WUI_PASSWORD`.
- **Peer CA invalid.** An `indexer-ca.pem` or `manager-ca.pem` that is not a valid, current CA
  certificate stops the start with `INVALID <path>`, for either peer.

On a single host, install the missing peer and restart the dashboard: the next start imports its CA.
On a separate host, copy the peer's `export/ca.pem` as described in
[Dashboard on a separate host](installation.md#dashboard-on-a-separate-host), then restart the
dashboard.

### Manager API verification

Since Wazuh 5.0.0 the dashboard refuses any manager API it cannot verify, for every host that sets
`ca` in `wazuh_core.hosts` (the shipped `default` host does). A host without `ca` is not verified.
Besides the CA, the host name is checked: `wazuh_core.hosts.default.url` must be a name or an address
present in the subject alternative names of the manager's API certificate (`apid.pem`). A connection
to a name outside that list is refused, and no credentials are sent. To add a name, re-issue the
manager's API certificate as described in the manager documentation.

## Installing and starting

The installer stores what it can and has no opinion about whether the dashboard can run. It exits
`0` whatever it could not resolve. It ends by printing the dashboard address and where to find the
`admin` password. You start the service when you are ready:

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now wazuh-dashboard
```

On a single host, install order does not matter. A dashboard installed before the indexer or the
manager resolves nothing from them at install time. When you start it, the resolver runs the whole
order again, picks up what the peers published since, and stores it.

| Moment                | Resolver mode | Passwords                                 | AI Assistant key    | Peer CAs                                          | Dashboard certificate |
| --------------------- | ------------- | ----------------------------------------- | ------------------- | ------------------------------------------------- | --------------------- |
| Fresh package install | `--install`   | resolved; never fails                     | generated if absent | imported                                          | issued if missing     |
| Package upgrade       | `--upgrade`   | resolved; never fails                     | not generated       | not touched                                       | not touched           |
| Every service start   | `--prestart`  | resolved; **refuses to start** if missing | generated if absent | imported; **refuses** if the indexer's is missing | not touched           |

The start step runs from `ExecStartPre=+` in `wazuh-dashboard.service`. The unit also sets
`StartLimitBurst=3` and `StartLimitIntervalSec=60`, so a dashboard that cannot resolve its
credentials stops retrying after three attempts in one minute instead of flooding the journal. Run
`systemctl reset-failed wazuh-dashboard` before starting it again. Set `WAZUH_DASHBOARD_VERBOSE=1`
in the environment to print detail lines.

## When the dashboard does not start

When something required is missing at start, the dashboard refuses to start and prints one line per
problem. There is no repair command: fix the problem and start the service again.

```
$ sudo systemctl enable --now wazuh-dashboard
Job for wazuh-dashboard.service failed.

$ journalctl -u wazuh-dashboard -n 50
  resolve-credentials: MISSING WAZUH_MANAGER_WUI_PASSWORD (the manager's wazuh-internal-client account)
  resolve-credentials:         set it in /etc/wazuh-dashboard/local.env, or install wazuh-manager on this host first
```

1. Read the journal: `journalctl -u wazuh-dashboard -n 50`.
2. Fix the reported problem, for example by setting the missing key in
   `/etc/wazuh-dashboard/local.env`.
3. Start the service again: `sudo systemctl start wazuh-dashboard`. If systemd reports that the start
   limit was hit, run `sudo systemctl reset-failed wazuh-dashboard` first.

| Message                                             | Meaning                                                                                                                                                    |
| --------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `MISSING WAZUH_INDEXER_KIBANASERVER_PASSWORD`       | No source gives the `kibanaserver` password. Set it in `local.env`, or install `wazuh-indexer` on this host first.                                         |
| `MISSING WAZUH_MANAGER_WUI_PASSWORD`                | No source gives the `wazuh-internal-client` password. Set it in `local.env`, or install `wazuh-manager` on this host first.                                |
| `INVALID <KEY>`                                     | The value is JSON or has surrounding whitespace. Correct it and start the service again.                                                                   |
| `MISSING /etc/wazuh-dashboard/certs/indexer-ca.pem` | No CA to verify the indexer with. Install `wazuh-indexer` on this host first, or stage the indexer CA.                                                     |
| `INVALID /etc/wazuh-dashboard/certs/<peer>-ca.pem`  | The file is not a valid, current CA certificate. Replace it with the peer's `export/ca.pem`.                                                               |
| `MISSING /etc/wazuh-dashboard/certs/dashboard.pem`  | The dashboard has no TLS certificate. [Re-issue it](#re-issuing-the-dashboard-certificate) or provision your own pair.                                     |
| `UNSAFE <path>: <reason>`                           | The file or its directory is a symbolic link, is not owned by root, or is writable by another user (`local.env`: or readable). Fix its ownership and mode. |
| `MISSING keystore`                                  | `/etc/wazuh-dashboard/opensearch_dashboards.keystore` could not be created or read.                                                                        |

The start step checks **presence and format only**. It never opens a network connection, because
making the start depend on reaching a peer would break boot ordering and cluster restarts. A
password that is present but wrong still fails at runtime as a `401` from the indexer or the Server
API.

No value is ever printed, in the installer output or in the journal. An invalid value is reported by
the name of its key.

## AI Assistant encryption key

The [AI Assistant](../modules/ai-assistant/configuration.md) encrypts the provider API keys it stores
with `wazuh_ai_assistant.encryptionKey`. The resolver generates that key (32 random bytes, base64)
straight into the keystore:

- At a fresh install and at every start, when neither the keystore nor `opensearch_dashboards.yml`
  has it.
- Never at upgrade: an upgrade adds no secret you did not already have.
- Never as a replacement for an existing key, because the key is required to decrypt the API keys
  already stored.

The key is never written to any other file and never printed. If it cannot be generated, a warning
is logged and the dashboard starts anyway, because the AI Assistant is optional.

## Certificates

`opensearch_dashboards.yml` serves HTTPS with a certificate pair:

| File                                           | Used for                           |
| ---------------------------------------------- | ---------------------------------- |
| `/etc/wazuh-dashboard/certs/dashboard.pem`     | The certificate served to browsers |
| `/etc/wazuh-dashboard/certs/dashboard-key.pem` | Its private key                    |

### Issued at installation, and at no other moment

A fresh install issues the pair when both files are missing. A service start or a package upgrade
never issues it, so a pair you replaced survives every upgrade. Every start still checks that both
files are present, owned by root, not writable by another user, and not symbolic links.

| Pair in `certs/` | CA in `ca/`                     | Result                                                                                           |
| ---------------- | ------------------------------- | ------------------------------------------------------------------------------------------------ |
| both files       | anything                        | kept as it is                                                                                    |
| one of the two   | anything                        | **nothing issued**: a partial pair is refused, not completed                                     |
| none             | none                            | mint the dashboard CA, mark it with `.wazuh-dashboard-bootstrap-ca`, then issue the pair from it |
| none             | `root-ca.pem` and `root-ca.key` | issue the pair from that CA                                                                      |

In every case where the pair is issued, the CA certificate is published as
`/etc/wazuh-dashboard/export/ca.pem`. A CA you staged in `ca/` yourself has no marker: it is
validated, used as is, and never removed by the resolver. Removing the RPM package (`rpm -e`,
`yum remove`, `dnf remove`) deletes `ca/` with its private key, staged or not: back it up first.
Removing the DEB package keeps it.

When the install issues nothing, it says so and still exits `0`. The dashboard then has no
certificate and does not start until you provision one:

```
resolve-credentials: the dashboard has no TLS certificates and this install could not issue them
resolve-credentials:         provision dashboard.pem and dashboard-key.pem into /etc/wazuh-dashboard/certs
```

### The issued certificate

| Property                  | Value                                                                                                                       |
| ------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Key and signature         | RSA 2048, SHA-256                                                                                                           |
| Validity                  | 10 years, backdated one day                                                                                                 |
| Extended key usage        | `serverAuth`, `clientAuth`                                                                                                  |
| Common name               | The host name                                                                                                               |
| Subject alternative names | `WAZUH_DASHBOARD_CERT_SANS`, or by default the host name, the FQDN and every global address of the default-route interfaces |
| Issuer                    | The dashboard CA (`CN=wazuh-dashboard-<host>, OU=Wazuh, O=Wazuh, L=California, C=US`, 10 years)                             |

`dashboard.pem` holds the certificate followed by the CA certificate.

`WAZUH_DASHBOARD_CERT_SANS` is an exact, comma-separated list. Each entry is `DNS:`, `IP:` or
untyped; an untyped entry is an IP address when it parses as one, and a DNS name otherwise. The
variable **replaces** the derived list; it does not extend it. `localhost`, `127.0.0.1` and `::1` are
appended either way. An empty list is refused. Set it in `local.env`, or in the environment, before
installing:

```sh
WAZUH_DASHBOARD_CERT_SANS='DNS:dashboard.corp.local,IP:10.0.1.12'
```

The browser warns about a certificate issued by the dashboard CA. Import
`/etc/wazuh-dashboard/export/ca.pem` into the browser's certificate store, or replace the pair with
one from a trusted authority.

### Re-issuing the dashboard certificate

Changing `WAZUH_DASHBOARD_CERT_SANS` later renews nothing. To re-issue the certificate, for example
after adding a name or an address:

1. Remove the current pair:

   ```bash
   sudo rm /etc/wazuh-dashboard/certs/dashboard.pem /etc/wazuh-dashboard/certs/dashboard-key.pem
   ```

2. Adjust `WAZUH_DASHBOARD_CERT_SANS` in `/etc/wazuh-dashboard/local.env` if needed.
3. Run the install mode of the resolver:

   ```bash
   sudo /usr/share/wazuh-dashboard/bin/resolve-credentials --install
   ```

4. Restart the dashboard:

   ```bash
   sudo systemctl restart wazuh-dashboard
   ```

The new pair is issued from the same dashboard CA, so a browser that already trusts
`export/ca.pem` keeps trusting it. After an RPM removal and reinstall, `ca/` and `export/` are gone,
so the re-issue mints a new dashboard CA: import the new `export/ca.pem` in the browsers again.

### Using certificates issued elsewhere

A corporate PKI or the Wazuh installation assistant's `wazuh-certs-tool` can issue the dashboard
certificate outside the host. Place `dashboard.pem` and `dashboard-key.pem` in
`/etc/wazuh-dashboard/certs/`, either **before** installing the package, so the install issues
nothing, or afterwards, overwriting the pair it issued. After that, every start checks only their
presence, owner and mode. See [Deploying certificates](installation.md#deploying-certificates).

The files must be owned by `root:wazuh-dashboard` with mode `0640`, in a `certs/` directory owned by
`root:wazuh-dashboard` with mode `0750`. Files placed before installing get that group and mode from
the package, because the group does not exist yet. Files placed after installing need them set by
hand.

## Container images

An image built by installing the package carries whatever the `postinst` resolved on the build host:
keystore entries, the AI Assistant key, the certificate pair, the imported peer CAs and the
dashboard CA **including its private key**. Every container started from that image would share
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
certificate pair, the imported peer CAs, the contents of `export/`, and the dashboard CA when this
dashboard minted it (as recorded by `.wazuh-dashboard-bootstrap-ca`). A CA or a peer CA file you
staged is kept.

`--clear` must run as root. It refuses to run while the dashboard is running.

## Upgrades and removal

An upgrade resolves only what the keystore does not already hold. It keeps the passwords, the
keystore, the AI Assistant key, the dashboard certificate and CA, and the imported or staged peer
CAs. It does not issue certificates or generate new secrets.

> **Note:** The packaged `opensearch_dashboards.yml` sets no `wazuh_core.hosts.default.password`,
> and verifies each peer with `certs/indexer-ca.pem` and `certs/manager-ca.pem`. If you keep your own
> file across an upgrade, check that `opensearch.ssl.certificateAuthorities` and
> `wazuh_core.hosts.default.ca` point at those files.

| Command                                | Effect on `/etc/wazuh-dashboard`                                                                                    |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `apt remove wazuh-dashboard`           | kept                                                                                                                |
| `apt purge wazuh-dashboard`            | removed, together with the `wazuh-dashboard` account                                                                |
| `yum remove` / `dnf remove` / `rpm -e` | `ca/` and `export/` removed; the rest kept, owned by root with no group or other access. Reinstalling takes it back |

Removing the dashboard never touches another component's directory.

## Rotation

Use `wazuh-passwords-tool.sh` to change a password on a running deployment. The dashboard does not
follow a change on its own, because a password already in the keystore always wins.

After the password of `kibanaserver` or `wazuh-internal-client` changes on the indexer or the manager
API, remove the matching keystore entry, supply the new value, and restart the dashboard. The next
start stores the new value. For example, for `wazuh-internal-client`:

```bash
sudo /usr/share/wazuh-dashboard/bin/opensearch-dashboards-keystore remove \
  wazuh_core.hosts.default.password --allow-root
```

Then set the new value as `WAZUH_MANAGER_WUI_PASSWORD` in `/etc/wazuh-dashboard/local.env`, which
takes precedence over the manager's `export/credentials.env`, and restart:

```bash
sudo systemctl restart wazuh-dashboard
```

For `kibanaserver`, remove the `opensearch.password` entry and set
`WAZUH_INDEXER_KIBANASERVER_PASSWORD`.
