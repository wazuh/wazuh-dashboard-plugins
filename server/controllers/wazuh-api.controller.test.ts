import { authenticate } from '../lib/api-interceptor';

let token: string;
describe('Wazuh Api Controller', () => {
  describe('getToken', () => {
    beforeAll(async () => {
      const MockedBody = {
        force: false,
        idHost: 'default',
      };
      token = await authenticate(MockedBody.idHost);
    });
    /**
     
        responseAxios = {
            config: {},
            data: {
                data: {
                    // here is placed the api response data
                },
                error: 0,
                message: '', // sometimes return message
            },
            headers: {},
            request: {},
            status: 200,
            statusText: 'OK',
        }
     
     */

        /*
          when returns success entries

          affected_items: [{…}]
          failed_items: []
          total_affected_items: 1
          total_failed_items: 0
        */

    it('should return token when credentilas are valid', async () => {
      /*
        checkStoredApi = {
          body: {
            id: 'default',
          }
        }
      */
      
      console.log('token', token);
    });
    // token = await context.wazuh.api.client.asInternalUser.authenticate(idHost);

    //username = 'elastic' getCurrentUser(request, context);

    /*
        
          context.wazuh.server.info
        
        hostname:
        '0.0.0.0'
        name:
        'Maximilianos-MacBook-Pro.local'
        port:
        5601
        protocol:
        'http'
        
        
        response ok - con cookie headers and body: { token: '' }
          */
  });
});
