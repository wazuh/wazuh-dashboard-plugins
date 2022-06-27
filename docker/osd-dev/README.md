# Wazuh development with Wazuh Stack


## Usage

Use always the provided script to bring up or down the development
environment.

	```bash
 	dev.sh
	```
The script will ask you all the required parameters to bring up the
environment, inluding the version of the elastic stack you want to
develop for, and the source code folder where the wazuh-kibana-app is
located.

**The script will not select the apropriate version of the
wazuh-kibana-app to use, so be sure to checkout the apropriate version
before bringing up the environment!**

## Notes

`wazuh-indexer` and `wazuh-dashboard` are both a redistribution of a
version of the Opensearch Stack. We will only create environments for
the versions of Opensearch which will be included into a Wazuh
version.


`opensearch` supported versions:
		- 1.2.4

`opensearch-dashboard` supported versions:
	- 1.2.0

We must use official `wazuh-indexer` and `wazuh-dashboard` images for
testing!

This environment will start a working deployment with:
  - imposter - a mock server
  - elasticsearch-exporter - elasticsearch metrics to prometheus adapter
  - opensearch single-node cluster
  - opensearch-dashboard development environment

The opensearch-dashboard development environment includes an already
bootstraped kibana, with all the node modules precompiled and ready to
use in a development session.


