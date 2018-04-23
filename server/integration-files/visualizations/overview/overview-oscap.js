module.exports = [
    {
		"_id": "Wazuh-App-Overview-OSCAP-Last-score",
		"_source": {
			"title": "Wazuh App Overview OSCAP Last score",
			"visState":
				"{\"title\":\"Wazuh App Overview OSCAP Last score\",\"type\":\"table\",\"params\":{\"perPage\":10,\"showPartialRows\":false,\"showMeticsAtAllLevels\":false,\"sort\":{\"columnIndex\":null,\"direction\":null},\"showTotal\":false,\"totalFunc\":\"sum\"},\"aggs\":[{\"id\":\"1\",\"enabled\":true,\"type\":\"max\",\"schema\":\"metric\",\"params\":{\"field\":\"@timestamp\"}},{\"id\":\"2\",\"enabled\":true,\"type\":\"terms\",\"schema\":\"bucket\",\"params\":{\"field\":\"data.oscap.scan.score\",\"size\":1,\"order\":\"desc\",\"orderBy\":\"1\"}}]}",
			"uiStateJSON": "{\"vis\":{\"params\":{\"sort\":{\"columnIndex\":null,\"direction\":null}}}}",
			"description": "",
			"version": 1,
			"kibanaSavedObjectMeta": {
				"searchSourceJSON":
					"{\"index\":\"wazuh-alerts\",\"filter\":[],\"query\":{\"query\":\"\",\"language\":\"lucene\"}}"
			}
		},
		"_type": "visualization"
	},
	{
		"_id": "Wazuh-App-Overview-OSCAP-Last-agent-scanned",
		"_source": {
			"title": "Wazuh App Overview OSCAP Last agent scanned",
			"visState":
				"{\"title\":\"Wazuh App Overview OSCAP Last agent scanned\",\"type\":\"table\",\"params\":{\"perPage\":10,\"showPartialRows\":false,\"showMeticsAtAllLevels\":false,\"sort\":{\"columnIndex\":null,\"direction\":null},\"showTotal\":false,\"totalFunc\":\"sum\"},\"aggs\":[{\"id\":\"1\",\"enabled\":true,\"type\":\"max\",\"schema\":\"metric\",\"params\":{\"field\":\"@timestamp\"}},{\"id\":\"2\",\"enabled\":true,\"type\":\"terms\",\"schema\":\"bucket\",\"params\":{\"field\":\"agent.name\",\"size\":1,\"order\":\"desc\",\"orderBy\":\"1\"}}]}",
			"uiStateJSON": "{\"vis\":{\"params\":{\"sort\":{\"columnIndex\":null,\"direction\":null}}}}",
			"description": "",
			"version": 1,
			"kibanaSavedObjectMeta": {
				"searchSourceJSON":
					"{\"index\":\"wazuh-alerts\",\"filter\":[],\"query\":{\"query\":\"data.oscap.check.result: fail AND rule.groups:oscap\",\"language\":\"lucene\"}}"
			}
		},
		"_type": "visualization"
	},
	{
		"_id": "Wazuh-App-Overview-OSCAP-Last-scan-profile",
		"_source": {
			"title": "Wazuh App Overview OSCAP Last scan profile",
			"visState":
				"{\"title\":\"Wazuh App Overview OSCAP Last scan profile\",\"type\":\"table\",\"params\":{\"perPage\":10,\"showPartialRows\":false,\"showMeticsAtAllLevels\":false,\"sort\":{\"columnIndex\":null,\"direction\":null},\"showTotal\":false,\"totalFunc\":\"sum\"},\"aggs\":[{\"id\":\"1\",\"enabled\":true,\"type\":\"max\",\"schema\":\"metric\",\"params\":{\"field\":\"@timestamp\"}},{\"id\":\"2\",\"enabled\":true,\"type\":\"terms\",\"schema\":\"bucket\",\"params\":{\"field\":\"data.oscap.scan.profile.title\",\"size\":1,\"order\":\"desc\",\"orderBy\":\"1\"}}]}",
			"uiStateJSON": "{\"vis\":{\"params\":{\"sort\":{\"columnIndex\":null,\"direction\":null}}}}",
			"description": "",
			"version": 1,
			"kibanaSavedObjectMeta": {
				"searchSourceJSON":
					"{\"index\":\"wazuh-alerts\",\"filter\":[],\"query\":{\"query\":\"\",\"language\":\"lucene\"}}"
			}
		},
		"_type": "visualization"
	},
	{
		"_id": "Wazuh-App-Overview-OSCAP-Agents",
		"_source": {
			"title": "Wazuh App Overview OSCAP Agents",
			"visState":
				"{\"params\": {\"isDonut\": false, \"shareYAxis\": true, \"addTooltip\": true, \"addLegend\": true}, \"listeners\": {}, \"type\": \"pie\", \"aggs\": [{\"type\": \"count\", \"enabled\": true, \"id\": \"1\", \"params\": {}, \"schema\": \"metric\"}, {\"type\": \"terms\", \"enabled\": true, \"id\": \"2\", \"params\": {\"orderBy\": \"1\", \"field\": \"agent.name\", \"order\": \"desc\", \"size\": 5}, \"schema\": \"segment\"}], \"title\": \"Wazuh App Overview OSCAP Agents\"}",
			"uiStateJSON": "{}",
			"description": "",
			"version": 1,
			"kibanaSavedObjectMeta": {
				"searchSourceJSON":
					"{\"index\":\"wazuh-alerts\",\"filter\":[],\"query\":{\"query\":\"rule.groups:\\\"oscap\\\" AND NOT rule.groups:\\\"syslog\\\"\",\"language\":\"lucene\"}}"
			}
		},
		"_type": "visualization"
	},
	{
		"_id": "Wazuh-App-Overview-OSCAP-Profiles",
		"_source": {
			"title": "Wazuh App Overview OSCAP Profiles",
			"visState":
				"{\"params\": {\"isDonut\": false, \"legendPosition\": \"right\", \"shareYAxis\": true, \"addTooltip\": true, \"addLegend\": true}, \"listeners\": {}, \"type\": \"pie\", \"aggs\": [{\"type\": \"count\", \"enabled\": true, \"id\": \"1\", \"params\": {}, \"schema\": \"metric\"}, {\"type\": \"terms\", \"enabled\": true, \"id\": \"3\", \"params\": {\"orderBy\": \"1\", \"field\": \"data.oscap.scan.profile.title\", \"order\": \"desc\", \"size\": 5}, \"schema\": \"segment\"}], \"title\": \"Wazuh App Overview OSCAP Profiles\"}",
			"uiStateJSON": "{}",
			"description": "",
			"version": 1,
			"kibanaSavedObjectMeta": {
				"searchSourceJSON":
					"{\"index\":\"wazuh-alerts\",\"filter\":[],\"query\":{\"query\":\"rule.groups:\\\"oscap\\\" AND NOT rule.groups:\\\"syslog\\\"\",\"language\":\"lucene\"}}"
			}
		},
		"_type": "visualization"
	},
	{
		"_id": "Wazuh-App-Overview-OSCAP-Content",
		"_source": {
			"title": "Wazuh App Overview OSCAP Content",
			"visState":
				"{\"params\": {\"isDonut\": false, \"legendPosition\": \"right\", \"shareYAxis\": true, \"addTooltip\": true, \"addLegend\": true}, \"listeners\": {}, \"type\": \"pie\", \"aggs\": [{\"type\": \"count\", \"enabled\": true, \"id\": \"1\", \"params\": {}, \"schema\": \"metric\"}, {\"type\": \"terms\", \"enabled\": true, \"id\": \"2\", \"params\": {\"orderBy\": \"1\", \"field\": \"data.oscap.scan.content\", \"order\": \"desc\", \"size\": 5}, \"schema\": \"segment\"}], \"title\": \"Wazuh App Overview OSCAP Content\"}",
			"uiStateJSON": "{}",
			"version": 1,
			"description": "",
			"kibanaSavedObjectMeta": {
				"searchSourceJSON":
					"{\"index\":\"wazuh-alerts\",\"filter\":[],\"query\":{\"query\":\"rule.groups:\\\"oscap\\\" AND NOT rule.groups:\\\"syslog\\\"\",\"language\":\"lucene\"}}"
			}
		},
		"_type": "visualization"
	},
	{
		"_id": "Wazuh-App-Overview-OSCAP-Severity",
		"_source": {
			"title": "Wazuh App Overview OSCAP Severity",
			"visState":
				"{\"title\":\"Wazuh App Overview OSCAP Severity\",\"type\":\"pie\",\"params\":{\"type\":\"pie\",\"addTooltip\":true,\"addLegend\":true,\"legendPosition\":\"right\",\"isDonut\":true},\"aggs\":[{\"id\":\"1\",\"enabled\":true,\"type\":\"count\",\"schema\":\"metric\",\"params\":{}},{\"id\":\"2\",\"enabled\":true,\"type\":\"terms\",\"schema\":\"segment\",\"params\":{\"field\":\"data.oscap.check.severity\",\"size\":5,\"order\":\"desc\",\"orderBy\":\"1\"}}]}",
			"uiStateJSON": "{}",
			"description": "",
			"version": 1,
			"kibanaSavedObjectMeta": {
				"searchSourceJSON":
					"{\"index\":\"wazuh-alerts\",\"filter\":[],\"query\":{\"query\":\"data.oscap.check.result: fail AND rule.groups:oscap AND NOT rule.groups: syslog\",\"language\":\"lucene\"}}"
			}
		},
		"_type": "visualization"
	},
	{
		"_id": "Wazuh-App-Overview-OSCAP-Top-5-agents-Severity-high",
		"_source": {
			"title": "Wazuh App Overview OSCAP Top 5 agents - Severity high",
			"visState":
				"{\"title\":\"Wazuh App Overview OSCAP Top 5 Agents - Severity high\",\"type\":\"histogram\",\"params\":{\"type\":\"histogram\",\"grid\":{\"categoryLines\":false,\"style\":{\"color\":\"#eee\"}},\"categoryAxes\":[{\"id\":\"CategoryAxis-1\",\"type\":\"category\",\"position\":\"bottom\",\"show\":true,\"style\":{},\"scale\":{\"type\":\"linear\"},\"labels\":{\"show\":true,\"truncate\":100},\"title\":{}}],\"valueAxes\":[{\"id\":\"ValueAxis-1\",\"name\":\"LeftAxis-1\",\"type\":\"value\",\"position\":\"left\",\"show\":true,\"style\":{},\"scale\":{\"type\":\"linear\",\"mode\":\"normal\"},\"labels\":{\"show\":true,\"rotate\":0,\"filter\":false,\"truncate\":100},\"title\":{\"text\":\"Count\"}}],\"seriesParams\":[{\"show\":\"true\",\"type\":\"histogram\",\"mode\":\"stacked\",\"data\":{\"label\":\"Count\",\"id\":\"1\"},\"valueAxis\":\"ValueAxis-1\",\"drawLinesBetweenPoints\":true,\"showCircles\":true}],\"addTooltip\":true,\"addLegend\":false,\"legendPosition\":\"right\",\"times\":[],\"addTimeMarker\":false},\"aggs\":[{\"id\":\"1\",\"enabled\":true,\"type\":\"count\",\"schema\":\"metric\",\"params\":{}},{\"id\":\"2\",\"enabled\":true,\"type\":\"terms\",\"schema\":\"segment\",\"params\":{\"field\":\"agent.name\",\"size\":5,\"order\":\"desc\",\"orderBy\":\"1\"}}]}",
			"uiStateJSON": "{}",
			"description": "",
			"version": 1,
			"kibanaSavedObjectMeta": {
				"searchSourceJSON":
					"{\"index\":\"wazuh-alerts\",\"filter\":[],\"query\":{\"query\":\"rule.groups: oscap AND data.oscap.check.severity: high\",\"language\":\"lucene\"}}"
			}
		},
		"_type": "visualization"
	},
	{
		"_id": "Wazuh-App-Overview-OSCAP-Top-10-alerts",
		"_source": {
			"title": "Wazuh App Overview OSCAP Top 10 alerts",
			"visState":
				"{\"title\":\"Wazuh App OSCAP Top 10 alerts\",\"type\":\"pie\",\"params\":{\"type\":\"pie\",\"addTooltip\":true,\"addLegend\":true,\"legendPosition\":\"right\",\"isDonut\":true},\"aggs\":[{\"id\":\"1\",\"enabled\":true,\"type\":\"count\",\"schema\":\"metric\",\"params\":{}},{\"id\":\"2\",\"enabled\":true,\"type\":\"terms\",\"schema\":\"segment\",\"params\":{\"field\":\"data.oscap.check.title\",\"size\":10,\"order\":\"desc\",\"orderBy\":\"1\"}}]}",
			"uiStateJSON": "{}",
			"description": "",
			"version": 1,
			"kibanaSavedObjectMeta": {
				"searchSourceJSON":
					"{\"index\":\"wazuh-alerts\",\"filter\":[],\"query\":{\"query\":\"data.oscap.check.result: fail AND rule.groups:oscap AND rule.groups: oscap-result AND data.oscap.check.result:fail\",\"language\":\"lucene\"}}"
			}
		},
		"_type": "visualization"
	},
	{
		"_id": "Wazuh-App-Overview-OSCAP-Top-10-high-risk-alerts",
		"_source": {
			"title": "Wazuh App Overview OSCAP Top 10 high risk alerts",
			"visState":
				"{\"title\":\"Wazuh App OSCAP Top 10 high risk alerts\",\"type\":\"pie\",\"params\":{\"type\":\"pie\",\"addTooltip\":true,\"addLegend\":true,\"legendPosition\":\"right\",\"isDonut\":true},\"aggs\":[{\"id\":\"1\",\"enabled\":true,\"type\":\"count\",\"schema\":\"metric\",\"params\":{}},{\"id\":\"2\",\"enabled\":true,\"type\":\"terms\",\"schema\":\"segment\",\"params\":{\"field\":\"data.oscap.check.title\",\"size\":10,\"order\":\"desc\",\"orderBy\":\"1\"}}]}",
			"uiStateJSON": "{}",
			"description": "",
			"version": 1,
			"kibanaSavedObjectMeta": {
				"searchSourceJSON":
					"{\"index\":\"wazuh-alerts\",\"filter\":[],\"query\":{\"query\":\"data.oscap.check.severity: high AND data.oscap.check.result: fail AND rule.groups:oscap AND rule.groups: oscap-result AND data.oscap.check.result:fail\",\"language\":\"lucene\"}}"
			}
		},
		"_type": "visualization"
	},
	{
		"_id": "Wazuh-App-Overview-OSCAP-Highest-score",
		"_source": {
		  "title": "Wazuh App Overview OSCAP Highest score",
		  "visState": "{\"title\":\"Wazuh App Overview OSCAP Highest score\",\"type\":\"table\",\"params\":{\"perPage\":10,\"showPartialRows\":false,\"showMeticsAtAllLevels\":false,\"sort\":{\"columnIndex\":null,\"direction\":null},\"showTotal\":false,\"totalFunc\":\"sum\"},\"aggs\":[{\"id\":\"1\",\"enabled\":true,\"type\":\"max\",\"schema\":\"metric\",\"params\":{\"field\":\"data.oscap.scan.score\"}},{\"id\":\"2\",\"enabled\":true,\"type\":\"terms\",\"schema\":\"bucket\",\"params\":{\"field\":\"data.oscap.scan.score\",\"size\":1,\"order\":\"desc\",\"orderBy\":\"1\"}}]}",
		  "uiStateJSON": "{\"vis\":{\"params\":{\"sort\":{\"columnIndex\":0,\"direction\":null}}}}",
		  "description": "",
		  "version": 1,
		  "kibanaSavedObjectMeta": {
		    "searchSourceJSON": "{\"index\":\"wazuh-alerts\",\"filter\":[],\"query\":{\"query\":\"\",\"language\":\"lucene\"}}"
		  }
		},
		"_type": "visualization"
	},
	{
		"_id": "Wazuh-App-Overview-OSCAP-Lowest-score",
		"_source": {
		  "title": "Wazuh App Overview OSCAP Lowest score",
		  "visState": "{\"title\":\"Wazuh App Overview OSCAP Lowest score\",\"type\":\"table\",\"params\":{\"perPage\":10,\"showPartialRows\":false,\"showMeticsAtAllLevels\":false,\"sort\":{\"columnIndex\":null,\"direction\":null},\"showTotal\":false,\"totalFunc\":\"sum\"},\"aggs\":[{\"id\":\"1\",\"enabled\":true,\"type\":\"min\",\"schema\":\"metric\",\"params\":{\"field\":\"data.oscap.scan.score\"}},{\"id\":\"2\",\"enabled\":true,\"type\":\"terms\",\"schema\":\"bucket\",\"params\":{\"field\":\"data.oscap.scan.score\",\"size\":1,\"order\":\"asc\",\"orderBy\":\"1\"}}]}",
		  "uiStateJSON": "{\"vis\":{\"params\":{\"sort\":{\"columnIndex\":null,\"direction\":null}}}}",
		  "description": "",
		  "version": 1,
		  "kibanaSavedObjectMeta": {
		    "searchSourceJSON": "{\"index\":\"wazuh-alerts\",\"filter\":[],\"query\":{\"query\":\"\",\"language\":\"lucene\"}}"
		  }
		},
		"_type": "visualization"
	},
	{
		"_id": "Wazuh-App-Overview-OSCAP-Latest-alert",
		"_source": {
			"title": "Wazuh App Overview OSCAP Latest alert",
			"visState":
				"{\"title\":\"Wazuh App Overview OSCAP Latest alert\",\"type\":\"table\",\"params\":{\"perPage\":10,\"showPartialRows\":false,\"showMeticsAtAllLevels\":false,\"sort\":{\"columnIndex\":null,\"direction\":null},\"showTotal\":false,\"totalFunc\":\"sum\"},\"aggs\":[{\"id\":\"1\",\"enabled\":true,\"type\":\"max\",\"schema\":\"metric\",\"params\":{\"field\":\"@timestamp\"}},{\"id\":\"2\",\"enabled\":true,\"type\":\"terms\",\"schema\":\"bucket\",\"params\":{\"field\":\"data.oscap.check.title\",\"size\":1,\"order\":\"desc\",\"orderBy\":\"1\"}}]}",
			"uiStateJSON": "{\"vis\":{\"params\":{\"sort\":{\"columnIndex\":null,\"direction\":null}}}}",
			"description": "",
			"version": 1,
			"kibanaSavedObjectMeta": {
				"searchSourceJSON":
					"{\"index\":\"wazuh-alerts\",\"filter\":[],\"query\":{\"query\":\"data.oscap.check.result: fail AND rule.groups:oscap AND rule.groups: oscap-result AND data.oscap.check.result:fail\",\"language\":\"lucene\"}}"
			}
		},
		"_type": "visualization"
	},
	{
		"_id": "Wazuh-App-Overview-OSCAP-Last-alerts",
		"_type": "visualization",
		"_source": {
		"title": "Wazuh App Overview OSCAP Last alerts",
		"visState": "{\"title\":\"Wazuh App Overview OSCAP Last alerts\",\"type\":\"table\",\"params\":{\"perPage\":10,\"showPartialRows\":false,\"showMeticsAtAllLevels\":false,\"sort\":{\"columnIndex\":null,\"direction\":null},\"showTotal\":false,\"totalFunc\":\"sum\"},\"aggs\":[{\"id\":\"1\",\"enabled\":true,\"type\":\"count\",\"schema\":\"metric\",\"params\":{}},{\"id\":\"2\",\"enabled\":true,\"type\":\"terms\",\"schema\":\"bucket\",\"params\":{\"field\":\"agent.name\",\"otherBucket\":false,\"otherBucketLabel\":\"Other\",\"missingBucket\":false,\"missingBucketLabel\":\"Missing\",\"size\":40,\"order\":\"desc\",\"orderBy\":\"1\",\"customLabel\":\"Agent\"}},{\"id\":\"3\",\"enabled\":true,\"type\":\"terms\",\"schema\":\"bucket\",\"params\":{\"field\":\"data.oscap.check.title\",\"otherBucket\":false,\"otherBucketLabel\":\"Other\",\"missingBucket\":false,\"missingBucketLabel\":\"Missing\",\"size\":5,\"order\":\"desc\",\"orderBy\":\"1\",\"customLabel\":\"Title\"}},{\"id\":\"4\",\"enabled\":true,\"type\":\"terms\",\"schema\":\"bucket\",\"params\":{\"field\":\"data.oscap.scan.profile.title\",\"otherBucket\":false,\"otherBucketLabel\":\"Other\",\"missingBucket\":false,\"missingBucketLabel\":\"Missing\",\"size\":5,\"order\":\"desc\",\"orderBy\":\"1\",\"customLabel\":\"Profile\"}},{\"id\":\"6\",\"enabled\":true,\"type\":\"terms\",\"schema\":\"bucket\",\"params\":{\"field\":\"data.oscap.scan.content\",\"otherBucket\":false,\"otherBucketLabel\":\"Other\",\"missingBucket\":false,\"missingBucketLabel\":\"Missing\",\"size\":5,\"order\":\"desc\",\"orderBy\":\"1\",\"customLabel\":\"Content\"}}]}",
		"uiStateJSON": "{\"vis\":{\"params\":{\"sort\":{\"columnIndex\":null,\"direction\":null}}}}",
		"description": "",
		"version": 1,
			"kibanaSavedObjectMeta": {
				"searchSourceJSON": 
					"{\"index\":\"wazuh-alerts\",\"filter\":[],\"query\":{\"query\":\"rule.groups: oscap\",\"language\":\"lucene\"}}"
			}
		}
	}
]