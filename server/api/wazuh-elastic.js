const ElasticWrapper = require('../lib/elastic-wrapper');

module.exports = (server, options) => {
   
    const wzWrapper = new ElasticWrapper(server);

    const getTimeStamp = async (req,reply) => {
        try {

            const data = await wzWrapper.getWazuhVersionIndexAsSearch();

            if(data.hits && 
               data.hits.hits[0] && 
               data.hits.hits[0]._source && 
               data.hits.hits[0]._source.installationDate && 
               data.hits.hits[0]._source.lastRestart){
                
                    return reply({
                        installationDate: data.hits.hits[0]._source.installationDate,
                        lastRestart     : data.hits.hits[0]._source.lastRestart
                    });

            } else {
                throw new Error('Could not fetch .wazuh-version index');
            }

        } catch (err) {
            return reply({
                statusCode: 500,
                error     : 99,
                message   : err.message || 'Could not fetch .wazuh-version index'
            }).code(500);
        }
    }

    const getTemplate = async (req, reply) => {
        try {
            const data = await wzWrapper.getTemplates();

            if (req.params.pattern == "wazuh-alerts-3.x-*" && data.includes("wazuh-alerts-3.*")) {
                return reply({
                    statusCode: 200,
                    status    : true,
                    data      : `Template found for ${req.params.pattern}`
                });   
            } else {

                const lastChar = req.params.pattern[req.params.pattern.length -1];
                const array    = data.match(/[^\s]+/g);

                let pattern = req.params.pattern;
                if (lastChar === '*') { // Remove last character if it is a '*'
                    pattern = pattern.slice(0, -1);
                }

                for (let i = 1; i < array.length; i++) {
                    if (array[i].includes(pattern) && array[i-1] == `wazuh`) {
                        return reply({
                            statusCode: 200,
                            status    : true,
                            data      : `Template found for ${req.params.pattern}`
                        });    
                    }
                }

                return reply({
                    statusCode: 200,
                    status    : false,
                    data      : `No template found for ${req.params.pattern}`
                });     
            }

        } catch (error){
            return reply({
                statusCode: 500,
                error     : 10000,
                message   : `Could not retrieve templates from Elasticsearch due to ${error.message || error}`
            }).code(500);
        }
    };

    const checkPattern = async (req, reply) => {
        try {
            const response = await wzWrapper.getAllIndexPatterns();

            const filtered = response.hits.hits.filter(item => item._source['index-pattern'].title === req.params.pattern);

            return filtered.length >= 1 ?
                   reply({ statusCode: 200, status: true, data: 'Index pattern found' }) :
                   reply({ statusCode: 500, status: false, error:10020, message: 'Index pattern not found' });
        
        } catch (error) {
            return reply({
                statusCode: 500,
                error     : 10000,
                message   : `Something went wrong retrieving index-patterns from Elasticsearch due to ${error.message || error}`
            }).code(500);
        }
    };

    const getFieldTop = async (req, reply) => {
        try{
            // Top field payload
            let payload = {
                size: 1,
                query: {
                    bool: {
                        must  : [],
                        filter: { range: { '@timestamp': {} } }
                    }
                },
                aggs: {
                    '2': {
                        terms: {
                            field: '',
                            size : 1,
                            order: { _count: 'desc' } 
                        }
                    }
                }
            };

            // Set up time interval, default to Last 24h
            const timeGTE = 'now-1d';
            const timeLT  = 'now';
            payload.query.bool.filter.range['@timestamp']['gte'] = timeGTE;
            payload.query.bool.filter.range['@timestamp']['lt']  = timeLT;

            // Set up match for default cluster name
            payload.query.bool.must.push(
                req.params.mode === 'cluster'                     ?
                { match: { 'cluster.name': req.params.cluster } } :
                { match: { 'manager.name': req.params.cluster } }
            );
     
            payload.aggs['2'].terms.field = req.params.field;

            const data = await wzWrapper.searchWazuhAlertsWithPayload(payload);

            return (data.hits.total === 0 || typeof data.aggregations['2'].buckets[0] === 'undefined') ?
                    reply({ statusCode: 200, data: '' }) :
                    reply({ statusCode: 200, data: data.aggregations['2'].buckets[0].key });

        } catch (error) {
            return reply({
                statusCode: 500,
                error     : 9,
                message   : error.message || error
            }).code(500);
        }
    };

    const getSetupInfo = async (req, reply) => {
        try {
            const data = await wzWrapper.getWazuhVersionIndexAsSearch();
            
            return data.hits.total === 0 ?
                   reply({ statusCode: 200, data: '' }) :
                   reply({ statusCode: 200, data: data.hits.hits[0]._source });
                
            
        } catch (error) {
            return reply({
                statusCode: 500,
                error     : 9,
                message   : `Could not get data from elasticsearch due to ${error.message || error}`
            }).code(500);
        }
    };

    const filterAllowedIndexPatternList = async (list,req) => {
        let finalList = [];
        for(let item of list){
            try {
                const allow = await wzWrapper.searchWazuhElementsByIndexWithRequest(req, item.title);
                if(allow && allow.hits && allow.hits.total >= 1) finalList.push(item);
            } catch (error){
                console.log(`Some user trys to fetch the index pattern ${item.title} without permissions`)
            }

        }
        return finalList;
    }

    const getlist = async (req,res) => {
        try {
            const xpack          = await wzWrapper.getPlugins();
            const isXpackEnabled = typeof xpack === 'string' && xpack.includes('x-pack');
            const isSuperUser    = isXpackEnabled && req.auth.credentials.roles.includes('superuser');
            
            const data = await wzWrapper.getAllIndexPatterns();

            if(data && data.hits && data.hits.hits.length === 0) throw new Error('There is no index pattern');
                
            if(data && data.hits && data.hits.hits){
                const minimum = ["@timestamp", "full_log", "manager.name", "agent.id"];
                let list = [];
                for(const index of data.hits.hits){   
                    let valid, parsed;        
                    try{
                        parsed = JSON.parse(index._source['index-pattern'].fields)
                    } catch (error){
                        continue;
                    }     
                    
                    valid = parsed.filter(item => minimum.includes(item.name));
                    if(valid.length === 4){
                        list.push({
                            id   : index._id.split('index-pattern:')[1],
                            title: index._source['index-pattern'].title
                        })
                    }
           
                }
                return res({data: isXpackEnabled && !isSuperUser ? await filterAllowedIndexPatternList(list,req) : list});
            }
            
            throw new Error('The Elasticsearch request didn\'t fetch the expected data');

        } catch(error){
            return res({error: error.message || error}).code(500)
        }
    }

    const deleteVis = async (req, res) => {
        try {

            const tmp = await wzWrapper.deleteVisualizationByDescription(req.params.timestamp);

            return res({acknowledge: true , output: tmp});
            
        } catch(error){
            return res({error:error.message || error}).code(500);
        }
    }

    /**
     * Replaces visualizations main fields to fit a certain pattern.
     * @param {*} app_objects Object containing raw visualizations.
     * @param {*} id Index-pattern id to use in the visualizations. Eg: 'wazuh-alerts'
     * @param {*} timestamp Milliseconds timestamp used to identify visualizations batch.
     */
    const buildVisualizationsBulk = (app_objects, id, timestamp) => {
        try{
            let body = '';
            for (let element of app_objects) {
            	// Bulk action (you define index, doc and id)
                body += '{ "index":  { "_index": ".kibana", "_type": "doc", ' + '"_id": "' + element._type + ':' + element._id + '-' + timestamp + '" } }\n';

                // Stringify and replace index-pattern for visualizations
                let aux_source = JSON.stringify(element._source);
                aux_source = aux_source.replace("wazuh-alerts", id);
                aux_source = JSON.parse(aux_source);

                // Bulk source
                let bulk_content = {};
                bulk_content[element._type] = aux_source;
                
                bulk_content["type"] = element._type;
                bulk_content.visualization.description = timestamp;
                
                body += JSON.stringify(bulk_content) + "\n";
            }
            return body;
        } catch (error) {
            return (error.message || error);
        }
    }

    const createVis = async (req, res) => {
        try {
            if(!req.params.pattern || 
               !req.params.tab || 
               !req.params.timestamp || 
               (req.params.tab && !req.params.tab.includes('manager') && !req.params.tab.includes('overview') && !req.params.tab.includes('agents'))
            ) {
                throw new Error('Missing parameters');
            }
            const tabPrefix = req.params.tab.includes('overview') ? 
                              'overview' : req.params.tab.includes('manager') ? 
                              'manager' : 
                              'agents';

            const file = tabPrefix === 'manager' ? 
                         require(`../integration-files/visualizations/ruleset/${req.params.tab.split('manager-')[1]}`) :
                         require(`../integration-files/visualizations/${tabPrefix}/${req.params.tab}`);

            const bulkBody = buildVisualizationsBulk(file,req.params.pattern,req.params.timestamp);
            await wzWrapper.pushBulkToKibanaIndex(bulkBody);

            return res({acknowledge: true});
            
        } catch(error){
            return res({error:error.message || error}).code(500);
        }
    }

    // Get index patterns list
    server.route({
        method:  'GET',
        path:    '/get-list',
        handler: getlist
    });
    //Server routes

    /*
     * GET /api/wazuh-elastic/create-vis/{tab}/{timestamp}/{pattern}
     * Create visualizations specified in 'tab' parameter with the 'timestamp' sufix and applying to 'pattern'
     *
     **/
    server.route({
        method: 'GET',
        path: '/api/wazuh-elastic/create-vis/{tab}/{timestamp}/{pattern}',
        handler: createVis
    });

    /*
     * GET /api/wazuh-elastic/delete-vis/{tab}
     * Delete visualizations specified in 'tab' parameter
     *
     **/
    server.route({
        method: 'GET',
        path: '/api/wazuh-elastic/delete-vis/{timestamp}',
        handler: deleteVis
    });

    /*
     * GET /api/wazuh-elastic/template/{pattern}
     * Returns whether a correct template is being applied for the index-pattern
     *
     **/
    server.route({
        method: 'GET',
        path: '/api/wazuh-elastic/template/{pattern}',
        handler: getTemplate
    });

    /*
     * GET /api/wazuh-elastic/pattern/{pattern}
     * Returns whether the pattern exists or not
     *
     **/
    server.route({
        method: 'GET',
        path: '/api/wazuh-elastic/pattern/{pattern}',
        handler: checkPattern
    });



    /*
     * GET /api/wazuh-elastic/top/{cluster}/{field}/{time?}
     * Returns the agent with most alerts
     *
     **/
    server.route({
        method: 'GET',
        path: '/api/wazuh-elastic/top/{mode}/{cluster}/{field}',
        handler: getFieldTop
    });

    /*
     * GET /api/wazuh-elastic/setup
     * Return Wazuh Appsetup info
     *
     **/
    server.route({
        method: 'GET',
        path: '/api/wazuh-elastic/setup',
        handler: getSetupInfo
    });

    server.route({
        method: 'GET',
        path: '/api/wazuh-elastic/timestamp',
        handler: getTimeStamp
    });
};