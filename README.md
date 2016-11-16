Requisites:
- Wazuh HIDS 1.2 or superior
- Wazuh RESTful API 1.3 or superior
- Kibana 5-alpha5 or superior
- Elasticsearch 5-alpha5 or superior

Install:

```/usr/share/kibana/bin/kibana-plugin install  http://wazuh.com/resources/wazuh-app.zip ```

Upgrading

```/usr/share/kibana/bin/kibana-plugin remove wazuh ```

```/usr/share/kibana/bin/kibana-plugin install  http://wazuh.com/resources/wazuh-app.zip ```
