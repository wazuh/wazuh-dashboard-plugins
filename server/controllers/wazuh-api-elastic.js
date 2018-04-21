import { ElasticWrapper } from '../lib/elastic-wrapper';
const userRegEx  = new RegExp(/^.{3,100}$/);
const passRegEx  = new RegExp(/^.{3,100}$/); 
const urlRegEx   = new RegExp(/^https?:\/\/[a-zA-Z0-9]{1,300}$/); 
const urlRegExIP = new RegExp(/^https?:\/\/[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}$/); 
const portRegEx  = new RegExp(/^[0-9]{2,5}$/); 

export class WazuhApiElastic {
    constructor(server) {
        this.wzWrapper = new ElasticWrapper(server);
    }

    async getAPIEntries (req, reply) {
        try {
            const data = await this.wzWrapper.getWazuhAPIEntries();
                
            return reply(data.hits.hits);
 
        } catch(error){
            return reply(error);
        }
    }

    async deleteAPIEntries (req, reply) {
        try {
            const data = await this.wzWrapper.deleteWazuhAPIEntriesWithRequest(req);
                
            return reply(data);
 
        } catch(error){
            return reply(error);
        }
    }

    async setAPIEntryDefault (req, reply) {
        try{

            // Searching for previous default
            const data = await this.wzWrapper.searchActiveDocumentsWazuhIndex(req);
    
            if (data.hits.total === 1) {
                await this.wzWrapper.updateWazuhIndexDocument(data.hits.hits[0]._id, { doc: { active: 'false' } });
            } 

            await this.wzWrapper.updateWazuhIndexDocument(req.params.id, { doc: { active: 'true' } });

            return reply({ statusCode: 200, message:    'ok' });

        }catch(error){
            return reply({
                statusCode: 500,
                error     : 8,
                message   : `Could not save data in elasticsearch due to ${error.message || error}`
            }).code(500);
        }
    }

    async getExtensions (req, reply) {
        try{
            const data = await this.wzWrapper.getWazuhAPIEntries();

            return reply(data.hits.hits);
        
        } catch(error){
            return reply(error);
        }
    }

    async toggleExtension (req, reply) {
        try {
            // Toggle extenion state
            let extension = {};
            extension[req.params.extensionName] = (req.params.extensionValue === 'true');

            await this.wzWrapper.updateWazuhIndexDocument(req.params.id, { doc: { extensions: extension }});

            return reply({ statusCode: 200, message: 'ok' });

        } catch (error){
            return reply({
                statusCode: 500,
                error     : 8,
                message   : `Could not save data in elasticsearch due to ${error.message || error}` 
            }).code(500);
        }
    }

    validateData (payload) {
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

    buildSettingsObject (payload) {
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

    async saveAPI (req, reply) {
        try {
            if (!('user' in req.payload) || !('password' in req.payload) || !('url' in req.payload) || !('port' in req.payload)) {
                return reply({
                    statusCode: 400,
                    error     : 7,
                    message   : 'Missing data'
                }).code(400);
            }
    
            const valid = this.validateData(req.payload);
            if(valid) return reply(valid).code(400);
    
            const settings = this.buildSettingsObject(req.payload);
    
            const response = await this.wzWrapper.createWazuhIndexDocument(req,settings);

            return reply({ statusCode: 200, message: 'ok', response });
   
        } catch (error){
            return reply({
                statusCode: 500,
                error     : 8,
                message   : `Could not save data in elasticsearch due to ${error.message || error}`
            }).code(500);
        }
    }

    async updateAPIHostname (req, reply) {
        try {

            await this.wzWrapper.updateWazuhIndexDocument(req.params.id,{ doc: { cluster_info: req.payload.cluster_info }});

            return reply({ statusCode: 200, message: 'ok' });
        
        } catch (error) {
            return reply({
                statusCode: 500,
                error     : 8,
                message   : `Could not save data in elasticsearch due to ${error.message || error}`
            }).code(500);
        }
    }

    async updateFullAPI (req, reply) {
        try {
            if (!('user' in req.payload) || !('password' in req.payload) || !('url' in req.payload) || !('port' in req.payload)) {
                return reply({
                    statusCode: 400,
                    error     : 7,
                    message   : 'Missing data'
                }).code(400);
            }
    
            const valid = this.validateData(req.payload);
            if(valid) return reply(valid).code(400);
    
            const settings = this.buildSettingsObject(req.payload);
    
            await this.wzWrapper.updateWazuhIndexDocument(req.payload.id, { doc: settings });

            return reply({ statusCode: 200, message: 'ok' });

        } catch (error) {
            return reply({
                statusCode: 500,
                error     : 8,
                message   : `Could not save data in elasticsearch due to ${error.message || error}`
            }).code(500);
        }
    }
}