import { IRouter } from '../../../../src/core/server';

export function defineRoutes(router: IRouter) {
  router.get(
    {
      path: '/api/wazuh-ruleset/example',
      validate: false,
    },
    async (context, request, response) =>
      response.ok({
        body: {
          time: new Date().toISOString(),
        },
      }),
  );
}
