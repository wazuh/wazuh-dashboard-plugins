define(['splunk_monitoring_console/routers/MonitoringConsoleOverview', '@splunk/swc-mc'], function(MonitoringConsoleOverviewRouter, SwcMC) {
    var monitoringConsoleOverviewRouter = new MonitoringConsoleOverviewRouter();
    SwcMC.RouterUtils.start_backbone_history();
});
