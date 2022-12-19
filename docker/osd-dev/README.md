# Wazuh development with Wazuh Stack

## Usage

Use always the provided script to bring up or down the development
environment. For example:

```bash
./dev.sh 1.2.4 1.2.0 $WZ_HOME up [saml]
```

The script will ask you all the required parameters to bring up the
environment, including the version of the elastic stack you want to
develop for, and the source code folder where the wazuh-kibana-app is
located.

Use the `saml` flag to bring up KeyCloak IDP. **Add idp to your hosts and start
the server using the `--no-base-path`**.

```apacheconf
# Linux systems: /etc/hosts
# Windows systems: C:\Windows\System32\drivers\etc\hosts
127.0.0.1 idp
```

**The script will not select the appropriate version of the
wazuh-kibana-app to use, so be sure to check out the appropriate version
before bringing up the environment!**

###  UI Credentials

The default user and password to access the UI at https://0.0.0.0:5601/ are:

```
admin:admin
```

## Notes

`Wazuh Indexer` and `Wazuh Dashboard` are both a redistribution of a
version of the OpenSearch Stack. We will only create environments for
the versions of OpenSearch which will be included into a Wazuh
version.

`OpenSearch` supported versions:
- 1.2.4
- 2.3.0
- 2.4.0
- 2.4.1

`OpenSearch Dashboards` supported versions:
- 1.2.0
- 2.3.0
- 2.4.0
- 2.4.1

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
