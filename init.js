module.exports = function (server, options) {
  require('./server/startup/initialize.js')(server, options);
  require('./server/api/wazuh-api.js')(server, options);
  require('./server/api/wazuh-elastic.js')(server, options);
  require('./server/wazuh-monitoring.js')(server, options);
};