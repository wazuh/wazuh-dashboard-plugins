# Installing the Wazuh dashboard step by step

Install and configure the Wazuh dashboard following step-by-step instructions. The Wazuh dashboard is a web interface for mining and visualizing the Wazuh server alerts and archived events.

> **Note:** You need root user privileges to run all the commands described below.

## Wazuh dashboard installation

Follow these steps to install the Wazuh dashboard.

### Installing package dependencies

1. Install the following packages if missing.

#### APT

```bash
apt-get install tar curl libcap2-bin openssl
```

#### Yum

```bash
yum install libcap openssl diffutils util-linux
```

#### DNF

```bash
dnf install libcap openssl diffutils util-linux
```

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
  - `run_as`: This defines how the dashboard requests the data, using the default configured account (`false`) or the current user's context (`true`).

  Do not set the `password` of the `default` host in this file. The package stores it in the keystore from `WAZUH_MANAGER_WUI_PASSWORD`, as described in [Credentials and certificates](#credentials-and-certificates). A value set in the file takes precedence and is never overridden.

```yaml
server.host: 0.0.0.0
server.port: 443
opensearch.hosts: https://localhost:9200
opensearch.ssl.verificationMode: certificate
---
wazuh_core.hosts:
  default:
    url: https://localhost
    port: 55000
    username: wazuh-wui
    run_as: false
```

### Credentials and certificates

The package resolves the dashboard credentials and its TLS certificates during installation, and
checks the credentials again immediately before the service starts. No default password is shipped.

- **Passwords**: the dashboard stores the `kibanaserver` (indexer) and `wazuh-wui` (Server API)
  passwords in its keystore, reading them from `/etc/wazuh/credentials.env`. It never generates
  them.
- **Certificates**: a fresh install issues `dashboard.pem` and `dashboard-key.pem`, and installs
  `root-ca.pem`, in `/etc/wazuh-dashboard/certs/`, from the Wazuh root CA shared with the other
  components (`/etc/wazuh/ca`). If no component has created that CA yet, the install creates it.
- **AI Assistant**: a fresh install generates `wazuh_ai_assistant.encryptionKey` in the keystore.

If the Wazuh indexer and the Wazuh manager are installed on the same host, their packages publish
the passwords themselves and there is nothing to do. Install order does not matter: whatever the
dashboard could not resolve at install time is resolved when it starts.

If they run on other hosts, supply the passwords before starting the service. Replace
`<KIBANASERVER_PASSWORD>` and `<WAZUH_WUI_PASSWORD>` with the passwords of the `kibanaserver` account
on the indexer and the `wazuh-wui` account on the Server API:

```bash
install -d -m 0700 -o root -g root /etc/wazuh
touch /etc/wazuh/credentials.env && chmod 0600 /etc/wazuh/credentials.env
tee -a /etc/wazuh/credentials.env > /dev/null <<'EOF'
WAZUH_INDEXER_KIBANASERVER_PASSWORD='<KIBANASERVER_PASSWORD>'
WAZUH_MANAGER_WUI_PASSWORD='<WAZUH_WUI_PASSWORD>'
EOF
```

Keep the file until every component is installed and running, then remove it as described in
[Removing the credentials file](#removing-the-credentials-file).

See **[Credentials](credentials.md)** for the full resolution order, the certificate flows, the
settings that customize the issued certificate, and what to do when the dashboard refuses to start.

#### Deploying certificates

Follow this step only to use certificates issued outside the host, for example in a distributed
deployment or with your own PKI. A pair already in `/etc/wazuh-dashboard/certs/` is never replaced:
place it **before** installing the package so the install issues nothing, or afterwards to overwrite
the pair it issued.

> **Note:** Make sure that a copy of the `wazuh-certificates.tar` file, created during the initial configuration step, is placed in your working directory.

1. Replace `<DASHBOARD_NODE_NAME>` with your Wazuh dashboard node name, the same one used in `config.yml` to create the certificates, and move the certificates to their corresponding location.

   ```bash
   NODE_NAME=<DASHBOARD_NODE_NAME>
   ```

   ```bash
   mkdir -p /etc/wazuh-dashboard/certs
   tar -xf ./wazuh-certificates.tar -C /etc/wazuh-dashboard/certs/ ./$NODE_NAME.pem ./$NODE_NAME-key.pem ./root-ca.pem
   mv -f /etc/wazuh-dashboard/certs/$NODE_NAME.pem /etc/wazuh-dashboard/certs/dashboard.pem
   mv -f /etc/wazuh-dashboard/certs/$NODE_NAME-key.pem /etc/wazuh-dashboard/certs/dashboard-key.pem
   chmod 500 /etc/wazuh-dashboard/certs
   chmod 400 /etc/wazuh-dashboard/certs/*
   chown -R wazuh-dashboard:wazuh-dashboard /etc/wazuh-dashboard/certs
   ```

   > **Note:** Before the package is installed, the `wazuh-dashboard` user does not exist and the
   > `chown` command fails. Skip it in that case: the package gives `/etc/wazuh-dashboard/certs/` to
   > `wazuh-dashboard` when it is installed.

2. If the install created a bootstrap CA in `/etc/wazuh/ca` and no other Wazuh component on the host
   uses it, delete it. A CA private key on a host that does not sign is exposure with no purpose.

   ```bash
   rm -rf /etc/wazuh/ca
   ```

### Starting the Wazuh dashboard service

The package does not start the service on a fresh install. Before the dashboard starts, the service
resolves the credentials again and refuses to start if a password is missing, naming the key in the
journal. See [When the dashboard does not start](credentials.md#when-the-dashboard-does-not-start).

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

2. Access the Wazuh web interface with your `admin` user credentials. This is the administrator account of the Wazuh indexer and it allows you to access the Wazuh dashboard.

   - **URL**: `https://<WAZUH_DASHBOARD_IP_ADDRESS>`
   - **Username**: `admin`
   - **Password**: the password generated for the `admin` user when the Wazuh indexer was installed. It is the value of `WAZUH_INDEXER_ADMIN_PASSWORD` in `/etc/wazuh/credentials.env` on the Wazuh indexer host:

     ```bash
     grep '^WAZUH_INDEXER_ADMIN_PASSWORD=' /etc/wazuh/credentials.env
     ```

     The value is quoted in the file; the quotes are not part of the password.

   When you access the Wazuh dashboard for the first time, the browser shows a warning message stating that the certificate was not issued by a trusted authority. An exception can be added in the advanced options of the web browser. For increased security, import the `/etc/wazuh-dashboard/certs/root-ca.pem` file into the certificate manager of the browser. Alternatively, you can configure a certificate from a trusted authority.

### Removing the credentials file

We recommend removing `/etc/wazuh/credentials.env` once the Wazuh indexer, the Wazuh manager and the Wazuh dashboard are installed, configured, and running. The file holds the plaintext passwords of the deployment, and the components no longer need it: each one has stored what it needs in its own keystore or database.

> **Important:** Do not remove the file earlier. Until every component is installed and has started successfully, the file is how the components hand credentials to one another. A component installed or started for the first time after the file is gone cannot resolve the passwords it needs.

1. Confirm that each component is running. On the Wazuh dashboard host:

   **Systemd:**

   ```bash
   systemctl status wazuh-dashboard
   ```

   **SysV init:**

   ```bash
   service wazuh-dashboard status
   ```

   Run the equivalent check for `wazuh-indexer` and `wazuh-manager` on their hosts, and log in to the Wazuh dashboard to confirm it reaches both of them.

2. If you need to keep a record of the generated passwords, for example the Server API `wazuh` user, copy them to your password manager first.

3. Remove the file on every host where it exists:

   ```bash
   rm /etc/wazuh/credentials.env
   ```

To add a component or node later, recreate the file with only the keys that component needs, as described in [Credentials and certificates](#credentials-and-certificates). See [The credentials file](credentials.md#the-credentials-file) for details.
