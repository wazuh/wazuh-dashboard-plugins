// Imports all modules
module.exports = (server, options) => {
    require('./server/initialize')(server, options);
    require('./server/routes/wazuh-elastic')(server, options);
    require('./server/routes/wazuh-api-elastic')(server, options);
    require('./server/monitoring')(server, options);
    require('./server/routes/wazuh-api')(server, options);
};
