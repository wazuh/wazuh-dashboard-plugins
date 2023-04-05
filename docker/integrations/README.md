# Wazuh integrations
This folder contains a docker environment with all the necessary to test integrations with Splunk and Elasticsearch, from the Wazuh Indexer as well as from the Wazuh manager. 

## Docker compose content:
- 1 Splunk Indexer 9.0.4
- 1 Wazuh stack (indexer, dashboard and manager). In the manager container there is also a Splunk Forwarder and a Logstash in the `/opt` folder
- 1 Elastic stack (Elasticsearch,Kibana and the setup container)
- 1 Opensearch stack (Opensearch and Opensearch dashboards)
- 1 Logstash 8.6.2 
- 1 Generator that will automatically generate all the required certificates and download the required packages

## Additional content: 
- Dashboards for Splunk and Kibana
- Sample alerts for the last 7 days after starting the environments. Those are inside the wazuh-manager in `/var/ossec/logs/alerts/sample_alerts.json` and also in the `alerts.json` file merged with the non-sample data.

## Requirement:
- Internet connection
- Docker
- Docker compose

## Usage
In the .env file it is possible to configure the desired version of the Wazuh stack. It will only work with already released versions. 

After that, running `docker compose up -d` will start all the containers. Once the start process finishes, the integrations will be configured. It is necessary to manually start the Splunk integration from manager by running `/opt/splunkforwarder/bin/splunk start --accept-license` in the Wazuh manager container.To stop the environment and cleare it, use `docker compose down`.

The Splunk Indexer instance is accessible from https://localhost:8000, credentials `admin:password`. In this instance, the logs imported from the Wazuh Indexer are in the `main` index, and the logs imported from the manager are in the `wazuh-alerts` index.

The Wazuh Dashboard instance is accessible from https://localhost:5601 credentials `admin:SecretPassword`. 

The Kibana instance is accessible from http://localhost:5602 credentials `elastic:changeme`. In this instance, the logs imported from the Wazuh Indexer are in the `indexer-wazuh-alerts-4.x-<date>` index, and the logs imported from the manager are in the `wazuh-alerts-4.x-<date>` index.

The Opensearch dashboards instance is accessible from http://localhost:5603 credentials `admin:admin`. In this instance, the logs imported from the Wazuh Indexer are in the `indexer-wazuh-alerts-4.x-<date>` index, and the logs imported from the manager are in the `wazuh-alerts-4.x-<date>` index.

The integration from the manager contains sample data, and also the alerts that are generated. The integration from the indexer will not contain any sample data. Additionally, the dashboards for all the platforms will only work with the index `wazuh-alerts...`, meaning that they will not reflect the data generated from the Indexer integration.
## Import dashboards
### Splunk 
The Splunk dashboards are located in `extra/dashboards/Splunk`. The steps to import them to the indexer are the following:
- Open a dashboard file and copy all its content
- In the indexer navigate to `Search & Reporting`, `Dashboards`, click `Create New Dashboard`, write the title and select `Dashboard Studio`, select `Grid` and click on `Create`
- On the top menu, there is a `Source` icon. Click on it, and replace all the content with the copied content from the dashboard file. After that, click on `Back` and click on `Save`.
- Repeat the steps for all the desired dashboards.

### Elastic and Opensearch
The Elastic dashboards are located in `extra/dashboards/Kibana and Opensearch-dashboards`. The steps to import them to the indexer are the following:
- Open the Elastic web interface
- Expand the left bar, and go to `Stack management`
- Click on `Saved Objects`, select `Import`, click on the `Import` icon and browse the dashboard file. It is possible to import only the desired dashboard, or the file `all-dashboards.ndjson`, that contains all the dashboards.
- Click on Import.
- Repeat the steps for all the desired dashboards.

After that, the dashboard should be imported. It can be seen opening the left bar and selecting `Dashboard`. 

