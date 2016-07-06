var util = require('util');

var dashboards = {
    CISCompliance : "((col:1,id:'CIS:-Requirements-by-time',panelIndex:1,row:1,size_x:6,size_y:3,type:visualization),(col:1,columns:!(AgentName,rule.AlertLevel,rule.CIS,full_log),id:'CIS:-Last-Alerts',panelIndex:2,row:10,size_x:12,size_y:4,sort:!('@timestamp',desc),type:search),(col:5,id:'CIS:-Evolution-by-agent',panelIndex:3,row:4,size_x:8,size_y:3,type:visualization),(col:7,id:'CIS:-Security-breaches-by-agent',panelIndex:4,row:7,size_x:3,size_y:3,type:visualization),(col:7,id:'CIS:-Sections',panelIndex:5,row:1,size_x:6,size_y:3,type:visualization),(col:10,id:Top-CIS-Breaches,panelIndex:6,row:7,size_x:3,size_y:3,type:visualization),(col:1,id:Groups-and-Benchmarks,panelIndex:7,row:4,size_x:4,size_y:3,type:visualization),(col:1,id:Agents-and-Benchmarks,panelIndex:8,row:7,size_x:6,size_y:3,type:visualization))",
    OSSECAlerts : "((col:10,id:Agents-total-alerts,panelIndex:1,row:8,size_x:3,size_y:3,type:visualization),(col:1,id:'Alerts:-Geolocation',panelIndex:2,row:1,size_x:6,size_y:4,type:visualization),(col:7,columns:!(AgentName,rule.AlertLevel,rule.description),id:Alerts-level-greater-than-9,panelIndex:3,row:11,size_x:6,size_y:3,sort:!('@timestamp',desc),type:search),(col:1,columns:!(AgentName,AgentIP,rule.sidid,rule.AlertLevel,rule.description,full_log),id:Last-alerts,panelIndex:4,row:14,size_x:12,size_y:5,sort:!('@timestamp',desc),type:search),(col:7,id:Total-Alerts-Time-Bar,panelIndex:5,row:3,size_x:6,size_y:2,type:visualization),(col:1,id:Location-Bar-Alerts,panelIndex:6,row:8,size_x:3,size_y:3,type:visualization),(col:10,id:'Alerts:-Top-5-Groups',panelIndex:7,row:1,size_x:3,size_y:2,type:visualization),(col:1,id:'Signature:-Area-Chart',panelIndex:8,row:5,size_x:6,size_y:3,type:visualization),(col:4,id:'Pie-Chart:-Signature',panelIndex:9,row:8,size_x:3,size_y:3,type:visualization),(col:7,id:'Alerts:-By-country',panelIndex:10,row:1,size_x:3,size_y:2,type:visualization),(col:7,id:Stacked-Groups,panelIndex:11,row:5,size_x:6,size_y:3,type:visualization),(col:7,id:Alert-level-evolution,panelIndex:12,row:8,size_x:3,size_y:3,type:visualization),(col:1,id:Signature-counts,panelIndex:13,row:11,size_x:6,size_y:3,type:visualization))",
    PCICompliance : "((col:7,id:'PCIDSS:-By-section',panelIndex:1,row:4,size_x:3,size_y:4,type:visualization),(col:1,id:Requirements-by-agent,panelIndex:2,row:8,size_x:12,size_y:2,type:visualization),(col:1,id:'PCI-DSS:-Requirement-11.4',panelIndex:3,row:4,size_x:3,size_y:2,type:visualization),(col:1,id:High-Risk-Alerts-slash-PCI-DSS,panelIndex:4,row:10,size_x:12,size_y:2,type:visualization),(col:1,id:'PCI-DSS:-Signature-Area-Chart',panelIndex:5,row:18,size_x:12,size_y:3,type:visualization),(col:1,id:PCI-Requirements-by-time,panelIndex:6,row:1,size_x:6,size_y:3,type:visualization),(col:7,id:Requirements-slash-Groups,panelIndex:7,row:1,size_x:6,size_y:3,type:visualization),(col:10,id:PCI-Requirements-slash-Agent,panelIndex:8,row:4,size_x:3,size_y:4,type:visualization),(col:1,id:Integrity-checksum-changed,panelIndex:9,row:12,size_x:5,size_y:3,type:visualization),(col:6,id:File-table-integrity-checksum-changed,panelIndex:10,row:12,size_x:7,size_y:3,type:visualization),(col:4,id:'PCI-DSS:-Requirement-10.2.2',panelIndex:11,row:4,size_x:3,size_y:2,type:visualization),(col:1,id:'PCI-DSS:-Requirement-10.2.5',panelIndex:12,row:6,size_x:3,size_y:2,type:visualization),(col:4,id:'PCI-DSS:-Requirement-10.6.1',panelIndex:13,row:6,size_x:3,size_y:2,type:visualization),(col:1,columns:!(AgentName,rule.AlertLevel,rule.PCI_DSS,rule.description),id:Last-Alerts,panelIndex:14,row:15,size_x:12,size_y:3,sort:!(rule.groups,desc),type:search))"
};

var visualizations = {
    AlertsByCountry : {type: 'pie', data: "vis:(aggs:!((id:'1',params:(),schema:metric,type:count),(id:'2',params:(field:GeoLocation.country_name,order:desc,orderBy:'1',size:5),schema:segment,type:terms)),listeners:(),params:(addLegend:!t,addTooltip:!t,isDonut:!f,shareYAxis:!t),title:'Alerts:%20By%20country',type:pie))"},
    ManagerRestarts: {type: 'histogram', data: "vis:(aggs:!((id:'1',params:(),schema:metric,type:count),(id:'2',params:(customInterval:'2h',extended_bounds:(),field:'@timestamp',interval:h,min_doc_count:1),schema:segment,type:date_histogram),(id:'3',params:(filters:!((input:(query:(query_string:(analyze_wildcard:!t,query:'rule.sidid:502'))),label:'Manager%20started'))),schema:group,type:filters)),listeners:(),params:(addLegend:!t,addTimeMarker:!f,addTooltip:!t,defaultYExtents:!f,mode:stacked,scale:linear,setYExtents:!f,shareYAxis:!t,times:!(),yAxis:()),title:'Manager%20restarts%20count%20last%207%20days',type:histogram))"}
};

/*
This method creates a new dashboard and returns the URL
The dashboard is not saved anywhere
Structure -> JSON structure of the dashboard 
Filter -> Filter expresion (Can be blank string)
Time -> Time selection string (Can be blank string)
URL -> If true, the method will return an URL. Else, will return an iframe.
*/
exports.newDashboard = function (structure, filter, time, url) {
    if (time == '') {
        time = 'from:now-24h,mode:quick,to:now';
    }
    if (filter == '') {
        filter = '*';
    }
    if (url) {
        return util.format('/app/kibana#/dashboard?embed=true&_g=(refreshInterval:(display:Off,pause:!f,value:0),time:(%s))&_a=(filters:!(),options:(darkTheme:!f),panels:!%s,query:(query_string:(analyze_wildcard:!t,query:\'%s\')),title:\'%s\',uiState:())', time, structure, filter, 'New dashboard');
    } else {
        return util.format('/app/kibana#/dashboard?_g=(refreshInterval:(display:Off,pause:!f,value:0),time:(%s))&_a=(filters:!(),options:(darkTheme:!f),panels:!%s,query:(query_string:(analyze_wildcard:!t,query:\'%s\')),title:\'%s\',uiState:())', time, structure, filter, 'New dashboard');
    }
};

/*
Dashboard -> Dashboard name (from dashboards var)
Filter -> Filter expresion (Can be blank string)
Time -> Time selection string (Can be blank string)
URL -> If true, the method will return an URL. Else, will return an iframe.
*/
exports.getDashboard = function (dashboard, filter, time, url) {
    if (time == '') {
        time = 'from:now-24h,mode:quick,to:now';
    }
    if (filter == '') {
        filter = '*';
    }
    if (dashboards[dashboard] != undefined) {
        var structure = dashboards[dashboard];
    } else {
        return '';
    }
    if (url) {
        return util.format('/app/kibana#/dashboard?embed=true&_g=(refreshInterval:(display:Off,pause:!f,value:0),time:(%s))&_a=(filters:!(),options:(darkTheme:!f),panels:!%s,query:(query_string:(analyze_wildcard:!t,query:\'%s\')),title:\'%s\',uiState:())', time, structure, filter, dashboard);
    } else {
        return util.format('/app/kibana#/dashboard?_g=(refreshInterval:(display:Off,pause:!f,value:0),time:(%s))&_a=(filters:!(),options:(darkTheme:!f),panels:!%s,query:(query_string:(analyze_wildcard:!t,query:\'%s\')),title:\'%s\',uiState:())', time, structure, filter, dashboard);
    }
};

/*
Index -> Elastic index
Query -> Query expresion (Can be blank string)
Time -> Time selection string (Can be blank string)
*/
exports.getAlerts = function (index, query, time) {
    if (time == '') {
        time = 'from:now-24h,mode:quick,to:now';
    }

    return util.format('/app/kibana#/discover?_a=(columns:!(_source),index:\'%s\',interval:auto,query:(query_string:(analyze_wildcard:!t,query:\'%s\')),sort:!(\'@timestamp\',desc))&_g=(refreshInterval:(display:Off,pause:!f,value:0),time:(%s))', index, query, time);
};

/*
Visualization -> Visualization name (from visualizations var)
Filter -> Filter expresion (Can be blank string)
Time -> Time selection string (Can be blank string)
URL -> If true, the method will return an URL. Else, will return an iframe.
*/
exports.getVisualization = function (visualization, filter, time, url) {
    if (time == '') {
        time = 'from:now-24h,mode:quick,to:now';
    }
    if (filter == '') {
        filter = '*';
    }
    if (visualizations[visualization] != undefined) {
        var structure = visualizations[visualization];
    } else {
        return '';
    }
    if (url) {
        return util.format('/app/kibana#/visualize/create?indexPattern=ossec-*&type=%s&_g=(refreshInterval:(display:Off,pause:!f,value:0),time:(%s))&_a=(filters:!(),linked:!f,query:(query_string:(analyze_wildcard:!t,query:\'%s\')),uiState:(),%s', structure.type, time, filter, structure.data);
    } else {
        return util.format('/app/kibana#/visualize/create?embed=true&indexPattern=ossec-*&type=%s&_g=(refreshInterval:(display:Off,pause:!f,value:0),time:(%s))&_a=(filters:!(),linked:!f,query:(query_string:(analyze_wildcard:!t,query:\'%s\')),uiState:(),%s', structure.type, time, filter, structure.data);
    }
}

/*
Type -> Visualization type
Structuredata -> Structure of the visualization
Filter -> Filter expresion (Can be blank string)
Time -> Time selection string (Can be blank string)
URL -> If true, the method will return an URL. Else, will return an iframe.
*/
exports.newVisualization = function (type, structuredata, filter, time, url) {
    if (time == '') {
        time = 'from:now-24h,mode:quick,to:now';
    }
    if (filter == '') {
        filter = '*';
    }
    if (url) {
        return util.format('/app/kibana#/visualize/create?indexPattern=ossec-*&type=%s&_g=(refreshInterval:(display:Off,pause:!f,value:0),time:(%s))&_a=(filters:!(),linked:!f,query:(query_string:(analyze_wildcard:!t,query:\'%s\')),uiState:(),%s', type, time, filter, structuredata);
    } else {
        return util.format('/app/kibana#/visualize/create?embed=true&indexPattern=ossec-*&type=%s&_g=(refreshInterval:(display:Off,pause:!f,value:0),time:(%s))&_a=(filters:!(),linked:!f,query:(query_string:(analyze_wildcard:!t,query:\'%s\')),uiState:(),%s', type, time, filter, structuredata);
    }
}