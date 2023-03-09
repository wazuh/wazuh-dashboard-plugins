define(['splunk_monitoring_console/routers/SplunkAssist', '@splunk/swc-mc'], function(SplunkAssistRouter, SwcMC) {
    var router = new SplunkAssistRouter();
    SwcMC.RouterUtils.start_backbone_history();
});
