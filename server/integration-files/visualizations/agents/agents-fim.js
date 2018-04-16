module.exports = [
    {
		"_id": "Wazuh-App-Agents-FIM-Users",
		"_source": {
			"title": "Wazuh App Agents FIM Users",
			"visState":
				"{\"title\":\"Wazuh App Agents FIM Users\",\"type\":\"pie\",\"params\":{\"type\":\"pie\",\"addTooltip\":true,\"addLegend\":true,\"legendPosition\":\"right\",\"isDonut\":true},\"aggs\":[{\"id\":\"1\",\"enabled\":true,\"type\":\"count\",\"schema\":\"metric\",\"params\":{}},{\"id\":\"2\",\"enabled\":true,\"type\":\"terms\",\"schema\":\"segment\",\"params\":{\"field\":\"syscheck.uname_after\",\"size\":5,\"order\":\"desc\",\"orderBy\":\"1\"}}]}",
			"uiStateJSON": "{}",
			"description": "",
			"version": 1,
			"kibanaSavedObjectMeta": {
				"searchSourceJSON":
					"{\"index\":\"wazuh-alerts\",\"filter\":[],\"query\":{\"query\":\"rule.groups: syscheck\",\"language\":\"lucene\"}}"
			}
		},
		"_type": "visualization"
	},
	{
		"_id": "Wazuh-App-Agents-FIM-Groups",
		"_source": {
			"title": "Wazuh App Agents FIM Groups",
			"visState":
				"{\"title\":\"Wazuh App Agents FIM Groups\",\"type\":\"pie\",\"params\":{\"type\":\"pie\",\"addTooltip\":true,\"addLegend\":true,\"legendPosition\":\"right\",\"isDonut\":true},\"aggs\":[{\"id\":\"1\",\"enabled\":true,\"type\":\"count\",\"schema\":\"metric\",\"params\":{}},{\"id\":\"2\",\"enabled\":true,\"type\":\"terms\",\"schema\":\"segment\",\"params\":{\"field\":\"syscheck.gname_after\",\"size\":5,\"order\":\"desc\",\"orderBy\":\"1\"}}]}",
			"uiStateJSON": "{}",
			"description": "",
			"version": 1,
			"kibanaSavedObjectMeta": {
				"searchSourceJSON":
					"{\"index\":\"wazuh-alerts\",\"filter\":[],\"query\":{\"query\":\"rule.groups: syscheck\",\"language\":\"lucene\"}}"
			}
		},
		"_type": "visualization"
	},
	{
		"_id": "Wazuh-App-Agents-FIM-Permissions",
		"_source": {
			"title": "Wazuh App Agents FIM Permissions",
			"visState":
				"{\"title\":\"Wazuh App Agents FIM Permissions\",\"type\":\"pie\",\"params\":{\"type\":\"pie\",\"addTooltip\":true,\"addLegend\":true,\"legendPosition\":\"right\",\"isDonut\":true},\"aggs\":[{\"id\":\"1\",\"enabled\":true,\"type\":\"count\",\"schema\":\"metric\",\"params\":{}},{\"id\":\"2\",\"enabled\":true,\"type\":\"terms\",\"schema\":\"segment\",\"params\":{\"field\":\"syscheck.perm_after\",\"size\":5,\"order\":\"desc\",\"orderBy\":\"1\"}}]}",
			"uiStateJSON": "{}",
			"description": "",
			"version": 1,
			"kibanaSavedObjectMeta": {
				"searchSourceJSON":
					"{\"index\":\"wazuh-alerts\",\"filter\":[],\"query\":{\"query\":\"rule.groups: syscheck\",\"language\":\"lucene\"}}"
			}
		},
		"_type": "visualization"
	},
	{
		"_id": "Wazuh-App-Agents-FIM-Events",
		"_source": {
			"title": "Wazuh App Agents FIM Events",
			"visState":
				"{\"title\":\"Wazuh App Agents FIM Events\",\"type\":\"histogram\",\"params\":{\"type\":\"histogram\",\"grid\":{\"categoryLines\":false,\"style\":{\"color\":\"#eee\"}},\"categoryAxes\":[{\"id\":\"CategoryAxis-1\",\"type\":\"category\",\"position\":\"bottom\",\"show\":true,\"style\":{},\"scale\":{\"type\":\"linear\"},\"labels\":{\"show\":true,\"truncate\":100},\"title\":{}}],\"valueAxes\":[{\"id\":\"ValueAxis-1\",\"name\":\"LeftAxis-1\",\"type\":\"value\",\"position\":\"left\",\"show\":true,\"style\":{},\"scale\":{\"type\":\"linear\",\"mode\":\"normal\"},\"labels\":{\"show\":true,\"rotate\":0,\"filter\":false,\"truncate\":100},\"title\":{\"text\":\"Count\"}}],\"seriesParams\":[{\"show\":\"true\",\"type\":\"histogram\",\"mode\":\"stacked\",\"data\":{\"label\":\"Count\",\"id\":\"1\"},\"valueAxis\":\"ValueAxis-1\",\"drawLinesBetweenPoints\":true,\"showCircles\":true}],\"addTooltip\":true,\"addLegend\":false,\"legendPosition\":\"right\",\"times\":[],\"addTimeMarker\":false},\"aggs\":[{\"id\":\"1\",\"enabled\":true,\"type\":\"count\",\"schema\":\"metric\",\"params\":{}},{\"id\":\"2\",\"enabled\":true,\"type\":\"date_histogram\",\"schema\":\"segment\",\"params\":{\"field\":\"@timestamp\",\"interval\":\"h\",\"customInterval\":\"2h\",\"min_doc_count\":1,\"extended_bounds\":{}}}]}",
			"uiStateJSON": "{\"vis\":{\"legendOpen\":false}}",
			"description": "",
			"version": 1,
			"kibanaSavedObjectMeta": {
				"searchSourceJSON":
					"{\"index\":\"wazuh-alerts\",\"filter\":[],\"query\":{\"query\":\"rule.groups: syscheck\",\"language\":\"lucene\"}}"
			}
		},
		"_type": "visualization"
	},
	{
		"_id": "Wazuh-App-Agents-FIM-Files-added",
		"_source": {
			"title": "Wazuh App Agents FIM Files added",
			"visState":
				"{\"title\":\"Wazuh App Agents FIM Files added\",\"type\":\"pie\",\"params\":{\"type\":\"pie\",\"addTooltip\":true,\"addLegend\":true,\"legendPosition\":\"right\",\"isDonut\":true},\"aggs\":[{\"id\":\"1\",\"enabled\":true,\"type\":\"count\",\"schema\":\"metric\",\"params\":{}},{\"id\":\"2\",\"enabled\":true,\"type\":\"terms\",\"schema\":\"segment\",\"params\":{\"field\":\"syscheck.path\",\"size\":5,\"order\":\"desc\",\"orderBy\":\"1\"}}]}",
			"uiStateJSON": "{}",
			"description": "",
			"version": 1,
			"kibanaSavedObjectMeta": {
				"searchSourceJSON":
					"{\"index\":\"wazuh-alerts\",\"filter\":[],\"query\":{\"query\":\"rule.id: 554 AND NOT location: syscheck-registry\",\"language\":\"lucene\"}}"
			}
		},
		"_type": "visualization"
	},
	{
		"_id": "Wazuh-App-Agents-FIM-Files-modified",
		"_source": {
			"title": "Wazuh App Agents FIM Files modified",
			"visState":
				"{\"title\":\"Wazuh App Agents FIM Files modified\",\"type\":\"pie\",\"params\":{\"type\":\"pie\",\"addTooltip\":true,\"addLegend\":true,\"legendPosition\":\"right\",\"isDonut\":true},\"aggs\":[{\"id\":\"1\",\"enabled\":true,\"type\":\"count\",\"schema\":\"metric\",\"params\":{}},{\"id\":\"2\",\"enabled\":true,\"type\":\"terms\",\"schema\":\"segment\",\"params\":{\"field\":\"syscheck.path\",\"size\":5,\"order\":\"desc\",\"orderBy\":\"1\"}}]}",
			"uiStateJSON": "{}",
			"description": "",
			"version": 1,
			"kibanaSavedObjectMeta": {
				"searchSourceJSON":
					"{\"index\":\"wazuh-alerts\",\"filter\":[],\"query\":{\"query\":\"(rule.id: 550 OR rule.id: 551 OR rule.id: 552 OR rule.id: 555) AND NOT location: syscheck-registry\",\"language\":\"lucene\"}}"
			}
		},
		"_type": "visualization"
	},
	{
		"_id": "Wazuh-App-Agents-FIM-Files-deleted",
		"_source": {
			"title": "Wazuh App Agents FIM Files deleted",
			"visState":
				"{\"title\":\"Wazuh App Agents FIM Files deleted\",\"type\":\"pie\",\"params\":{\"type\":\"pie\",\"addTooltip\":true,\"addLegend\":true,\"legendPosition\":\"right\",\"isDonut\":true},\"aggs\":[{\"id\":\"1\",\"enabled\":true,\"type\":\"count\",\"schema\":\"metric\",\"params\":{}},{\"id\":\"2\",\"enabled\":true,\"type\":\"terms\",\"schema\":\"segment\",\"params\":{\"field\":\"syscheck.path\",\"size\":5,\"order\":\"desc\",\"orderBy\":\"1\"}}]}",
			"uiStateJSON": "{}",
			"description": "",
			"version": 1,
			"kibanaSavedObjectMeta": {
				"searchSourceJSON":
					"{\"index\":\"wazuh-alerts\",\"filter\":[],\"query\":{\"query\":\"rule.id: 553 AND NOT location: syscheck-registry\",\"language\":\"lucene\"}}"
			}
		},
		"_type": "visualization"
	},
	{
		"_id": "Wazuh-App-Agents-FIM-Alerts-summary",
		"_type": "visualization",
		"_source": {
		"title": "Wazuh App Agents FIM Alerts summary",
		"visState": "{\"title\":\"Wazuh App Agents FIM Alerts summary\",\"type\":\"table\",\"params\":{\"perPage\":10,\"showPartialRows\":false,\"showMeticsAtAllLevels\":false,\"sort\":{\"columnIndex\":null,\"direction\":null},\"showTotal\":false,\"totalFunc\":\"sum\"},\"aggs\":[{\"id\":\"1\",\"enabled\":true,\"type\":\"count\",\"schema\":\"metric\",\"params\":{}},{\"id\":\"3\",\"enabled\":true,\"type\":\"terms\",\"schema\":\"bucket\",\"params\":{\"field\":\"syscheck.path\",\"otherBucket\":false,\"otherBucketLabel\":\"Other\",\"missingBucket\":false,\"missingBucketLabel\":\"Missing\",\"size\":50,\"order\":\"desc\",\"orderBy\":\"1\",\"customLabel\":\"File\"}},{\"id\":\"5\",\"enabled\":true,\"type\":\"terms\",\"schema\":\"bucket\",\"params\":{\"field\":\"rule.description\",\"otherBucket\":false,\"otherBucketLabel\":\"Other\",\"missingBucket\":false,\"missingBucketLabel\":\"Missing\",\"size\":10,\"order\":\"desc\",\"orderBy\":\"1\",\"customLabel\":\"Description\"}}]}",
		"uiStateJSON": "{\"vis\":{\"params\":{\"sort\":{\"columnIndex\":null,\"direction\":null}}}}",
		"description": "",
		"version": 1,
			"kibanaSavedObjectMeta": {
				"searchSourceJSON": 
					"{\"index\":\"wazuh-alerts\",\"filter\":[],\"query\":{\"query\":\"rule.groups: syscheck\",\"language\":\"lucene\"}}"
			}
		}
	}
]