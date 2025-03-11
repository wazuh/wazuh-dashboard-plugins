# Wazuh development with Wazuh Stack

## Requirements

- vm.max_map_count=262144

  To modify the vm.max_map_count, you can run this command:
  `sudo sysctl -w vm.max_map_count=262144`

- jq

  To install jq, you can run this command:

  - In Debian/Ubuntu os:
    `sudo apt-get install jq`
  - In RedHat/CentOS:
    `sudo yum install jq`
  - In Arch:
    `sudo pacman -Sy --noconfirm jq`
  - In MAC:
    `brew install jq in MAC OS`

## Usage

Use always the provided script to bring up or down the development
environment. For example:

```
./dev.sh [-os <os_version>] [-osd <osd_version>] [--wz-home <wazuh_app_source>] [-saml] [--server <server_version>] -a, --action <action>
```

use `--help` for more info.

The script will ask you all the required parameters to bring up the
environment, including the version of the elastic stack you want to
develop for, and the source code folder where the `wazuh-dashboard-plugins` is
located.

Use the `saml` flag to bring up KeyCloak IDP. **Add idp to your hosts and start
the server using the `--no-base-path`**.

```apacheconf
# Linux systems: /etc/hosts
# Windows systems: C:\Windows\System32\drivers\etc\hosts
127.0.0.1 idp
```

**The script will not select the appropriate version of the
`wazuh-dashboard-plugins` to use, so be sure to check out the appropriate
version before bringing up the environment!**

### UI Credentials

The default user and password to access the UI at https://0.0.0.0:5601/ are:

```
admin:admin
```

## Notes

`Wazuh Indexer` and `Wazuh Dashboard` are both a redistribution of a
version of the OpenSearch Stack. We will only create environments for
the versions of OpenSearch which will be included into a Wazuh
version.

We must use official `Wazuh Indexer` and `Wazuh Dashboard` images for
testing!

This environment will start a working deployment with:

- Imposter - a mock server.
- Elasticsearch-exporter - Elasticsearch metrics to Prometheus adapter.
- OpenSearch single-node cluster.
- OpenSearch Dashboards development environment.

The OpenSearch Dashboards development environment includes an already
bootstrapped Kibana, with all the node modules precompiled and ready to
use in a development session.
