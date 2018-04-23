module.exports = [
    {
		"_id": "Wazuh-App-Overview-Audit-New-files",
		"_source": {
			"title": "Wazuh App Overview Audit New files",
			"visState":
				"{\"title\":\"Wazuh App Overview Audit New files\",\"type\":\"metric\",\"params\":{\"addTooltip\":true,\"addLegend\":false,\"type\":\"gauge\",\"gauge\":{\"verticalSplit\":false,\"autoExtend\":false,\"percentageMode\":false,\"gaugeType\":\"Metric\",\"gaugeStyle\":\"Full\",\"backStyle\":\"Full\",\"orientation\":\"vertical\",\"colorSchema\":\"Green to Red\",\"gaugeColorMode\":\"None\",\"useRange\":false,\"colorsRange\":[{\"from\":0,\"to\":100}],\"invertColors\":false,\"labels\":{\"show\":true,\"color\":\"black\"},\"scale\":{\"show\":false,\"labels\":false,\"color\":\"#333\",\"width\":2},\"type\":\"simple\",\"style\":{\"fontSize\":20,\"bgColor\":false,\"labelColor\":false,\"subText\":\"\"}}},\"aggs\":[{\"id\":\"1\",\"enabled\":true,\"type\":\"count\",\"schema\":\"metric\",\"params\":{\"customLabel\":\"New files\"}}]}",
			"uiStateJSON": "{\"vis\":{\"defaultColors\":{\"0 - 100\":\"rgb(0,104,55)\"}}}",
			"description": "",
			"version": 1,
			"kibanaSavedObjectMeta": {
				"searchSourceJSON":
					"{\"index\":\"wazuh-alerts\",\"filter\":[],\"query\":{\"query\":\"rule.groups: audit AND rule.groups : audit_watch_create\",\"language\":\"lucene\"}}"
			}
		},
		"_type": "visualization"
	},
	{
		"_id": "Wazuh-App-Overview-Audit-Read-files",
		"_source": {
			"title": "Wazuh App Overview Audit Read files",
			"visState":
				"{\"title\":\"Wazuh App Overview Audit Read files\",\"type\":\"metric\",\"params\":{\"addTooltip\":true,\"addLegend\":false,\"type\":\"gauge\",\"gauge\":{\"verticalSplit\":false,\"autoExtend\":false,\"percentageMode\":false,\"gaugeType\":\"Metric\",\"gaugeStyle\":\"Full\",\"backStyle\":\"Full\",\"orientation\":\"vertical\",\"colorSchema\":\"Green to Red\",\"gaugeColorMode\":\"None\",\"useRange\":false,\"colorsRange\":[{\"from\":0,\"to\":100}],\"invertColors\":false,\"labels\":{\"show\":true,\"color\":\"black\"},\"scale\":{\"show\":false,\"labels\":false,\"color\":\"#333\",\"width\":2},\"type\":\"simple\",\"style\":{\"fontSize\":20,\"bgColor\":false,\"labelColor\":false,\"subText\":\"\"}}},\"aggs\":[{\"id\":\"1\",\"enabled\":true,\"type\":\"count\",\"schema\":\"metric\",\"params\":{\"customLabel\":\"Read files\"}}]}",
			"uiStateJSON": "{\"vis\":{\"defaultColors\":{\"0 - 100\":\"rgb(0,104,55)\"}}}",
			"description": "",
			"version": 1,
			"kibanaSavedObjectMeta": {
				"searchSourceJSON":
					"{\"index\":\"wazuh-alerts\",\"filter\":[],\"query\":{\"query\":\"rule.groups: audit AND rule.groups : audit_watch_read\",\"language\":\"lucene\"}}"
			}
		},
		"_type": "visualization"
	},
	{
		"_id": "Wazuh-App-Overview-Audit-Modified-files",
		"_source": {
			"title": "Wazuh App Overview Audit Modified files",
			"visState":
				"{\"title\":\"Wazuh App Overview Audit Modified files\",\"type\":\"metric\",\"params\":{\"addTooltip\":true,\"addLegend\":false,\"type\":\"gauge\",\"gauge\":{\"verticalSplit\":false,\"autoExtend\":false,\"percentageMode\":false,\"gaugeType\":\"Metric\",\"gaugeStyle\":\"Full\",\"backStyle\":\"Full\",\"orientation\":\"vertical\",\"colorSchema\":\"Green to Red\",\"gaugeColorMode\":\"None\",\"useRange\":false,\"colorsRange\":[{\"from\":0,\"to\":100}],\"invertColors\":false,\"labels\":{\"show\":true,\"color\":\"black\"},\"scale\":{\"show\":false,\"labels\":false,\"color\":\"#333\",\"width\":2},\"type\":\"simple\",\"style\":{\"fontSize\":20,\"bgColor\":false,\"labelColor\":false,\"subText\":\"\"}}},\"aggs\":[{\"id\":\"1\",\"enabled\":true,\"type\":\"count\",\"schema\":\"metric\",\"params\":{\"customLabel\":\"Modified files\"}}]}",
			"uiStateJSON": "{\"vis\":{\"defaultColors\":{\"0 - 100\":\"rgb(0,104,55)\"}}}",
			"description": "",
			"version": 1,
			"kibanaSavedObjectMeta": {
				"searchSourceJSON":
					"{\"index\":\"wazuh-alerts\",\"filter\":[],\"query\":{\"query\":\"rule.groups: audit AND rule.groups : audit_watch_write\",\"language\":\"lucene\"}}"
			}
		},
		"_type": "visualization"
	},
	{
		"_id": "Wazuh-App-Overview-Audit-Removed-files",
		"_source": {
			"title": "Wazuh App Overview Audit Removed files",
			"visState":
				"{\"title\":\"Wazuh App Overview Audit Removed files\",\"type\":\"metric\",\"params\":{\"addTooltip\":true,\"addLegend\":false,\"type\":\"gauge\",\"gauge\":{\"verticalSplit\":false,\"autoExtend\":false,\"percentageMode\":false,\"gaugeType\":\"Metric\",\"gaugeStyle\":\"Full\",\"backStyle\":\"Full\",\"orientation\":\"vertical\",\"colorSchema\":\"Green to Red\",\"gaugeColorMode\":\"None\",\"useRange\":false,\"colorsRange\":[{\"from\":0,\"to\":100}],\"invertColors\":false,\"labels\":{\"show\":true,\"color\":\"black\"},\"scale\":{\"show\":false,\"labels\":false,\"color\":\"#333\",\"width\":2},\"type\":\"simple\",\"style\":{\"fontSize\":20,\"bgColor\":false,\"labelColor\":false,\"subText\":\"\"}}},\"aggs\":[{\"id\":\"1\",\"enabled\":true,\"type\":\"count\",\"schema\":\"metric\",\"params\":{\"customLabel\":\"Removed files\"}}]}",
			"uiStateJSON": "{\"vis\":{\"defaultColors\":{\"0 - 100\":\"rgb(0,104,55)\"}}}",
			"description": "",
			"version": 1,
			"kibanaSavedObjectMeta": {
				"searchSourceJSON":
					"{\"index\":\"wazuh-alerts\",\"filter\":[],\"query\":{\"query\":\"rule.groups: audit AND rule.groups : audit_watch_delete\",\"language\":\"lucene\"}}"
			}
		},
		"_type": "visualization"
	},
	{
		"_id": "Wazuh-App-Overview-Audit-Latest-alert",
		"_source": {
			"title": "Wazuh App Overview Audit Latest alert",
			"visState":
				"{\"title\":\"Wazuh App Overview Audit Latest alert\",\"type\":\"table\",\"params\":{\"perPage\":10,\"showPartialRows\":false,\"showMeticsAtAllLevels\":false,\"sort\":{\"columnIndex\":null,\"direction\":null},\"showTotal\":false,\"totalFunc\":\"sum\"},\"aggs\":[{\"id\":\"1\",\"enabled\":true,\"type\":\"max\",\"schema\":\"metric\",\"params\":{\"field\":\"@timestamp\"}},{\"id\":\"2\",\"enabled\":true,\"type\":\"terms\",\"schema\":\"bucket\",\"params\":{\"field\":\"rule.description\",\"size\":1,\"order\":\"desc\",\"orderBy\":\"1\"}}]}",
			"uiStateJSON": "{\"vis\":{\"params\":{\"sort\":{\"columnIndex\":null,\"direction\":null}}}}",
			"description": "",
			"version": 1,
			"kibanaSavedObjectMeta": {
				"searchSourceJSON":
					"{\"index\":\"wazuh-alerts\",\"filter\":[],\"query\":{\"query\":\"rule.groups: audit\",\"language\":\"lucene\"}}"
			}
		},
		"_type": "visualization"
	},
	{
		"_id": "Wazuh-App-Overview-Audit-Groups",
		"_source": {
			"title": "Wazuh App Overview Audit Groups",
			"visState":
				"{\"title\":\"Wazuh App Overview Audit Groups\",\"type\":\"pie\",\"params\":{\"type\":\"pie\",\"addTooltip\":true,\"addLegend\":true,\"legendPosition\":\"right\",\"isDonut\":true},\"aggs\":[{\"id\":\"1\",\"enabled\":true,\"type\":\"count\",\"schema\":\"metric\",\"params\":{}},{\"id\":\"2\",\"enabled\":true,\"type\":\"terms\",\"schema\":\"segment\",\"params\":{\"field\":\"rule.groups\",\"size\":5,\"order\":\"desc\",\"orderBy\":\"1\"}}]}",
			"uiStateJSON": "{}",
			"description": "",
			"version": 1,
			"kibanaSavedObjectMeta": {
				"searchSourceJSON":
					"{\"index\":\"wazuh-alerts\",\"filter\":[],\"query\":{\"query\":\"rule.groups: audit\",\"language\":\"lucene\"}}"
			}
		},
		"_type": "visualization"
	},
	{
		"_id": "Wazuh-App-Overview-Audit-Agents",
		"_source": {
			"title": "Wazuh App Overview Audit Agents",
			"visState":
				"{\"title\":\"Wazuh App Overview Audit Agents\",\"type\":\"pie\",\"params\":{\"type\":\"pie\",\"addTooltip\":true,\"addLegend\":true,\"legendPosition\":\"right\",\"isDonut\":true},\"aggs\":[{\"id\":\"1\",\"enabled\":true,\"type\":\"count\",\"schema\":\"metric\",\"params\":{}},{\"id\":\"2\",\"enabled\":true,\"type\":\"terms\",\"schema\":\"segment\",\"params\":{\"field\":\"agent.name\",\"size\":5,\"order\":\"desc\",\"orderBy\":\"1\"}}]}",
			"uiStateJSON": "{}",
			"description": "",
			"version": 1,
			"kibanaSavedObjectMeta": {
				"searchSourceJSON":
					"{\"index\":\"wazuh-alerts\",\"filter\":[],\"query\":{\"query\":\"rule.groups: audit\",\"language\":\"lucene\"}}"
			}
		},
		"_type": "visualization"
	},
	{
		"_id": "Wazuh-App-Overview-Audit-Directories",
		"_source": {
			"title": "Wazuh App Overview Audit Directories",
			"visState":
				"{\"title\":\"Wazuh App Overview Audit Directories\",\"type\":\"pie\",\"params\":{\"type\":\"pie\",\"addTooltip\":true,\"addLegend\":true,\"legendPosition\":\"right\",\"isDonut\":true},\"aggs\":[{\"id\":\"1\",\"enabled\":true,\"type\":\"count\",\"schema\":\"metric\",\"params\":{}},{\"id\":\"2\",\"enabled\":true,\"type\":\"terms\",\"schema\":\"segment\",\"params\":{\"field\":\"data.audit.directory.name\",\"size\":5,\"order\":\"desc\",\"orderBy\":\"1\"}}]}",
			"uiStateJSON": "{}",
			"description": "",
			"version": 1,
			"kibanaSavedObjectMeta": {
				"searchSourceJSON":
					"{\"index\":\"wazuh-alerts\",\"filter\":[],\"query\":{\"query\":\"rule.groups: audit\",\"language\":\"lucene\"}}"
			}
		},
		"_type": "visualization"
	},
	{
		"_id": "Wazuh-App-Overview-Audit-Files",
		"_source": {
			"title": "Wazuh App Overview Audit Files",
			"visState":
				"{\"title\":\"Wazuh App Overview Audit Files\",\"type\":\"pie\",\"params\":{\"type\":\"pie\",\"addTooltip\":true,\"addLegend\":true,\"legendPosition\":\"right\",\"isDonut\":true},\"aggs\":[{\"id\":\"1\",\"enabled\":true,\"type\":\"count\",\"schema\":\"metric\",\"params\":{}},{\"id\":\"2\",\"enabled\":true,\"type\":\"terms\",\"schema\":\"segment\",\"params\":{\"field\":\"data.audit.file.name\",\"size\":5,\"order\":\"desc\",\"orderBy\":\"1\"}}]}",
			"uiStateJSON": "{}",
			"description": "",
			"version": 1,
			"kibanaSavedObjectMeta": {
				"searchSourceJSON":
					"{\"index\":\"wazuh-alerts\",\"filter\":[],\"query\":{\"query\":\"rule.groups: audit\",\"language\":\"lucene\"}}"
			}
		},
		"_type": "visualization"
	},
	{
		"_id": "Wazuh-App-Overview-Audit-Alerts-over-time",
		"_source": {
			"title": "Wazuh App Overview Audit Alerts over time",
			"visState": "{\"title\":\"Wazuh App Overview Audit Alerts over time\",\"type\":\"area\",\"params\":{\"scale\":\"linear\",\"yAxis\":{},\"smoothLines\":true,\"setYExtents\":false,\"legendPosition\":\"right\",\"addTimeMarker\":false,\"interpolate\":\"linear\",\"addLegend\":true,\"shareYAxis\":true,\"mode\":\"overlap\",\"defaultYExtents\":false,\"times\":[],\"addTooltip\":true,\"type\":\"area\",\"grid\":{\"categoryLines\":false,\"style\":{\"color\":\"#eee\"}},\"categoryAxes\":[{\"id\":\"CategoryAxis-1\",\"type\":\"category\",\"position\":\"bottom\",\"show\":true,\"style\":{},\"scale\":{\"type\":\"linear\"},\"labels\":{\"show\":true,\"truncate\":100},\"title\":{}}],\"valueAxes\":[{\"id\":\"ValueAxis-1\",\"name\":\"LeftAxis-1\",\"type\":\"value\",\"position\":\"left\",\"show\":true,\"style\":{},\"scale\":{\"type\":\"linear\",\"mode\":\"normal\",\"setYExtents\":false,\"defaultYExtents\":false},\"labels\":{\"show\":true,\"rotate\":0,\"filter\":false,\"truncate\":100},\"title\":{\"text\":\"Count\"}}],\"seriesParams\":[{\"show\":\"true\",\"type\":\"area\",\"mode\":\"normal\",\"data\":{\"label\":\"Count\",\"id\":\"1\"},\"interpolate\":\"cardinal\",\"valueAxis\":\"ValueAxis-1\"}]},\"aggs\":[{\"id\":\"1\",\"enabled\":true,\"type\":\"count\",\"schema\":\"metric\",\"params\":{}},{\"id\":\"3\",\"enabled\":true,\"type\":\"terms\",\"schema\":\"group\",\"params\":{\"field\":\"rule.description\",\"size\":5,\"order\":\"desc\",\"orderBy\":\"1\"}},{\"id\":\"2\",\"enabled\":true,\"type\":\"date_histogram\",\"schema\":\"segment\",\"params\":{\"field\":\"@timestamp\",\"interval\":\"auto\",\"customInterval\":\"2h\",\"min_doc_count\":1,\"extended_bounds\":{}}}]}",
			"uiStateJSON": "{}",
			"description": "",
			"version": 1,
			"kibanaSavedObjectMeta": {
				"searchSourceJSON": "{\"index\":\"wazuh-alerts\",\"filter\":[],\"query\":{\"query\":\"rule.groups: audit\",\"language\":\"lucene\"}}"
			}
		},
		"_type": "visualization"
	},
	{
		"_id": "Wazuh-App-Overview-Audit-File-read-access",
		"_type": "visualization",
		"_source": {
		  "title": "Wazuh App Overview Audit File read access",
		  "visState": "{\"title\":\"Wazuh App Overview Audit File read access\",\"type\":\"pie\",\"params\":{\"isDonut\":false,\"legendPosition\":\"right\",\"shareYAxis\":true,\"addTooltip\":true,\"addLegend\":true,\"type\":\"pie\",\"labels\":{\"show\":false,\"values\":true,\"last_level\":true,\"truncate\":100}},\"aggs\":[{\"id\":\"1\",\"enabled\":true,\"type\":\"count\",\"schema\":\"metric\",\"params\":{}},{\"id\":\"2\",\"enabled\":true,\"type\":\"terms\",\"schema\":\"segment\",\"params\":{\"field\":\"data.audit.file.name\",\"otherBucket\":false,\"otherBucketLabel\":\"Other\",\"missingBucket\":false,\"missingBucketLabel\":\"Missing\",\"size\":5,\"order\":\"desc\",\"orderBy\":\"1\",\"customLabel\":\"\"}}]}",
		  "uiStateJSON": "{}",
		  "description": "",
		  "version": 1,
		  "kibanaSavedObjectMeta": {
			"searchSourceJSON": "{\"index\":\"wazuh-alerts\",\"filter\":[],\"query\":{\"query\":\"rule.groups: audit AND rule.id: 80784\",\"language\":\"lucene\"}}"
		  }
		}
	},
	{
		"_id": "Wazuh-App-Overview-Audit-File-write-access",
		"_type": "visualization",
		"_source": {
		  "title": "Wazuh App Overview Audit File write access",
		  "visState": "{\"title\":\"Wazuh App Overview Audit File write access\",\"type\":\"pie\",\"params\":{\"isDonut\":false,\"legendPosition\":\"right\",\"shareYAxis\":true,\"addTooltip\":true,\"addLegend\":true,\"type\":\"pie\",\"labels\":{\"show\":false,\"values\":true,\"last_level\":true,\"truncate\":100}},\"aggs\":[{\"id\":\"1\",\"enabled\":true,\"type\":\"count\",\"schema\":\"metric\",\"params\":{}},{\"id\":\"2\",\"enabled\":true,\"type\":\"terms\",\"schema\":\"segment\",\"params\":{\"field\":\"data.audit.file.name\",\"otherBucket\":false,\"otherBucketLabel\":\"Other\",\"missingBucket\":false,\"missingBucketLabel\":\"Missing\",\"size\":5,\"order\":\"desc\",\"orderBy\":\"1\",\"customLabel\":\"\"}}]}",
		  "uiStateJSON": "{}",
		  "description": "",
		  "version": 1,
		  "kibanaSavedObjectMeta": {
			"searchSourceJSON": "{\"index\":\"wazuh-alerts\",\"filter\":[],\"query\":{\"query\":\"rule.groups: audit AND rule.id: 80781\",\"language\":\"lucene\"}}"
		  }
		}
	},
	{
		"_id": "Wazuh-App-Overview-Audit-Commands",
		"_source": {
			"title": "Wazuh App Overview Audit Commands",
			"visState":
				"{\"params\": {\"isDonut\": false, \"legendPosition\": \"right\", \"shareYAxis\": true, \"addTooltip\": true, \"addLegend\": true}, \"listeners\": {}, \"type\": \"pie\", \"aggs\": [{\"type\": \"count\", \"enabled\": true, \"id\": \"1\", \"params\": {}, \"schema\": \"metric\"}, {\"type\": \"terms\", \"enabled\": true, \"id\": \"2\", \"params\": {\"orderBy\": \"1\", \"field\": \"data.audit.command\", \"customLabel\": \"\", \"order\": \"desc\", \"size\": 10}, \"schema\": \"segment\"}], \"title\": \"Wazuh App Overview Audit Commands\"}",
			"uiStateJSON": "{}",
			"description": "",
			"version": 1,
			"kibanaSavedObjectMeta": {
				"searchSourceJSON":
					"{\"index\":\"wazuh-alerts\",\"filter\":[],\"query\":{\"query\":\"rule.groups: audit\",\"language\":\"lucene\"}}"
			}
		},
		"_type": "visualization"
	},
	{
		"_id": "Wazuh-App-Overview-Audit-Files-created",
		"_type": "visualization",
		"_source": {
		  "title": "Wazuh App Overview Audit Files created",
		  "visState": "{\"title\":\"Wazuh App Overview Audit Files created\",\"type\":\"pie\",\"params\":{\"isDonut\":false,\"legendPosition\":\"right\",\"shareYAxis\":true,\"addTooltip\":true,\"addLegend\":true,\"type\":\"pie\",\"labels\":{\"show\":false,\"values\":true,\"last_level\":true,\"truncate\":100}},\"aggs\":[{\"id\":\"1\",\"enabled\":true,\"type\":\"count\",\"schema\":\"metric\",\"params\":{}},{\"id\":\"2\",\"enabled\":true,\"type\":\"terms\",\"schema\":\"segment\",\"params\":{\"field\":\"data.audit.file.name\",\"otherBucket\":false,\"otherBucketLabel\":\"Other\",\"missingBucket\":false,\"missingBucketLabel\":\"Missing\",\"size\":5,\"order\":\"desc\",\"orderBy\":\"1\",\"customLabel\":\"\"}}]}",
		  "uiStateJSON": "{}",
		  "description": "",
		  "version": 1,
		  "kibanaSavedObjectMeta": {
			"searchSourceJSON": "{\"index\":\"wazuh-alerts\",\"filter\":[],\"query\":{\"query\":\"rule.groups: audit AND rule.id: 80790\",\"language\":\"lucene\"}}"
		  }
		}
	},
	{
		"_id": "Wazuh-App-Overview-Audit-Files-deleted",
		"_type": "visualization",
		"_source": {
		  "title": "Wazuh App Overview Audit Files deleted",
		  "visState": "{\"title\":\"Wazuh App Overview Audit Files deleted\",\"type\":\"pie\",\"params\":{\"isDonut\":false,\"legendPosition\":\"right\",\"shareYAxis\":true,\"addTooltip\":true,\"addLegend\":true,\"type\":\"pie\",\"labels\":{\"show\":false,\"values\":true,\"last_level\":true,\"truncate\":100}},\"aggs\":[{\"id\":\"1\",\"enabled\":true,\"type\":\"count\",\"schema\":\"metric\",\"params\":{}},{\"id\":\"2\",\"enabled\":true,\"type\":\"terms\",\"schema\":\"segment\",\"params\":{\"field\":\"data.audit.file.name\",\"otherBucket\":false,\"otherBucketLabel\":\"Other\",\"missingBucket\":false,\"missingBucketLabel\":\"Missing\",\"size\":5,\"order\":\"desc\",\"orderBy\":\"1\",\"customLabel\":\"\"}}]}",
		  "uiStateJSON": "{}",
		  "description": "",
		  "version": 1,
		  "kibanaSavedObjectMeta": {
			"searchSourceJSON": 
				"{\"index\":\"wazuh-alerts\",\"filter\":[],\"query\":{\"query\":\"rule.groups: audit AND rule.id: 80791\",\"language\":\"lucene\"}}"
		  }
		}
	},
	{
		"_id": "Wazuh-App-Overview-Audit-Last-alerts",
		"_type": "visualization",
		"_source": {
		"title": "Wazuh App Overview Audit Last alerts",
		"visState": "{\"title\":\"Wazuh App Overview Audit Last alerts\",\"type\":\"table\",\"params\":{\"perPage\":10,\"showPartialRows\":false,\"showMeticsAtAllLevels\":false,\"sort\":{\"columnIndex\":null,\"direction\":null},\"showTotal\":false,\"totalFunc\":\"sum\"},\"aggs\":[{\"id\":\"1\",\"enabled\":true,\"type\":\"count\",\"schema\":\"metric\",\"params\":{}},{\"id\":\"2\",\"enabled\":true,\"type\":\"terms\",\"schema\":\"bucket\",\"params\":{\"field\":\"agent.name\",\"otherBucket\":false,\"otherBucketLabel\":\"Other\",\"missingBucket\":false,\"missingBucketLabel\":\"Missing\",\"size\":50,\"order\":\"desc\",\"orderBy\":\"1\",\"customLabel\":\"Agent\"}},{\"id\":\"3\",\"enabled\":true,\"type\":\"terms\",\"schema\":\"bucket\",\"params\":{\"field\":\"rule.description\",\"otherBucket\":false,\"otherBucketLabel\":\"Other\",\"missingBucket\":false,\"missingBucketLabel\":\"Missing\",\"size\":10,\"order\":\"desc\",\"orderBy\":\"1\",\"customLabel\":\"Event\"}},{\"id\":\"4\",\"enabled\":true,\"type\":\"terms\",\"schema\":\"bucket\",\"params\":{\"field\":\"data.audit.exe\",\"otherBucket\":false,\"otherBucketLabel\":\"Other\",\"missingBucket\":false,\"missingBucketLabel\":\"Missing\",\"size\":10,\"order\":\"desc\",\"orderBy\":\"1\",\"customLabel\":\"Command\"}}]}",
		"uiStateJSON": "{\"vis\":{\"params\":{\"sort\":{\"columnIndex\":null,\"direction\":null}}}}",
		"description": "",
		"version": 1,
			"kibanaSavedObjectMeta": {
				"searchSourceJSON": 
					"{\"index\":\"wazuh-alerts\",\"filter\":[],\"query\":{\"query\":\"rule.groups: audit\",\"language\":\"lucene\"}}"
			}
		}
	}
]