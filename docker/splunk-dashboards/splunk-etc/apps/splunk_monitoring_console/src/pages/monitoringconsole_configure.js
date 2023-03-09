define(['splunk_monitoring_console/routers/MonitoringConsoleConfigure', '@splunk/swc-mc'], function(MonitoringConsoleConfigureRouter, SwcMC) {
	var monitoringConsoleConfigureRouter = new MonitoringConsoleConfigureRouter();
	SwcMC.RouterUtils.start_backbone_history();
});
