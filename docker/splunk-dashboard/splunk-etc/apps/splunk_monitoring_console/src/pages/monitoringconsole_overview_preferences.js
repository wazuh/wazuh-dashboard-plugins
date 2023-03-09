define(['splunk_monitoring_console/routers/MonitoringConsoleOverviewPreferences', '@splunk/swc-mc'], function(MonitoringConsoleOverviewPreferencesRouter, SwcMC) {
    var monitoringConsoleOverviewPreferencesRouter = new MonitoringConsoleOverviewPreferencesRouter();
    SwcMC.RouterUtils.start_backbone_history();
});
