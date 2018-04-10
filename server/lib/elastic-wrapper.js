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
            const data = await this.elasticRequest
                                .callWithInternalUser('search', {
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
}

module.exports = ElasticWrapper;