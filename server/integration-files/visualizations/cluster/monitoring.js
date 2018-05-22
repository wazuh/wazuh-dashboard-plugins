/*
 * Wazuh app - Cluster monitoring visualizations
 * Copyright (C) 2018 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
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