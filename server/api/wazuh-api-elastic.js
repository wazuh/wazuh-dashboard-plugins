module.exports = (server, options) => {
    const userRegEx  = new RegExp(/^.{3,100}$/);
    const passRegEx  = new RegExp(/^.{3,100}$/); 
    const urlRegEx   = new RegExp(/^https?:\/\/[a-zA-Z0-9]{1,300}$/); 
    const urlRegExIP = new RegExp(/^https?:\/\/[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}$/); 
    const portRegEx  = new RegExp(/^[0-9]{2,5}$/); 

    // Elastic JS Client
    const elasticRequest = server.plugins.elasticsearch.getCluster('data');

    // Handlers

    const getAPIEntries = async (req, reply) => {
        try {
            const data = await elasticRequest.callWithInternalUser('search', {
                index: '.wazuh',
                type : 'wazuh-configuration',
                size : '100'
            });
                
            return reply(data.hits.hits);
 
        } catch(error){
            return reply(error);
        }
    };

    const deleteAPIEntries = async (req, reply) => {
        try {
            const data = await elasticRequest.callWithRequest(req,'delete', {
                index: '.wazuh',
                type : 'wazuh-configuration',
                id   : req.params.id
            });
                
            return reply(data);
 
        } catch(error){
            return reply(error);
        }
    };

    const setAPIEntryDefault = async (req, reply) => {
        try{

            // Searching for previous default
            const data = await elasticRequest.callWithRequest(req,'search', {
                index: '.wazuh',
                type : 'wazuh-configuration',
                q    : 'active:true'
            });
    
            if (data.hits.total === 1) {
                // Setting off previous default
                await elasticRequest.callWithInternalUser('update', {
                    index: '.wazuh',
                    type : 'wazuh-configuration',
                    id   : data.hits.hits[0]._id,
                    body : { doc: { active: 'false' } }
                });
            } 

            // Set new default
            await elasticRequest.callWithInternalUser('update', {
                index: '.wazuh',
                type : 'wazuh-configuration',
                id   : req.params.id,
                body : { doc: { active: 'true' } }
            });

            return reply({ statusCode: 200, message:    'ok' });

        }catch(error){
            return reply({
                statusCode: 500,
                error     : 8,
                message   : `Could not save data in elasticsearch due to ${error.message || error}`
            }).code(500);
        }
    };

    const getExtensions = async (req, reply) => {
        try{
            const data = await elasticRequest.callWithInternalUser('search', {
                index: '.wazuh',
                type :  'wazuh-configuration'
            });
            return reply(data.hits.hits);
        } catch(error){
            return reply(error);
        }
    };

    const toggleExtension = async (req, reply) => {
        try {
            // Toggle extenion state
            let extension = {};
            extension[req.params.extensionName] = (req.params.extensionValue === 'true');

            await elasticRequest.callWithInternalUser('update', {
                index: '.wazuh',
                type : 'wazuh-configuration',
                id   : req.params.id,
                body : { doc: { extensions: extension } }
            })

            return reply({ statusCode: 200, message: 'ok' });

        } catch (error){
            return reply({
                statusCode: 500,
                error     : 8,
                message   : `Could not save data in elasticsearch due to ${error.message || error}` 
            }).code(500);
        }
    };

    const validateData = payload => {
        // Validate user
        if(!userRegEx.test(payload.user)){
            return reply({ statusCode: 400, error: 10001, message: 'Invalid user field' }).code(400);
        }

        // Validate password
        if(!passRegEx.test(payload.password)){
            return reply({ statusCode: 400, error: 10002, message: 'Invalid password field' }).code(400);
        }

        // Validate url
        if(!urlRegEx.test(payload.url) && !urlRegExIP.test(payload.url)){
            return reply({ statusCode: 400, error: 10003, message: 'Invalid url field' }).code(400);
        }

        // Validate port
        const validatePort = parseInt(payload.port);
        if(!portRegEx.test(payload.port) || validatePort <= 0 || validatePort >= 99999) {
            return reply({ statusCode: 400, error: 10004, message: 'Invalid port field' }).code(400);
        }

        return false;
    }

    const buildSettingsObject = payload => {
        return {
            api_user    : payload.user,
            api_password: payload.password,
            url         : payload.url,
            api_port    : payload.port,
            insecure    : payload.insecure,
            component   : 'API',
            active      : payload.active,
            cluster_info: payload.cluster_info,
            extensions  : payload.extensions
        }
    }

    const saveAPI = async (req, reply) => {
        try {
            if (!('user' in req.payload) || !('password' in req.payload) || !('url' in req.payload) || !('port' in req.payload)) {
                return reply({
                    statusCode: 400,
                    error     : 7,
                    message   : 'Missing data'
                }).code(400);
            }
    
            const valid = validateData(req.payload);
            if(valid) return reply(valid).code(400);
    
            const settings = buildSettingsObject(req.payload);
    
            const response = await elasticRequest.callWithRequest(req,'create', {
                index  : '.wazuh',
                type   : 'wazuh-configuration',
                id     : new Date().getTime(),
                body   : settings,
                refresh: true
            });

            return reply({ statusCode: 200, message: 'ok', response });
   
        } catch (error){
            return reply({
                statusCode: 500,
                error     : 8,
                message   : `Could not save data in elasticsearch due to ${error.message || error}`
            }).code(500);
        }
    };

    const updateAPIHostname = async (req, reply) => {
        try {
            await elasticRequest.callWithInternalUser('update', {
                index: '.wazuh',
                type : 'wazuh-configuration',
                id   : req.params.id,
                body : { doc: { cluster_info: req.payload.cluster_info } }
            });

            return reply({ statusCode: 200, message: 'ok' });
        
        } catch (error) {
            return reply({
                statusCode: 500,
                error     : 8,
                message   : `Could not save data in elasticsearch due to ${error.message || error}`
            }).code(500);
        }
    };

    const updateFullAPI = async (req, reply) => {
        try {
            if (!('user' in req.payload) || !('password' in req.payload) || !('url' in req.payload) || !('port' in req.payload)) {
                return reply({
                    statusCode: 400,
                    error     : 7,
                    message   : 'Missing data'
                }).code(400);
            }
    
            const valid = validateData(req.payload);
            if(valid) return reply(valid).code(400);
    
            const settings = buildSettingsObject(req.payload);
    
            await elasticRequest.callWithInternalUser('update', {
                index: '.wazuh',
                type : 'wazuh-configuration',
                id   : req.payload.id,
                body : { doc: settings }
            });

            return reply({ statusCode: 200, message: 'ok' });

        } catch (error) {
            return reply({
                statusCode: 500,
                error     : 8,
                message   : `Could not save data in elasticsearch due to ${error.message || error}`
            }).code(500);
        }
    };


    //Server routes

    /*
     * PUT /api/wazuh-api/settings
     * Save the given API into elasticsearch
     *
     **/
    server.route({
        method:  'PUT',
        path:    '/api/wazuh-api/settings',
        handler: saveAPI
    });

    /*
     * PUT /api/wazuh-api/settings
     * Update the given API into elasticsearch
     *
     **/
    server.route({
        method:  'PUT',
        path:    '/api/wazuh-api/update-settings',
        handler: updateFullAPI
    });

    /*
     * GET /api/wazuh-api/apiEntries
     * Get Wazuh-API entries list (Multimanager) from elasticsearch index
     *
     **/
    server.route({
        method:  'GET',
        path:    '/api/wazuh-api/apiEntries',
        handler: getAPIEntries
    });

    /*
     * DELETE /api/wazuh-api/settings
     * Delete Wazuh-API entry (multimanager) from elasticsearch index
     *
     **/
    server.route({
        method:  'DELETE',
        path:    '/api/wazuh-api/apiEntries/{id}',
        handler: deleteAPIEntries
    });

    /*
     * PUT /api/wazuh-api/settings
     * Set Wazuh-API as default (multimanager) on elasticsearch index
     *
     **/
    server.route({
        method:  'PUT',
        path:    '/api/wazuh-api/apiEntries/{id}',
        handler: setAPIEntryDefault
    });


    /*
     * PUT /api/wazuh-api/extension/toggle/documentId/extensionName/trueorfalse
     * Toggle extension state: Enable / Disable
     *
     **/
    server.route({
        method:  'PUT',
        path:    '/api/wazuh-api/extension/toggle/{id}/{extensionName}/{extensionValue}',
        handler: toggleExtension
    });

    /*
     * GET /api/wazuh-api/extension
     * Return extension state list
     *
     **/
    server.route({
        method:  'GET',
        path:    '/api/wazuh-api/extension',
        handler: getExtensions
    });

    /*
     * PUT /api/wazuh-api/updateApiHostname/apiId
     * Update the API hostname
     *
     **/
    server.route({
        method:  'PUT',
        path:    '/api/wazuh-api/updateApiHostname/{id}',
        handler: updateAPIHostname
    });

};