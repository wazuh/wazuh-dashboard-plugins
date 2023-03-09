define(['splunk_monitoring_console/routers/MonitoringConsoleCheckList', '@splunk/swc-mc'], function(MonitoringConsoleCheckListRouter, SwcMC) {
    var monitoringConsoleCheckListRouter = new MonitoringConsoleCheckListRouter();
    SwcMC.RouterUtils.start_backbone_history();
});