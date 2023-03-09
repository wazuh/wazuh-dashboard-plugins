define(['splunk_monitoring_console/routers/MonitoringConsoleLanding', '@splunk/swc-mc'], function(MonitoringConsoleLandingRouter, SwcMC) {
    var monitoringConsoleLandingRouter = new MonitoringConsoleLandingRouter();
    SwcMC.RouterUtils.start_backbone_history();
});
