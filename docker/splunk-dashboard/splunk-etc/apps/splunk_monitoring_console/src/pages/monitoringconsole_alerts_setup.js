define(['splunk_monitoring_console/routers/MonitoringConsoleAlertsSetup', '@splunk/swc-mc'], function(MonitoringConsoleAlertsSetupRouter, SwcMC) {
    var monitoringConsoleAlertsSetupRouter = new MonitoringConsoleAlertsSetupRouter();
    SwcMC.RouterUtils.start_backbone_history();
});
