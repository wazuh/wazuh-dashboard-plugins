define(['splunk_monitoring_console/routers/MonitoringConsoleInstances', '@splunk/swc-mc'], function(MonitoringConsoleInstancesRouter, SwcMC) {
    var monitoringConsoleInstancesRouter = new MonitoringConsoleInstancesRouter();
    SwcMC.RouterUtils.start_backbone_history();
});
