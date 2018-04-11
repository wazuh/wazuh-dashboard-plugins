module.exports = (server, options) => {
    require('./server/initialize.js')(server, options);
    require('./server/routes/wazuh-elastic.js')(server, options);
    require('./server/routes/wazuh-api-elastic.js')(server, options);
    require('./server/monitoring.js')(server, options);
    require('./server/routes/wazuh-api.js')(server, options);
};
