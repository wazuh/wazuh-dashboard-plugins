# Wazuh development 

`wazuh-indexer` and `wazuh-dashboard` are both a redistribution of a version of the Opensearch Stack. We will only create environments for the versions of Opensearch which will be included into a Wazuh version.

`opensearch` supported versions:
		- 1.2.4

`opensearch-dashboard` supported versions:
	- 1.2.0

We must use official `wazuh-indexer` and `wazuh-dashboard` images for testing!

This environment will start a working deployment with:
  - imposter - a mock server
  - elasticsearch-exporter - elasticsearch metrics to prometheus adapter
  - opensearch single-node cluster
  - opensearch-dashboard development environment


# Bring up the environment



