# Wazuh development with Elastic Stack


## Usage

Use always the provided script to bring up or down the development
environment.

```bash
dev.sh
```
The script will ask you all the required parameters to bring up the
environment, inluding the version of the Elastic Stack you want to
develop for, and the source code folder where the *wazuh-kibana-app* is
located.

**The script will not select the apropriate version of the
*wazuh-kibana-app* to use, so be sure to checkout the apropriate version
before bringing up the environment!**

## Notes

This environment will start a working deployment with:
  - Imposter - a mock server
  - Filebeat - set ups indices using Wazuh module
  - ElasticSearch-exporter - ElasticSearch metrics to Prometheus adapter
  - ElasticSearch single-node cluster
  - Kibana development environment

The Kibana development environment includes an already bootstraped
Kibana, with all the node modules precompiled and ready to use in a
development session.
