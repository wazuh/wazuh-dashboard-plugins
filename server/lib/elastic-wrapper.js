const knownFields = require('../integration-files/known-fields');
const needle      = require('needle');
class ElasticWrapper{
    constructor(server){
        this.elasticRequest = server.plugins.elasticsearch.getCluster('data');
        this.WZ_KIBANA_INDEX = server && 
                               server.registrations && 
                               server.registrations.kibana &&
                               server.registrations.kibana.options &&
                               server.registrations.kibana.options.index ?
                               server.registrations.kibana.options.index :
                               '.kibana'
    }

    /**
     * This function checks if an index pattern exists, 
     * you should check response.hits.total
     * @param {*} id Eg: 'wazuh-alerts'
     */
    async searchIndexPatternById(id){
        try {
            if(!id) return Promise.reject(new Error('No valid id for search index pattern'))
            
            const data = await this.elasticRequest.callWithInternalUser('search', {
                index: this.WZ_KIBANA_INDEX,
                type: 'doc',
                body: {
                    "query": {
                        "match": {
                            "_id": "index-pattern:" + id 
                        }
                    }
                }
            });     

            return data;

        } catch (error) {
            return Promise.reject(error);
        }
    }

    /**
     * Search any index by name
     * @param {*} name 
     */
    async searchIndexByName(name) {
        try {
            if(!name) return Promise.reject(new Error('No valid name given'))

            const data = await this.elasticRequest.callWithInternalUser('search', { index: name });

            return data;

        } catch (error) {
            return Promise.reject(error);
        }
    }

    /**
     * This function creates a new index pattern.
     * @param {*} title Eg: 'wazuh-alerts-3.x-*'
     * @param {*} id Optional.
     */
    async createIndexPattern(title,id) {
        try {
            if(!title) return Promise.reject(new Error('No valid title for create index pattern'))

            const data = await this.elasticRequest.callWithInternalUser('create', {
                index: this.WZ_KIBANA_INDEX,
                type: 'doc',
                id: id ? id : 'index-pattern:' + title,
                body: {
                    type: 'index-pattern',
                    'index-pattern': {
                        title: title,
                        timeFieldName: '@timestamp'
                    }
                }
            });

            return data;

        } catch (error) {
            return Promise.reject(error);
        }
    } 

    /**
     * Special function to create the wazuh-monitoring index pattern,
     * do not use for any other creation, use the right function instead.
     * @param {*} title 
     * @param {*} id 
     */
    async createMonitoringIndexPattern(title,id) {
        try {
            if(!title) return Promise.reject(new Error('No valid title for create index pattern'))

            const data = await this.elasticRequest.callWithInternalUser('create', { 
                index: this.WZ_KIBANA_INDEX, 
                type: 'doc', 
                id: id ? id : 'index-pattern:' + title,
                body: {
                    "type": 'index-pattern', 
                    "index-pattern": { 
                        "fields":'[{"name":"@timestamp","type":"date","count":0,"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true},{"name":"_id","type":"string","count":0,"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":false},{"name":"_index","type":"string","count":0,"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":false},{"name":"_score","type":"number","count":0,"scripted":false,"searchable":false,"aggregatable":false,"readFromDocValues":false},{"name":"_source","type":"_source","count":0,"scripted":false,"searchable":false,"aggregatable":false,"readFromDocValues":false},{"name":"_type","type":"string","count":0,"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":false},{"name":"dateAdd","type":"string","count":0,"scripted":false,"searchable":true,"aggregatable":false,"readFromDocValues":false},{"name":"dateAdd.keyword","type":"string","count":0,"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true},{"name":"group","type":"string","count":0,"scripted":false,"searchable":true,"aggregatable":false,"readFromDocValues":false},{"name":"group.keyword","type":"string","count":0,"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true},{"name":"host","type":"string","count":0,"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true},{"name":"id","type":"string","count":0,"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true},{"name":"ip","type":"string","count":0,"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true},{"name":"lastKeepAlive","type":"string","count":0,"scripted":false,"searchable":true,"aggregatable":false,"readFromDocValues":false},{"name":"lastKeepAlive.keyword","type":"string","count":0,"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true},{"name":"manager_host","type":"string","count":0,"scripted":false,"searchable":true,"aggregatable":false,"readFromDocValues":false},{"name":"manager_host.keyword","type":"string","count":0,"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true},{"name":"name","type":"string","count":0,"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true},{"name":"os.arch","type":"string","count":0,"scripted":false,"searchable":true,"aggregatable":false,"readFromDocValues":false},{"name":"os.arch.keyword","type":"string","count":0,"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true},{"name":"os.codename","type":"string","count":0,"scripted":false,"searchable":true,"aggregatable":false,"readFromDocValues":false},{"name":"os.codename.keyword","type":"string","count":0,"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true},{"name":"os.major","type":"string","count":0,"scripted":false,"searchable":true,"aggregatable":false,"readFromDocValues":false},{"name":"os.major.keyword","type":"string","count":0,"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true},{"name":"os.name","type":"string","count":0,"scripted":false,"searchable":true,"aggregatable":false,"readFromDocValues":false},{"name":"os.name.keyword","type":"string","count":0,"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true},{"name":"os.platform","type":"string","count":0,"scripted":false,"searchable":true,"aggregatable":false,"readFromDocValues":false},{"name":"os.platform.keyword","type":"string","count":0,"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true},{"name":"os.uname","type":"string","count":0,"scripted":false,"searchable":true,"aggregatable":false,"readFromDocValues":false},{"name":"os.uname.keyword","type":"string","count":0,"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true},{"name":"os.version","type":"string","count":0,"scripted":false,"searchable":true,"aggregatable":false,"readFromDocValues":false},{"name":"os.version.keyword","type":"string","count":0,"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true},{"name":"status","type":"string","count":0,"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true},{"name":"version","type":"string","count":0,"scripted":false,"searchable":true,"aggregatable":false,"readFromDocValues":false},{"name":"version.keyword","type":"string","count":0,"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true}]',
                        "title": title, 
                        "timeFieldName": '@timestamp' 
                    } 
                } 
            });

            return data;

        } catch (error) {
            return Promise.reject(error);
        }
    }

    /**
     * Creates the .wazuh-version index with a custom configuration.
     * @param {*} config 
     */
    async createWazuhVersionIndex(configuration) {
        try {
            if(!configuration) return Promise.reject(new Error('No valid configuration for create .wazuh-version index'))

            const data = await this.elasticRequest.callWithInternalUser('indices.create', {
                index: '.wazuh-version',
                body : configuration
            });

            return data;

        } catch (error) {
            return Promise.reject(error);
        }
    }

    /**
     * Creates the .wazuh index with a custom configuration.
     * @param {*} config 
     */
    async createWazuhIndex(configuration) {
        try {
            if(!configuration) return Promise.reject(new Error('No valid configuration for create .wazuh index'))

            const data = await this.elasticRequest.callWithInternalUser('indices.create', {
                index: '.wazuh',
                body : configuration
            });

            return data;

        } catch (error) {
            return Promise.reject(error);
        }
    }

    /**
     * Inserts configuration on .wazuh-version index
     * @param {*} configuration 
     */
    async insertWazuhVersionConfiguration(configuration) {
        try {
            if(!configuration) return Promise.reject(new Error('No valid configuration for create .wazuh-version index'))

            const data = await this.elasticRequest.callWithInternalUser('create', {
                index: '.wazuh-version',
                type : 'wazuh-version',
                id   : 1,
                body : configuration
            });

            return data;

        } catch (error) {
            return Promise.reject(error);
        }
    }

    /**
     * Get all the index patterns 
     */
    async getAllIndexPatterns(){
        try {
            const data = await this.elasticRequest.callWithInternalUser('search', {
                index: this.WZ_KIBANA_INDEX,
                type: 'doc',
                body: {
                    "query":{
                        "match":{
                          "type": "index-pattern"
                        }
                      },
                    "size": 999
                }
            });

            return data;

        } catch (error) {
            return Promise.reject(error);
        }
    }

    /**
     * Updates index-pattern known fields
     * @param {*} patternId 'index-pattern:' + id
     */
    async updateIndexPatternKnownFields(id) {
        try {
            if(!id) return Promise.reject(new Error('No valid index pattern id for update index pattern'));

            const newFields = JSON.stringify(knownFields);

            const data = await this.elasticRequest.callWithInternalUser('update', {
                index: this.WZ_KIBANA_INDEX,
                type: 'doc',
                id: id.includes('index-pattern:') ? id : 'index-pattern:' + id,
                body: {
                    doc: {
                        "type": 'index-pattern',
                        "index-pattern": {  
                            "fields": newFields,
                            "fieldFormatMap": '{"data.virustotal.permalink":{"id":"url"},"data.vulnerability.reference":{"id":"url"},"data.url":{"id":"url"}}'
                        }
                     }
                }
             });

             return data;

        } catch (error) {
            return Promise.reject(error);
        }
    }

    /**
     * Force refreshing an index
     * @param {*} name 
     */
    async refreshIndexByName(name){
        try {
            if(!name) return Promise.reject(new Error('No valid name given'));

            const data = await this.elasticRequest.callWithInternalUser('indices.refresh', { index: name });

            return data;

        } catch (error) {
            return Promise.reject(error);
        }
    }

    /**
     * Get the .wazuh-version index
     */
    async getWazuhVersionIndex() {
        try {
            const data = await this.elasticRequest.callWithInternalUser('get', {
                index: ".wazuh-version",
                type: "wazuh-version",
                id: "1"
            });

            return data;

        } catch (error) {
            return Promise.reject(error);
        }
    }

    /**
     * Updates lastRestart field on .wazuh-version index
     * @param {*} version 
     * @param {*} revision 
     */
    async updateWazuhVersionIndexLastRestart(version,revision) {
        try {
            if(!version || !revision) return Promise.reject(new Error('No valid version or revision given'));
            
            const data = await this.elasticRequest.callWithInternalUser('update', { 
                index: '.wazuh-version', 
                type : 'wazuh-version',
                id   : 1,
                body : {
                    doc: {
                        'app-version': version,
                        revision     : revision,
                        lastRestart: new Date().toISOString() // Indice exists so we update the lastRestarted date only
                    }
                } 
            });

            return data;

        } catch (error) {
            return Promise.reject(error);
        }
    }

    /**
     * Get .wazuh-version index
     */
    async getWazuhVersionIndexAsSearch() {
        try {
            
            const data = await this.elasticRequest.callWithInternalUser('search', {
                index: '.wazuh-version',
                type :  'wazuh-version'
            })

            return data;

        } catch (error) {
            return Promise.reject(error);
        }
    }

    /**
     * 
     * @param {*} payload 
     */
    async searchWazuhAlertsWithPayload(payload) {
        try {

            if(!payload) return Promise.reject(new Error('No valid payload given'));

            const data = await this.elasticRequest.callWithInternalUser('search', {
                index: 'wazuh-alerts-3.x-*',
                type:  'wazuh',
                body:  payload
            });

            return data;

        } catch (error) {
            return Promise.reject(error);
        }
    };

    /**
     * Search for the Wazuh API configuration document using its own id (usually it's a timestamp)
     * @param {*} id Eg: 12396176723
     */
    async getWazuhConfigurationById(id){
        try {

            if(!id) return Promise.reject(new Error('No valid document id given'));

            const data = await this.elasticRequest.callWithInternalUser('get', {
                index: '.wazuh',
                type : 'wazuh-configuration',
                id   : id
            });

            return {
                user        : data._source.api_user,
                password    : Buffer.from(data._source.api_password, 'base64').toString("ascii"),
                url         : data._source.url,
                port        : data._source.api_port,
                insecure    : data._source.insecure,
                cluster_info: data._source.cluster_info,
                extensions  : data._source.extensions
            };

        } catch (error){
            return { error: 'no elasticsearch', error_code: 2 };
        }        
    }

    /**
     * Get the Wazuh API entries stored on .wazuh index
     */
    async getWazuhAPIEntries() {
        try {

            const data = await this.elasticRequest.callWithInternalUser('search', {
                index: '.wazuh',
                type : 'wazuh-configuration',
                size : '100'
            });
                
            return data;
 
        } catch(error){
            return Promise.reject(error);
        }
    };

    /**
     * Usually used to save a new Wazuh API entry
     * @param {*} doc 
     * @param {*} req
     */
    async createWazuhIndexDocument(req,doc) {
        try {
            if(!doc) return Promise.reject(new Error('No valid document given'))

            const data = await this.elasticRequest.callWithRequest(req,'create', {
                index  : '.wazuh',
                type   : 'wazuh-configuration',
                id     : new Date().getTime(),
                body   : doc,
                refresh: true
            });

            return data;

        } catch (error) {
            return Promise.reject(error);
        }
    }

    /**
     * Updates the a document from the .wazuh index using id and doc content
     * @param {*} id 
     * @param {*} doc 
     */
    async updateWazuhIndexDocument(id,doc){
        try {
            if(!id || !doc) return Promise.reject(new Error('No valid parameters given'))

            const data = await this.elasticRequest.callWithInternalUser('update', {
                index: '.wazuh',
                type : 'wazuh-configuration',
                id   : id,
                body : doc
            });

            return data;

        } catch (error) {
            return Promise.reject(error);
        }
    }

    /**
     * Search for active entries on .wazuh index
     * @param {*} req 
     */
    async searchActiveDocumentsWazuhIndex(req){
        try {
            if(!req) return Promise.reject(new Error('No valid request given'))

            const data = await this.elasticRequest.callWithRequest(req,'search', {
                index: '.wazuh',
                type : 'wazuh-configuration',
                q    : 'active:true'
            });

            return data;

        } catch (error) {
            return Promise.reject(error);   
        }
    }

    /**
     * Delete a Wazuh API entry using incoming request
     * @param {*} req 
     */
    async deleteWazuhAPIEntriesWithRequest(req) {
        try {
            if(!req.params || !req.params.id) return Promise.reject(new Error('No API id given'))

            const data = await this.elasticRequest.callWithRequest(req,'delete', {
                index: '.wazuh',
                type : 'wazuh-configuration',
                id   : req.params.id
            });
                
            return data;
 
        } catch(error){
            return Promise.reject(error);
        }
    };

    /**
     * Same as curling the templates from Elasticsearch
     */
    async getTemplates() {
        try {

            const data = await this.elasticRequest.callWithInternalUser('cat.templates', {});

            return data;

        } catch (error) {
            return Promise.reject(error);
        }
    }

    /**
     * Same as curling the plugins from Elasticsearch
     */
    async getPlugins() {
        try {

            const data = await this.elasticRequest.callWithInternalUser('cat.plugins', { });
            const usingCredentials = await this.usingCredentials();
 
            return usingCredentials ? data : false;

        } catch (error) {
            return Promise.reject(error);
        }
    }

    async usingCredentials() {
        try {
            const response = await needle('get', `${this.elasticRequest._config.url}/_xpack`, {}, {
                username: this.elasticRequest._config.username,
                password:  this.elasticRequest._config.password
            })


            return response && 
                   response.body && 
                   response.body.features && 
                   response.body.features.security && 
                   response.body.features.security.enabled;

        } catch (error) {
            return Promise.reject(error);
        }
    }

    /**
     * Used to delete all visualizations with the given description
     * @param {*} description 
     */
    async deleteVisualizationByDescription(description,retroactive) {
        try {
            if(!description) return Promise.reject(new Error('No description given'))

            const data = await this.elasticRequest.callWithInternalUser('deleteByQuery', {
                index: this.WZ_KIBANA_INDEX,
                body: 
                    retroactive ? 
                    {
                        query: { range: { 'visualization.description': { lte: description } } },
                        size : 9999
                    } :
                    {
                        query: { bool: { must: { match: { 'visualization.description': description } } } },
                        size : 9999
                    }
            });

            return data; 
            
        } catch (error) {
            return Promise.reject(error);
        }
    }

    /**
     * Used to get all visualizations with the given description
     * @param {*} description 
     */
    async getVisualizationByDescription(description) {
        try {
            if(!description) return Promise.reject(new Error('No description given'))

            const data = await this.elasticRequest.callWithInternalUser('search', {
                index: this.WZ_KIBANA_INDEX,
                body: {
                    query: { bool: { must: { match: { 'visualization.description': description } } } },
                    size : 9999
                }
            });

            return data; 
            
        } catch (error) {
            return Promise.reject(error);
        }
    }

    /**
     * Make a bulk request to update the Kibana index
     * @param {*} bulk 
     */
    async pushBulkToKibanaIndex(bulk) {
        try {
            if(!bulk) return Promise.reject(new Error('No bulk given'))

            const data = await this.elasticRequest.callWithInternalUser('bulk', { index: this.WZ_KIBANA_INDEX, body: bulk });

            return data;
        } catch (error) {
            return Promise.reject(error);
        }
    }

    /**
     * Make a bulk request to update any index
     * @param {*} bulk 
     */
    async pushBulkAnyIndex(index,bulk) {
        try {
            if(!bulk || !index) return Promise.reject(new Error('No valid parameters given given'))

            const data = await this.elasticRequest.callWithInternalUser('bulk', {
                index: index,
                type:  'agent',
                body:  bulk
            })

            return data;
    
        } catch (error) {
            return Promise.reject(error);
        }
    }

    /**
     * Useful to search elements with "wazuh" as type giving an index as parameter
     * @param {*} req 
     * @param {*} index 
     */
    async searchWazuhElementsByIndexWithRequest(req, index) {
        try {
            if(!req || !index) return Promise.reject(new Error('No valid parameters given'))

            const data = await this.elasticRequest.callWithRequest(req,'search', {
                index: index,
                type : 'wazuh'
            });
            
            return data;

        } catch (error) {
            return Promise.reject(error);
        }
    }

    /**
     * Check if an index exists
     * @param {*} index 
     */
    async checkIfIndexExists(index) {
        try {
            if(!index) return Promise.reject(new Error('No valid index given'))

            const data = await this.elasticRequest.callWithInternalUser('indices.exists', { index: index });

            return data;

        } catch (error) {
            return Promise.reject(error);
        }
    }

    /**
     * Get a template by name
     * @param {*} name 
     */
    async getTemplateByName(name) {
        try {
           if(!name) return Promise.reject(new Error('No valid name given'))

           const data = await this.elasticRequest.callWithInternalUser('indices.getTemplate', { name: name });
           
           return data;

        } catch (error) {
            return Promise.reject(error);
        }
    }

    /**
     * Creates the Kibana index with minimum content
     */
    async createEmptyKibanaIndex(){
        try {
            const data = await this.elasticRequest.callWithInternalUser('indices.create', { index: this.WZ_KIBANA_INDEX })
            
            return data;
 
         } catch (error) {
             return Promise.reject(error);
         }
    }

    async createIndexByName(name) {
        try {
            if(!name) return Promise.reject(new Error('No valid name given'));
            
            const data = await this.elasticRequest.callWithInternalUser('indices.create', { index: name });

            return data;

        } catch (error) {
            return Promise.reject(error);
        }
    }
    
    /**
     * Deletes an Elasticsearch index by its name
     * @param {} name 
     */
    async deleteIndexByName(name) {
        try {
            if(!name) return Promise.reject(new Error('No valid name given'))

            const data = await this.elasticRequest.callWithInternalUser('indices.delete', { index: name })
            
            return data;

        } catch (error) {
            return Promise.reject(error);
        }
    }

    /**
     * Deletes wazuh monitoring index pattern
     */
    async deleteMonitoring(){
        try {
            const data = await this.elasticRequest.callWithInternalUser('delete', { 
                index: this.WZ_KIBANA_INDEX, 
                type: 'doc',
                id: 'index-pattern:wazuh-monitoring-*' 
            });

            return data;

        } catch (error) {
            return Promise.reject(error);
        }
    }

    /**
     * Get an index pattern by name and/or id
     * @param {*} id Could be id and/or title
     */
    async getIndexPatternUsingGet(id){
        try {
            if(!id) return Promise.reject(new Error('No valid id given'))

            const data = await this.elasticRequest.callWithInternalUser('get', {
                index: this.WZ_KIBANA_INDEX,
                type:  'doc',
                id: id.includes('index-pattern:') ? id : 'index-pattern:' + id
            });

            return data;

        } catch (error) {
            return Promise.reject(error);
        }
    }

    /**
     * Inserts the wazuh-agent template
     * @param {*} template 
     */
    async putMonitoringTemplate(template) {
        try {
            if(!template) return Promise.reject(new Error('No valid template given'))

            const data = await this.elasticRequest.callWithInternalUser('indices.putTemplate', {
                name  : 'wazuh-agent',
                body  : template
            });

            return data;

        } catch (error) {
            return Promise.reject(error);
        }
    }

    /**
     * Inserts the wazuh-kibana template.
     * Reindex purposes.
     * Do not use
     * @param {*} template 
     */
    async putWazuhKibanaTemplate(template) {
        try {
            if(!template) return Promise.reject(new Error('No valid template given'))

            const data = await this.elasticRequest.callWithInternalUser('indices.putTemplate',{
                name  : 'wazuh-kibana',
                order : 0,
                create: true,
                body  : template
            });

            return data;

        } catch (error) {
            return Promise.reject(error);
        }
    }


    /**
     * Check for the wazuh-setup index, only old installations.
     * Reindex purposes
     * Do not use
     */
    async getOldWazuhSetup(){
        try {
            
            const data = await this.elasticRequest.callWithInternalUser('get', {
                index: ".wazuh",
                type: "wazuh-setup",
                id: "1"
            });

            return data;

        } catch (error) {
            return Promise.reject(error);
        }
    }
    
    /**
     * Reindex purposes
     * Do not use
     * @param {*} configuration 
     */
    async reindexWithCustomConfiguration(configuration){
        try {
            if(!configuration) return Promise.reject(new Error('No valid configuration given'))

            const data = await this.elasticRequest.callWithInternalUser('reindex', { body: configuration })

            return data;

        } catch (error) {
            return Promise.reject(error);
        }
    }


}

module.exports = ElasticWrapper;