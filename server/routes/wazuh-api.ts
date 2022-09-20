
import { IRouter } from 'kibana/server';
import { WazuhApiCtrl } from '../controllers';
import { schema } from '@kbn/config-schema';

export function WazuhApiRoutes(router: IRouter) {
  const ctrl = new WazuhApiCtrl();

  // Returns if the wazuh-api configuration is working
  router.post({
    path: '/api/check-stored-api',
    validate: {
      body: schema.object({
        id: schema.string(),
        idChanged: schema.maybe(schema.string())
      })
    }
  },
    async (context, request, response) => ctrl.checkStoredAPI(context, request, response)
  );

  // Check if credentials on POST connect to Wazuh API. Not storing them!
  // Returns if the wazuh-api configuration received in the POST body will work
  router.post({
    path: '/api/check-api',
    validate: {
      body: schema.any({ // TODO: not ready
        //id: schema.string(),
        // url: schema.string(),
        // port: schema.number(),
        // username: schema.string(),
        //forceRefresh: schema.boolean({defaultValue:false}),
        // cluster_info: schema.object({
        //   status: schema.string(),
        //   manager: schema.string(),
        //   node: schema.string(),
        //   cluster: schema.string()
        // }),
        // run_as: schema.boolean(),
        // extensions: schema.any(),
        // allow_run_as: schema.number()
      })
    }
  },
    async (context, request, response) => ctrl.checkAPI(context, request, response)
  );

  router.post({
    path: '/api/login',
    validate: {
      body: schema.object({
        idHost: schema.string(),
        force: schema.boolean({defaultValue: false}),
      })
    }
  },
    async (context, request, response) => ctrl.getToken(context, request, response)
  );

  // Returns the request result (With error control)
  router.post({
    path: '/api/request',
    validate: {
      body: schema.object({
        id: schema.string(),
        method: schema.string(),
        path: schema.string(),
        body: schema.any(),
      })
    }
  },
    async (context, request, response) => ctrl.requestApi(context, request, response)
  );

  // Returns data from the Wazuh API on CSV readable format
  router.post({
    path: '/api/csv',
    validate: {
      body: schema.object({
        id: schema.string(),
        path: schema.string(),
        filters: schema.maybe(schema.any())
      })
    }
  },
    async (context, request, response) => ctrl.csv(context, request, response)
  );

  // Returns a route list used by the Dev Tools
  router.get({
    path: '/api/routes',
    validate: false
  },
    async (context, request, response) => ctrl.getRequestList(context, request, response)
  );

  // Useful to check cookie consistence
  router.get({
    path: '/api/timestamp',
    validate: false
  },
    async (context, request, response) => ctrl.getTimeStamp(context, request, response)
  );

  router.post({
    path: '/api/extensions',
    validate: {
      body: schema.object({
        id: schema.string(),
        extensions: schema.any()
      })
    }
  },
    async (context, request, response) => ctrl.setExtensions(context, request, response)
  );


  router.get({
    path: '/api/extensions/{id}',
    validate: {
      params: schema.object({
        id: schema.string()
      })
    }
  },
    async (context, request, response) => ctrl.getExtensions(context, request, response)
  );

  // Return Wazuh Appsetup info
  router.get({
    path: '/api/setup',
    validate: false,
  },
    async (context, request, response) => ctrl.getSetupInfo(context, request, response)
  );

  // Return basic information of syscollector for given agent
  router.get({
    path: '/api/syscollector/{agent}',
    validate: {
      params: schema.object({
        agent: schema.string()
      })
    }
  },
    async (context, request, response) => ctrl.getSyscollector(context, request, response)
  );

  // Return logged in user has wazuh disabled by role
  router.get({
    path: '/api/check-wazuh',
    validate: false
  },
    async (context, request, response) => ctrl.isWazuhDisabled(context, request, response)
  );

  // Return app logos configuration
  router.get({
    path: '/api/logos',
    validate: false,
    options: { authRequired: false }
  },
    async (context, request, response) => ctrl.getAppLogos(context, request, response)
  );
}
