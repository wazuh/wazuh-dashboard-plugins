define(['splunk_monitoring_console/routers/MonitoringConsoleForwarderSetup', '@splunk/swc-mc'], function(MonitoringConsoleForwarderSetupRouter, SwcMC) {
    var monitoringConsoleForwarderSetupRouter = new MonitoringConsoleForwarderSetupRouter();
    SwcMC.RouterUtils.start_backbone_history();
});
