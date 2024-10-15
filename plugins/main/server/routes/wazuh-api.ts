import { IRouter } from 'opensearch_dashboards/server';
import { WazuhApiCtrl } from '../controllers';
import { schema } from '@osd/config-schema';

export function WazuhApiRoutes(router: IRouter) {
  const ctrl = new WazuhApiCtrl();

  // Returns if the wazuh-api configuration is working
  router.post(
    {
      path: '/api/check-stored-api',
      validate: {
        body: schema.object({
          id: schema.string(),
          idChanged: schema.maybe(schema.string()),
        }),
      },
    },
    ctrl.checkStoredAPI,
  );

  // Check if credentials on POST connect to Wazuh API. Not storing them!
  // Returns if the wazuh-api configuration received in the POST body will work
  router.post(
    {
      path: '/api/check-api',
      validate: {
        body: schema.any({
          // TODO: not ready
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
          // allow_run_as: schema.number()
        }),
      },
    },
    ctrl.checkAPI,
  );

  router.post(
    {
      path: '/api/login',
      validate: {
        body: schema.object({
          idHost: schema.string(),
          force: schema.boolean({ defaultValue: false }),
        }),
      },
    },
    ctrl.getToken,
  );

  // Returns the request result (With error control)
  router.post(
    {
      path: '/api/request',
      validate: {
        body: schema.object({
          id: schema.string(),
          method: schema.string(),
          path: schema.string(),
          body: schema.any(),
        }),
      },
    },
    ctrl.requestApi,
  );

  // Returns data from the Wazuh API on CSV readable format
  router.post(
    {
      path: '/api/csv',
      validate: {
        body: schema.object({
          id: schema.string(),
          path: schema.string(),
          filters: schema.maybe(schema.any()),
        }),
      },
    },
    ctrl.csv,
  );

  // Returns a route list used by the Dev Tools
  router.get(
    {
      path: '/api/routes',
      validate: false,
    },
    ctrl.getRequestList,
  );

  // Return Wazuh Appsetup info
  router.get(
    {
      path: '/api/setup',
      validate: false,
    },
    ctrl.getSetupInfo,
  );

  // Return basic information of syscollector for given agent
  router.get(
    {
      path: '/api/syscollector/{agent}',
      validate: {
        params: schema.object({
          agent: schema.string(),
        }),
      },
    },
    ctrl.getSyscollector,
  );

  // Return app logos configuration
  router.get(
    {
      path: '/api/logos',
      validate: false,
      options: { authRequired: false },
    },
    ctrl.getAppLogos,
  );
}
