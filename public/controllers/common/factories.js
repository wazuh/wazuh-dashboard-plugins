const app = require('ui/modules').get('app/wazuh', []);

app
	.factory('Groups', function(DataHandler) {
		let Groups = new DataHandler();
		Groups.path = '/agents/groups';
		return Groups;
	})
	.factory('GroupAgents', function(DataHandler) {
		return new DataHandler();
	})
	.factory('GroupFiles', function(DataHandler) {
		return new DataHandler();
    })
    .factory('AgentsAutoComplete', function (DataHandler) {
        let AgentsAutoComplete  = new DataHandler();
        AgentsAutoComplete.path = '/agents';
        return AgentsAutoComplete;
    })
    .factory('Agents', function (DataHandler) {
        let Agents  = new DataHandler();
        Agents.path = '/agents';
        return Agents;
    })
    .factory('Logs', function (DataHandler) {
        let Logs  = new DataHandler();
        Logs.path = '/manager/logs';
        return Logs;
    })
    .factory('Rules', function (DataHandler) {
        let Rules  = new DataHandler();
        Rules.path = '/rules';
        return Rules;
    })
    .factory('Decoders', function (DataHandler) {
        let Decoders  = new DataHandler();
        Decoders.path = '/decoders';
        return Decoders;
    });

    