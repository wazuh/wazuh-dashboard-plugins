module.exports = function (server, options) {
  require('./routes/ssl.js')(server, options);
  require('./routes/wazuh-api.js')(server, options);
};

