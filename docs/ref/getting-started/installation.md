# Installation

Install and configure the Wazuh dashboard following step-by-step instructions. The Wazuh dashboard is a web interface for mining and visualizing the Wazuh server alerts and archived events.

> Note: You need root user privileges to run all the commands described below.

## Step by step

### Installing package dependencies

Install the following packages if missing.

- RPM-based operating system:

```console
sudo yum install libcap
```

- Debian-based operating system:

```console
sudo apt-get install debhelper tar curl libcap2-bin #debhelper version 9 or later
```

### Installing Wazuh dashboard

#### Installing with package manager

<div class='warning'>The packages are not hosted in the Wazuh repository at the moment, so you must download the package from the internal resource and <a href='#install-local-package'>install the local package</a>.</div>

##### Adding the Wazuh repository

> Note: If you are installing the Wazuh dashboard on the same host as the Wazuh indexer or the Wazuh server, you may skip these steps as you may have added the Wazuh repository already.

- RPM-based operating system:

Import the GPG key.

```console
sudo rpm --import https://packages.wazuh.com/key/GPG-KEY-WAZUH
```

Add the repository.

```console
sudo echo -e '[wazuh]\ngpgcheck=1\ngpgkey=https://packages.wazuh.com/key/GPG-KEY-WAZUH\nenabled=1\nname=EL-$releasever - Wazuh\nbaseurl=https://packages.wazuh.com/4.x/yum/\nprotect=1' | sudo tee /etc/yum.repos.d/wazuh.repo
```

- Debian-based operating system:

Install the following packages if missing.

```console
sudo apt-get install gnupg apt-transport-https
```

Install the GPG key.

```console
sudo curl -s https://packages.wazuh.com/key/GPG-KEY-WAZUH | sudo gpg --no-default-keyring --keyring gnupg-ring:/usr/share/keyrings/wazuh.gpg --import && sudo chmod 644 /usr/share/keyrings/wazuh.gpg
```

Add the repository.

```console
sudo echo "deb [signed-by=/usr/share/keyrings/wazuh.gpg] https://packages.wazuh.com/4.x/apt/ stable main" | sudo tee -a /etc/apt/sources.list.d/wazuh.list
```

Update the packages information.

```console
sudo apt-get update
```

##### Installing the Wazuh dashboard

- RPM-based operating system:

```console
sudo yum -y install wazuh-dashboard
```

- Debian-based operating system:

```console
sudo apt-get -y install wazuh-dashboard
```

#### Installing from local package {#install-local-package}

This installation method assumes you have a local package of Wazuh dashboard.

- RPM-based operating system:

```console
sudo rpm -ivh /path/to/wazuh-dashboard.rpm
```

- Debian-based operating system:

```console
sudo dpkg -i /path/to/wazuh-dashboard.deb
```

### Configuring the Wazuh dashboard

Edit the `/etc/wazuh-dashboard/opensearch_dashboards.yml` file and replace the following values:

- `server.host`: This setting specifies the host of the Wazuh dashboard server. To allow remote users to connect, set the value to the IP address or DNS name of the Wazuh dashboard server. The value `0.0.0.0` will accept all the available IP addresses of the host.

- `opensearch.hosts`: The URLs of the Wazuh indexer instances to use for all your queries. The Wazuh dashboard can be configured to connect to multiple Wazuh indexer nodes in the same cluster. The addresses of the nodes can be separated by commas. For example, `["https://10.0.0.2:9200", "https://10.0.0.3:9200","https://10.0.0.4:9200"]`

Example:

```yaml
server.host: 0.0.0.0
opensearch.hosts: https://localhost:9200
```

### Deploying certificates

The configuration of certificates in Wazuh dashboard allows to enable TLS for HTTPS.

The default configuration defines that certificates should be located at `/etc/wazuh-dashboard/certs` directory:

- `root-ca.pem`: Root certificate that identifies to the root certificate authority (CA).
- `dashboard.pem`: Wazuh dashboard certificate.
- `dashboard-key.pem`: Wazuh dashboard certificate key.

```yml
server.ssl.enabled: true
server.ssl.key: '/etc/wazuh-dashboard/certs/dashboard-key.pem'
server.ssl.certificate: '/etc/wazuh-dashboard/certs/dashboard.pem'
opensearch.ssl.verificationMode: certificate
opensearch.ssl.certificateAuthorities:
  ['/etc/wazuh-dashboard/certs/root-ca.pem']
```

You can configure self-signed or from a trusted CA certificates.

Ensure the certificates files have the following permissions:

- only read by the owner user: `400`
- owned by `wazuh-dashboard` user and `wazuh-dashboard` group

#### Using the wazuh-certificates.tar file

> Note: Make sure that a copy of the `wazuh-certificates.tar` file, created during the initial configuration step, is placed in your working directory.

Replace `<DASHBOARD_NODE_NAME>` with your Wazuh dashboard node name, the same one used in `config.yml` to create the certificates, and move the certificates to their corresponding location.

```console
NODE_NAME=<DASHBOARD_NODE_NAME>
```

```console
sudo mkdir /etc/wazuh-dashboard/certs
sudo tar -xf ./wazuh-certificates.tar -C /etc/wazuh-dashboard/certs/ ./$NODE_NAME.pem ./$NODE_NAME-key.pem ./root-ca.pem
sudo mv -n /etc/wazuh-dashboard/certs/$NODE_NAME.pem /etc/wazuh-dashboard/certs/dashboard.pem
sudo mv -n /etc/wazuh-dashboard/certs/$NODE_NAME-key.pem /etc/wazuh-dashboard/certs/dashboard-key.pem
sudo chmod 500 /etc/wazuh-dashboard/certs
sudo chmod 400 /etc/wazuh-dashboard/certs/*
sudo chown -R wazuh-dashboard:wazuh-dashboard /etc/wazuh-dashboard/certs
```

#### Using other certificates

Create the directory to store the certificates, copy the files and set the permissions:

Replace:

- `<WAZUH_DASHBOARD_ROOT_CA_PATH>` with the path to the root CA file.
- `<WAZUH_DASHBOARD_CERTIFICATE_PATH>` with the path to the Wazuh dashboard certificate file.
- `<WAZUH_DASHBOARD_CERTIFICATE_KEY_PATH>` with the path to Wazuh dashboard certificate key file.

```console
WAZUH_DASHBOARD_ROOT_CA_PATH=<WAZUH_DASHBOARD_ROOT_CA_PATH>
WAZUH_DASHBOARD_CERTIFICATE_PATH=<WAZUH_DASHBOARD_CERTIFICATE_PATH>
WAZUH_DASHBOARD_CERTIFICATE_KEY_PATH=<WAZUH_DASHBOARD_CERTIFICATE_KEY_PATH>
```

```console
sudo mkdir /etc/wazuh-dashboard/certs
sudo cp -n "$WAZUH_DASHBOARD_ROOT_CA_PATH" /etc/wazuh-dashboard/certs/root-ca.pem
sudo cp -n "$WAZUH_DASHBOARD_CERTIFICATE_PATH" /etc/wazuh-dashboard/certs/dashboard.pem
sudo cp -n "$WAZUH_DASHBOARD_CERTIFICATE_KEY_PATH" /etc/wazuh-dashboard/certs/dashboard-key.pem
sudo chmod 500 /etc/wazuh-dashboard/certs
sudo chmod 400 /etc/wazuh-dashboard/certs/*
sudo chown -R wazuh-dashboard:wazuh-dashboard /etc/wazuh-dashboard/certs
```

### Starting the Wazuh dashboard service

Enable and start the Wazuh dashboard service.

- **Systemd**:

```console
sudo systemctl daemon-reload
sudo systemctl enable wazuh-dashboard
sudo systemctl start wazuh-dashboard
```

- **SysV init** in RPM-based operating system:

```console
sudo chkconfig --add wazuh-dashboard
sudo service wazuh-dashboard start
```

- **SysV init** in Debian-based operating system:

```console
sudo update-rc.d wazuh-dashboard defaults 95 10
sudo service wazuh-dashboard start
```

### Access the Wazuh web interface with your credentials.

- **URL**: `https://<WAZUH_DASHBOARD_IP_ADDRESS>`
- **Username**: `admin`
- **Password**: `admin`

When you access the Wazuh dashboard for the first time, if you configured self-signed certificates, the browser shows a warning message stating that the certificate was not issued by a trusted authority. An exception can be added in the advanced options of the web browser. For increased security, the `root-ca.pem` file can be imported to the certificate manager of the browser. Alternatively, a certificate from a trusted authority can be configured.

### Post-installation

#### Prevent accidental upgrades

If you added the Wazuh package repository, then **we recommend disabling the Wazuh package repository after installation** to prevent accidental upgrades that could break the environment.

Execute the following command to disable the Wazuh repository:

- RPM-based operating system:

```console
sudo sed -i "s/^enabled=1/enabled=0/" /etc/yum.repos.d/wazuh.repo
```

- Debian-based operating system:

```
sudo sed -i "s/^deb /#deb /" /etc/apt/sources.list.d/wazuh.list
sudo apt update
```
