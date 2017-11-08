const app = require('ui/modules').get('app/wazuh', []);

/**
 * Main function to build a data handler factory.
 * @param {*} DataHandler 
 * @param {*} path 
 */
const compose = (DataHandler, path) => {
    let dataHandler  = new DataHandler();
    dataHandler.path = path;
    return dataHandler;
};

const groups   = DataHandler => compose(DataHandler,'/agents/groups');
const agents   = DataHandler => compose(DataHandler,'/agents');
const logs     = DataHandler => compose(DataHandler, '/manager/logs');
const rules    = DataHandler => compose(DataHandler, '/rules');
const decoders = DataHandler => compose(DataHandler, '/decoders');
const simple   = DataHandler => new DataHandler();

app
	.factory('Groups', groups)
	.factory('GroupAgents', simple)
	.factory('GroupFiles', simple)
    .factory('AgentsAutoComplete', agents)
    .factory('Agents', agents)
    .factory('Logs', logs)
    .factory('Rules', rules)
    .factory('Decoders', decoders);
