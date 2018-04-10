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
}

module.exports = ElasticWrapper;