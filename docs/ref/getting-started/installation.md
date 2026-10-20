# Installing the Wazuh dashboard step by step

Install and configure the Wazuh dashboard following step-by-step instructions. The Wazuh dashboard is a web interface for mining and visualizing the Wazuh server alerts and archived events.

> **Note:** You need root user privileges to run all the commands described below.

## Wazuh dashboard installation

Follow these steps to install the Wazuh dashboard.

### Installing package dependencies

The package declares its own dependencies, so the package manager installs anything missing. Only
`curl` is needed to download the package and to run the verification commands in this guide.

### Downloading the package

See the [Package Download](packages.md#download-packages) section for available repositories and download instructions.

### Installing the Wazuh dashboard

1. Install the Wazuh dashboard package.

   **Debian-based:**

   ```bash
   dpkg -i wazuh-dashboard_<VERSION>-<REVISION>_<ARCHITECTURE>.deb
   ```

   **RHEL/CentOS-based:**

   ```bash
   yum localinstall wazuh-dashboard-<VERSION>-<REVISION>.<ARCHITECTURE>.rpm
   ```

   **RHEL/CentOS-based (DNF):**

   ```bash
   dnf localinstall wazuh-dashboard-<VERSION>-<REVISION>.<ARCHITECTURE>.rpm
   ```

### Configuring the Wazuh dashboard

Edit the `/etc/wazuh-dashboard/opensearch_dashboards.yml` file and replace the following values:

- **`server.host`**: This setting specifies the host of the Wazuh dashboard server. To allow remote users to connect, set the value to the IP address or DNS name of the Wazuh dashboard server. The value `0.0.0.0` will accept all the available IP addresses of the host.
- **`opensearch.hosts`**: The URLs of the Wazuh indexer instances to use for all your queries. The Wazuh dashboard can be configured to connect to multiple Wazuh indexer nodes in the same cluster. The addresses of the nodes can be separated by commas. For example, `["https://10.0.0.2:9200", "https://10.0.0.3:9200","https://10.0.0.4:9200"]`
- **`wazuh_core.hosts`**: The Wazuh server hosts that the dashboard will use to query the Wazuh server API. At least one host is required. Each host entry defined with an **unique ID** and must include:

  - `url`: The URL to the server API including the protocol and address (DNS or IP).
  - `port`: The port where is served.
  - `username`: The user that runs the requests.
  - `run_as`: This defines how the dashboard requests the data, using the default configured account (`false`) or the current user's context (`true`). Defaults to `true` when omitted.
  - `ca`: The CA certificate used to verify the server API certificate and host name. For the `default` host, `/etc/wazuh-dashboard/certs/manager-ca.pem`.

  Do not set the `password` of the `default` host in this file. The package stores it in the keystore from `WAZUH_MANAGER_WUI_PASSWORD`, as described in [Credentials and certificates](#credentials-and-certificates). A value set in the file takes precedence and is never overridden.

```yaml
server.host: 0.0.0.0
server.port: 443
opensearch.hosts: https://localhost:9200
opensearch.ssl.verificationMode: certificate
opensearch.ssl.certificateAuthorities:
  ['/etc/wazuh-dashboard/certs/indexer-ca.pem']
wazuh_core.hosts:
  default:
    url: https://localhost
    port: 55000
    username: wazuh-internal-client
    run_as: true
    ca: '/etc/wazuh-dashboard/certs/manager-ca.pem'
```

Each connection is verified with its own peer's CA: `opensearch.ssl.certificateAuthorities` names
the indexer CA and `wazuh_core.hosts.default.ca` names the manager CA. The `url` of the default host
must be a name or an address present in the manager's API certificate.

### Credentials and certificates

The package resolves the dashboard credentials and its TLS material during installation, and
checks them again immediately before the service starts. No default password and no shared
certificate authority (CA) is shipped.

- **Passwords**: the dashboard stores the `kibanaserver` (indexer) and `wazuh-internal-client`
  (manager API) passwords in its keystore. It never generates them: it reads them from the indexer's
  `/etc/wazuh-indexer/export/credentials.env` and the manager's
  `/etc/wazuh-manager/export/credentials.env` on the same host, or from
  `/etc/wazuh-dashboard/local.env` when you supply them.
- **Peer CAs**: the dashboard verifies the indexer with `certs/indexer-ca.pem` and the manager API
  with `certs/manager-ca.pem`, imported from the peers' `export/ca.pem` on the same host, or staged
  by you.
- **Own certificate**: a fresh install mints the dashboard CA in `/etc/wazuh-dashboard/ca/`, issues
  `dashboard.pem` and `dashboard-key.pem` in `/etc/wazuh-dashboard/certs/`, and publishes the CA
  certificate as `/etc/wazuh-dashboard/export/ca.pem`.
- **AI Assistant**: a fresh install generates `wazuh_ai_assistant.encryptionKey` in the keystore.
- **Session cookie**: a fresh install generates a random `opensearch_security.cookie.password` in the
  keystore, so each installation seals its session cookie with its own value. Nodes behind a load
  balancer must share one value: see [Session cookie password](credentials.md#session-cookie-password).

The steps depend on where the Wazuh indexer and the Wazuh manager run:

- On the same host: follow [Single host](#single-host). There is nothing to supply.
- On other hosts: follow [Dashboard on a separate host](#dashboard-on-a-separate-host) **before**
  installing the package.

See **[Credentials](credentials.md)** for the full resolution order, the `local.env` file, the peer
CA rules, the certificate flows, and what to do when the dashboard refuses to start.

#### Single host

When the three central components run on the same host, each one reads what it needs from the
others' `export/` directories, and no operator input is needed.

1. Install the Wazuh indexer, start it, and initialize its security configuration once:

   ```bash
   systemctl enable --now wazuh-indexer
   /usr/share/wazuh-indexer/bin/indexer-security-init.sh
   ```

2. Install the Wazuh manager and the Wazuh dashboard, in any order, and enable them. See
   [Starting the Wazuh dashboard service](#starting-the-wazuh-dashboard-service).
3. Log in as `admin`, as described in [Accessing the Wazuh dashboard](#accessing-the-wazuh-dashboard).

A dashboard started before the indexer or the manager is installed does not start: its start
reports the missing password (and, for the indexer, the missing CA), because the shipped
`opensearch_dashboards.yml` configures the `wazuh_core.hosts.default` host. systemd stops retrying
after three attempts, so once the missing peer is installed, start it again with:

```bash
systemctl reset-failed wazuh-dashboard
systemctl start wazuh-dashboard
```

Only when `WAZUH_MANAGER_WUI_PASSWORD` is set in `local.env` does a dashboard started before the
manager start: it serves indexer data but refuses the manager API until its next start after the
manager is installed.

#### Dashboard on a separate host

A dashboard on its own host has no peer `export/` directory to read from. Stage the indexer and
manager values on the dashboard host **before** installing the package.

1. Collect the values from the other hosts:

   | Value                                 | Where to find it                                                |
   | ------------------------------------- | --------------------------------------------------------------- |
   | `WAZUH_INDEXER_KIBANASERVER_PASSWORD` | `/etc/wazuh-indexer/export/credentials.env` on the indexer host |
   | Indexer CA certificate                | `/etc/wazuh-indexer/export/ca.pem` on the indexer host          |
   | `WAZUH_MANAGER_WUI_PASSWORD`          | `/etc/wazuh-manager/export/credentials.env` on the manager host |
   | Manager CA certificate                | `/etc/wazuh-manager/export/ca.pem` on the manager host          |

   In a manager cluster, use the values of the master node. The values in `credentials.env` may be
   quoted; the quotes are not part of the password.

2. Create the configuration directory and `local.env`. Replace `<KIBANASERVER_PASSWORD>` and
   `<WAZUH_INTERNAL_CLIENT_PASSWORD>` with the values collected in the previous step:

   ```bash
   mkdir -m 750 /etc/wazuh-dashboard /etc/wazuh-dashboard/certs
   install -m 600 /dev/null /etc/wazuh-dashboard/local.env
   cat > /etc/wazuh-dashboard/local.env <<'EOF'
   WAZUH_INDEXER_KIBANASERVER_PASSWORD='<KIBANASERVER_PASSWORD>'
   WAZUH_MANAGER_WUI_PASSWORD='<WAZUH_INTERNAL_CLIENT_PASSWORD>'
   EOF
   ```

   To choose the names in the dashboard certificate, add `WAZUH_DASHBOARD_CERT_SANS` to the same
   file. See [The local.env file](credentials.md#the-localenv-file).

3. Copy the indexer CA certificate as `indexer-ca.pem` and the manager CA certificate as
   `manager-ca.pem`. Replace `<INDEXER_CA_FILE>` and `<MANAGER_CA_FILE>` with the paths where you
   placed the copies of the two `export/ca.pem` files:

   ```bash
   install -m 640 <INDEXER_CA_FILE> /etc/wazuh-dashboard/certs/indexer-ca.pem
   install -m 640 <MANAGER_CA_FILE> /etc/wazuh-dashboard/certs/manager-ca.pem
   ```

   Staged CA files are never replaced by the package. To replace one later, overwrite it and restart
   the dashboard.

4. Install the package, as described in [Installing the Wazuh dashboard](#installing-the-wazuh-dashboard).
5. In `/etc/wazuh-dashboard/opensearch_dashboards.yml`:

   - Set `opensearch.hosts` to the Wazuh indexer nodes.
   - Set `wazuh_core.hosts.default.url` to the Wazuh manager, or the master node in a cluster. Use a
     name or an address present in the subject alternative names of the manager's API certificate
     (`apid.pem`): the dashboard refuses a manager API whose certificate does not match.

   See [Configuring the Wazuh dashboard](#configuring-the-wazuh-dashboard).

6. Start the dashboard, or restart it if it is already running. See
   [Starting the Wazuh dashboard service](#starting-the-wazuh-dashboard-service).

If a peer CA is still missing when the dashboard starts:

- **Indexer CA missing**: the dashboard does not start.
- **Manager CA missing**: the dashboard starts and serves indexer data, but refuses the manager API
  until the CA is in place and the dashboard is restarted.

To verify the deployment, check that the dashboard answers as `admin` and reaches the manager API with
verification on. Replace `<ADMIN_PASSWORD>` with the `admin` password and `<DASHBOARD_ADDRESS>` with
the address of the dashboard:

```bash
curl --cacert /etc/wazuh-dashboard/export/ca.pem -u 'admin:<ADMIN_PASSWORD>' \
  -o /dev/null -w '%{http_code}\n' https://<DASHBOARD_ADDRESS>/api/status
curl --cacert /etc/wazuh-dashboard/export/ca.pem -u 'admin:<ADMIN_PASSWORD>' \
  -H 'osd-xsrf: true' -H 'Content-Type: application/json' \
  -X POST https://<DASHBOARD_ADDRESS>/api/check-api -d '{"id":"default"}'
```

The first command prints `200`. The second returns the manager node and cluster names.

#### Deploying certificates

Follow this step only to use a dashboard certificate issued outside the host, for example with your
own PKI. A pair already in `/etc/wazuh-dashboard/certs/` is never replaced: place it **before**
installing the package so the install issues nothing, or afterwards to overwrite the pair it issued.

> **Note:** Make sure that a copy of the `wazuh-certificates.tar` file, created during the initial configuration step, is placed in your working directory.

1. Replace `<DASHBOARD_NODE_NAME>` with your Wazuh dashboard node name, the same one used in `config.yml` to create the certificates, and move the certificates to their corresponding location.

   ```bash
   NODE_NAME=<DASHBOARD_NODE_NAME>
   ```

   ```bash
   mkdir -m 750 -p /etc/wazuh-dashboard/certs
   tar -xf ./wazuh-certificates.tar -C /etc/wazuh-dashboard/certs/ ./$NODE_NAME.pem ./$NODE_NAME-key.pem
   mv -f /etc/wazuh-dashboard/certs/$NODE_NAME.pem /etc/wazuh-dashboard/certs/dashboard.pem
   mv -f /etc/wazuh-dashboard/certs/$NODE_NAME-key.pem /etc/wazuh-dashboard/certs/dashboard-key.pem
   chmod 640 /etc/wazuh-dashboard/certs/dashboard.pem /etc/wazuh-dashboard/certs/dashboard-key.pem
   chown -R root:wazuh-dashboard /etc/wazuh-dashboard/certs
   ```

   > **Note:** Before the package is installed, the `wazuh-dashboard` group does not exist and the
   > `chown` command fails. Skip it in that case: the package gives `/etc/wazuh-dashboard/certs/` to
   > `root:wazuh-dashboard` when it is installed.

2. The indexer and the manager API are still verified with `certs/indexer-ca.pem` and
   `certs/manager-ca.pem`. If your PKI also issued their certificates, stage its CA certificate as
   those files, as described in [Dashboard on a separate host](#dashboard-on-a-separate-host).

### Starting the Wazuh dashboard service

The package does not start the service on a fresh install. Before the dashboard starts, the service
resolves the credentials again and refuses to start if a password, the indexer CA or the
dashboard certificate is missing, naming each problem in the journal. See [When the dashboard does not start](credentials.md#when-the-dashboard-does-not-start).

1. Enable and start the Wazuh dashboard service.

   **Systemd:**

   ```bash
   systemctl daemon-reload
   systemctl enable wazuh-dashboard
   systemctl start wazuh-dashboard
   ```

   **SysV init:**
   Choose one option according to your operating system:

   - RPM-based operating system:

     ```bash
     chkconfig --add wazuh-dashboard
     service wazuh-dashboard start
     ```

   - Debian-based operating system:

     ```bash
     update-rc.d wazuh-dashboard defaults 95 10
     service wazuh-dashboard start
     ```

### Opening the firewall

The package opens no port. On RHEL and other distributions where `firewalld` runs by default, port
`443` is unreachable from other hosts until you open it:

```bash
firewall-cmd --permanent --add-port=443/tcp && firewall-cmd --reload
```

On other distributions, open TCP port `443` in the firewall in use, if any.

### Accessing the Wazuh dashboard

Access the Wazuh web interface with your `admin` user credentials. This is the administrator
account of the Wazuh indexer and it allows you to access the Wazuh dashboard.

- **URL**: `https://<WAZUH_DASHBOARD_IP_ADDRESS>`. The package install ends by printing this address.
- **Username**: `admin`
- **Password**: the password generated for the `admin` user when the Wazuh indexer was installed.
  It is the value of `WAZUH_INDEXER_ADMIN_PASSWORD` in `/etc/wazuh-indexer/export/credentials.env`
  on the Wazuh indexer host:

  ```bash
  grep '^WAZUH_INDEXER_ADMIN_PASSWORD=' /etc/wazuh-indexer/export/credentials.env
  ```

  If the value is quoted in the file, the quotes are not part of the password.

When you access the Wazuh dashboard for the first time, the browser shows a warning message stating
that the certificate was not issued by a trusted authority. An exception can be added in the
advanced options of the web browser. For increased security, import the
`/etc/wazuh-dashboard/export/ca.pem` file into the certificate manager of the browser.
Alternatively, you can configure a certificate from a trusted authority.
