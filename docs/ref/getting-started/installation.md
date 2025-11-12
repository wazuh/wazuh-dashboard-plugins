# Installing the Wazuh dashboard step by step

Install and configure the Wazuh dashboard following step-by-step instructions. The Wazuh dashboard is a web interface for mining and visualizing the Wazuh server alerts and archived events.

> **Note:** You need root user privileges to run all the commands described below.

## Wazuh dashboard installation

Follow these steps to install the Wazuh dashboard.

### Installing package dependencies

1. Install the following packages if missing.

#### APT

```bash
apt-get install debhelper tar curl libcap2-bin #debhelper version 9 or later
```

#### Yum

```bash
yum install libcap
```

#### DNF

```bash
dnf install libcap
```

### Adding the Wazuh repository

> **Note:** If you are installing the Wazuh dashboard on the same host as the Wazuh indexer or the Wazuh server, you may skip these steps as you may have added the Wazuh repository already.

#### APT (Debian/Ubuntu)

Add the Wazuh repository to your APT sources.

1. Install the following packages if missing.

```bash
apt-get install gnupg apt-transport-https
```

2. Install the GPG key.

```bash
curl -s https://packages.wazuh.com/key/GPG-KEY-WAZUH | gpg --no-default-keyring --keyring gnupg-ring:/usr/share/keyrings/wazuh.gpg --import && chmod 644 /usr/share/keyrings/wazuh.gpg
```

3. Add the repository.

```bash
echo "deb [signed-by=/usr/share/keyrings/wazuh.gpg] https://packages.wazuh.com/5.x/apt/ stable main" | tee -a /etc/apt/sources.list.d/wazuh.list
```

4. Update the packages information.

```bash
apt-get update
```

#### Yum (RHEL/CentOS)

Add the Wazuh repository to your Yum configuration.

1. Import the GPG key.

```bash
rpm --import https://packages.wazuh.com/key/GPG-KEY-WAZUH
```

2. Add the repository.

- For RHEL-compatible systems version 8 and earlier, use the following command:

```bash
echo -e '[wazuh]\ngpgcheck=1\ngpgkey=https://packages.wazuh.com/key/GPG-KEY-WAZUH\nenabled=1\nname=EL-$releasever - Wazuh\nbaseurl=https://packages.wazuh.com/5.x/yum/\nprotect=1' | tee /etc/yum.repos.d/wazuh.repo
```

- For RHEL-compatible systems version 9 and later, use the following command:

```bash
echo -e '[wazuh]\ngpgcheck=1\ngpgkey=https://packages.wazuh.com/key/GPG-KEY-WAZUH\nenabled=1\nname=EL-$releasever - Wazuh\nbaseurl=https://packages.wazuh.com/5.x/yum/\npriority=1' | tee /etc/yum.repos.d/wazuh.repo
```

#### DNF (Fedora)

Add the Wazuh repository to your DNF configuration.

1. Import the GPG key.

```bash
rpm --import https://packages.wazuh.com/key/GPG-KEY-WAZUH
```

2. Add the repository.

```bash
echo -e '[wazuh]\ngpgcheck=1\ngpgkey=https://packages.wazuh.com/key/GPG-KEY-WAZUH\nenabled=1\nname=EL-$releasever - Wazuh\nbaseurl=https://packages.wazuh.com/5.x/yum/\npriority=1' | tee /etc/yum.repos.d/wazuh.repo
```

### Installing the Wazuh dashboard

1. Install the Wazuh dashboard package.

   **APT:**

   ```bash
   apt-get -y install wazuh-dashboard
   ```

   **Yum:**

   ```bash
   yum -y install wazuh-dashboard
   ```

   **DNF:**

   ```bash
   dnf -y install wazuh-dashboard
   ```

### Configuring the Wazuh dashboard

1. Edit the `/etc/wazuh-dashboard/opensearch_dashboards.yml` file and replace the following values:

   - **`server.host`**: This setting specifies the host of the Wazuh dashboard server. To allow remote users to connect, set the value to the IP address or DNS name of the Wazuh dashboard server. The value `0.0.0.0` will accept all the available IP addresses of the host.

   - **`opensearch.hosts`**: The URLs of the Wazuh indexer instances to use for all your queries. The Wazuh dashboard can be configured to connect to multiple Wazuh indexer nodes in the same cluster. The addresses of the nodes can be separated by commas. For example, `["https://10.0.0.2:9200", "https://10.0.0.3:9200","https://10.0.0.4:9200"]`

   ```yaml
   server.host: 0.0.0.0
   server.port: 443
   opensearch.hosts: https://localhost:9200
   opensearch.ssl.verificationMode: certificate
   ```

### Deploying certificates

> **Note:** Make sure that a copy of the `wazuh-certificates.tar` file, created during the initial configuration step, is placed in your working directory.

1. Replace `<DASHBOARD_NODE_NAME>` with your Wazuh dashboard node name, the same one used in `config.yml` to create the certificates, and move the certificates to their corresponding location.

   ```bash
   NODE_NAME=<DASHBOARD_NODE_NAME>
   ```

   ```bash
   mkdir /etc/wazuh-dashboard/certs
   tar -xf ./wazuh-certificates.tar -C /etc/wazuh-dashboard/certs/ ./$NODE_NAME.pem ./$NODE_NAME-key.pem ./root-ca.pem
   mv -n /etc/wazuh-dashboard/certs/$NODE_NAME.pem /etc/wazuh-dashboard/certs/dashboard.pem
   mv -n /etc/wazuh-dashboard/certs/$NODE_NAME-key.pem /etc/wazuh-dashboard/certs/dashboard-key.pem
   chmod 500 /etc/wazuh-dashboard/certs
   chmod 400 /etc/wazuh-dashboard/certs/*
   chown -R wazuh-dashboard:wazuh-dashboard /etc/wazuh-dashboard/certs
   ```

### Starting the Wazuh dashboard service

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

2. Edit the `/usr/share/wazuh-dashboard/data/wazuh/config/wazuh.yml` file and replace `<WAZUH_SERVER_IP_ADDRESS>` with the IP address or hostname of the Wazuh server master node.

   ```yaml
   hosts:
     - default:
         url: https://<WAZUH_SERVER_IP_ADDRESS>
         port: 55000
         username: wazuh-wui
         password: wazuh-wui
         run_as: false
   ```

3. Access the Wazuh web interface with your `admin` user credentials. This is the default administrator account for the Wazuh indexer and it allows you to access the Wazuh dashboard.

   - **URL**: `https://<WAZUH_DASHBOARD_IP_ADDRESS>`
   - **Username**: `admin`
   - **Password**: `admin`

   When you access the Wazuh dashboard for the first time, the browser shows a warning message stating that the certificate was not issued by a trusted authority. An exception can be added in the advanced options of the web browser. For increased security, the `root-ca.pem` file previously generated can be imported to the certificate manager of the browser. Alternatively, you can configure a certificate from a trusted authority.
