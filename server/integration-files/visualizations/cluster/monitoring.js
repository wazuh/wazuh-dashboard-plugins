export default [
    {
		"_id": "Wazuh-App-Cluster-Overview",
		"_type": "visualization",
		"_source": {
		  "title": "Wazuh App Cluster Overview",
		  "visState": "{\"title\":\"Wazuh App Cluster Overview\",\"type\":\"timelion\",\"params\":{\"expression\":\".es(*)\",\"interval\":\"auto\"},\"aggs\":[]}",
		  "uiStateJSON": "{}",
		  "description": "",
		  "version": 1,
		  "kibanaSavedObjectMeta": {
			"searchSourceJSON": "{\"index\":\"wazuh-alerts\",\"filter\":[],\"query\":{\"query\":\"\",\"language\":\"lucene\"}}"
		  }
		}
	},
	{
		"_id": "Wazuh-App-Cluster-Overview-Manager",
		"_type": "visualization",
		"_source": {
		  "title": "Wazuh App Cluster Overview Manager",
		  "visState": "{\"title\":\"Wazuh App Cluster Overview Manager\",\"type\":\"timelion\",\"params\":{\"expression\":\".es(q=agent.id:000)\",\"interval\":\"auto\"},\"aggs\":[]}",
		  "uiStateJSON": "{}",
		  "description": "",
		  "version": 1,
		  "kibanaSavedObjectMeta": {
			"searchSourceJSON": "{\"index\":\"wazuh-alerts\",\"filter\":[],\"query\":{\"query\":\"\",\"language\":\"lucene\"}}"
		  }
		}
	}
]