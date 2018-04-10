const knownFields = require('../integration-files/known-fields');

class ElasticWrapper{
    constructor(server){
        this.elasticRequest = server.plugins.elasticsearch.getCluster('data');
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
                index: '.kibana',
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
     * This function creates a new index pattern.
     * @param {*} title Eg: 'wazuh-alerts-3.x-*'
     * @param {*} id Optional.
     */
    async createIndexPattern(title,id) {
        try {
            if(!title) return Promise.reject(new Error('No valid title for create index pattern'))

            const data = await this.elasticRequest.callWithInternalUser('create', {
                index: '.kibana',
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
     * Get all the index patterns stored on .kibana index
     */
    async getAllIndexPatterns(){
        try {
            const data = await this.elasticRequest.callWithInternalUser('search', {
                index: '.kibana',
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
     * Updates .kibana index known fields
     * @param {*} patternId 'index-pattern:' + id
     */
    async updateIndexPatternKnownFields(id) {
        try {
            if(!id) return Promise.reject(new Error('No valid index pattern id for update index pattern'));

            const newFields = JSON.stringify(knownFields);

            const data = await this.elasticRequest.callWithInternalUser('update', {
                index: '.kibana',
                type: 'doc',
                id: id,
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
     */
    async createWazuhIndexDocument(doc) {
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

            return data;

        } catch (error) {
            return Promise.reject(error);
        }
    }

    /**
     * Used to delete all visualizations with the given description
     * @param {*} description 
     */
    async deleteVisualizationByDescription(description) {
        try {
            if(!description) return Promise.reject(new Error('No description given'))

            const data = await this.elasticRequest.callWithInternalUser('deleteByQuery', {
                index: '.kibana',
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
     * Make a bulk request to update the .kibana index
     * @param {*} bulk 
     */
    async pushBulkToKibanaIndex(bulk) {
        try {
            if(!bulk) return Promise.reject(new Error('No bulk given'))

            const data = await this.elasticRequest.callWithInternalUser('bulk', { index: '.kibana', body: bulk });

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

            const data = await elasticRequest.callWithRequest(req,'search', {
                index: index,
                type : 'wazuh'
            });

            return data;

        } catch (error) {
            return Promise.reject(error);
        }
    }
}

module.exports = ElasticWrapper;