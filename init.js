module.exports = function (server, options) {
  require('./server/initialize.js')(server, options);
  require('./server/api/wazuh-elastic.js')(server, options);
  require('./server/api/wazuh-api-elastic.js')(server, options);
  require('./server/monitoring.js')(server, options);
  require('./server/api/wazuh-api.js')(server, options);
};
