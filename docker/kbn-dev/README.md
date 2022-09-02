# Wazuh development with Elastic Stack

## Usage

Use always the provided script to bring up or down the development
environment. For example:

```bash
./dev.sh 7.10.2 $WZ_HOME up
```

The script will ask for all the required parameters to bring up the
environment, including the version of the Elastic Stack you want to
develop for, and the source code folder where the _wazuh-kibana-app_ is
located.

**The script will not select the appropriate version of the
_wazuh-kibana-app_ to use, so be sure to check out the appropriate version
before bringing up the environment!**

## Notes

This environment will start a working deployment with:

- Imposter - a mock server
- Filebeat - sets up indices using Wazuh module
- ElasticSearch-exporter - Elasticsearch metrics to Prometheus adapter
- Elasticsearch single-node cluster
- Kibana development environment

The Kibana development environment includes an already bootstrapped
Kibana, with all the node modules precompiled and ready to use in a
development session.

## UI credentials

```
elastic:SecretPassword
```
