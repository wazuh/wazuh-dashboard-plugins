// Imports all modules
import initialize      from './server/initialize';
import wazuhElastic    from './server/routes/wazuh-elastic';
import wazuhApiElastic from './server/routes/wazuh-api-elastic';
import monitoring      from './server/monitoring';
import wazuhApi        from './server/routes/wazuh-api';

export default (server, options) => {
    initialize(server, options);
    wazuhElastic(server, options);
    wazuhApiElastic(server, options);
    monitoring(server, false);
    wazuhApi(server, options);
};
