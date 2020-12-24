
import { IRouter } from 'kibana/server';
import { WazuhApiCtrl } from '../controllers/wazuh-api';
import { schema } from '@kbn/config-schema';

export function WazuhApiRoutes(router: IRouter) {
  const ctrl = new WazuhApiCtrl();

  // Returns if the wazuh-api configuration is working
  router.post({
    path: '/api/check-stored-api',
    validate: {
      body: schema.object({
        id: schema.string(),
        idChanged: schema.nullable(schema.any())
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
      body: schema.object({
        id: schema.string(),
        url: schema.string(),
        port: schema.number(),
        username: schema.string(),
        forceRefresh: schema.boolean({defaultValue:false}),
        cluster_info: schema.object({
          status: schema.string(),
          manager: schema.string(),
          node: schema.string(),
          cluster: schema.string()
        }),
        run_as: schema.nullable(schema.boolean()),
        extensions: schema.any(),
        allow_run_as: schema.number()
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

  //#region TODO: Remove these end point if not used 
  // Return a PCI requirement description
  router.get({
    path: '/api/pci/{requirement}',
    validate: {
      params: schema.object({
        requirement: schema.string(),
      })
    }
  },
    async (context, request, response) => ctrl.getPciRequirement(context, request, response)
  );

  // Return a GDPR requirement description
  router.get({
    path: '/api/gdpr/{requirement}',
    validate: {
      params: schema.object({
        requirement: schema.string()
      })
    }
  },
    async (context, request, response) => ctrl.getGdprRequirement(context, request, response)
  );

  // Return a NIST 800-53 requirement description
  router.get({
    path: '/api/nist/{requirement}',
    validate: {
      params: schema.object({
        requirement: schema.string()
      })
    }
  },
    async (context, request, response) => ctrl.getNistRequirement(context, request, response)
  );

  // Return a TSC requirement description
  router.get({
    path: '/api/tsc/{requirement}',
    validate: {
      params: schema.object({
        requirement: schema.string()
      })
    }
  },
    async (context, request, response) => ctrl.getTSCRequirement(context, request, response)
  );

  // Return a HIPAA requirement description
  router.get({
    path: '/api/hipaa/{requirement}',
    validate: {
      params: schema.object({
        requirement: schema.string()
      })
    }
  },
    async (context, request, response) => ctrl.getHipaaRequirement(context, request, response)
  );

  // Force fetch data to be inserted on wazuh-monitoring indices
  router.get({ // FIXME: Fix this endpoint if is used
    path: '/api/monitoring',
    validate: false,
  },
    async (context, request, response) => ctrl.fetchAgents(context, request, response)
  );

  // Returns unique fields from the agents such OS, agent version ...
  router.get({ // TODO: Remove this endpoint if not used
    path: '/api/agents-unique/{api}',
    validate: {
      params: schema.object({
        api: schema.string()
      })
    }
  },
    async (context, request, response) => ctrl.getAgentsFieldsUniqueCount(context, request, response)
  );

  //#endregion 
}
