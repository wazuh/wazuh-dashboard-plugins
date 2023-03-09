define(['splunk_monitoring_console/routers/MonitoringConsoleCheck', '@splunk/swc-mc'], function(MonitoringConsoleCheckRouter, SwcMC) {
    var monitoringConsoleCheckRouter = new MonitoringConsoleCheckRouter();
    SwcMC.RouterUtils.start_backbone_history();
});