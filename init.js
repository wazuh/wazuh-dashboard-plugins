module.exports = function (server, options) {
  require('./server/scripts/initialize.js')(server, options);
  require('./server/routes/wazuh-api.js')(server, options);
  require('./server/wazuh-monitoring.js')(server, options);
};