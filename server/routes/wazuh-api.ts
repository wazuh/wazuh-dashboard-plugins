import { IRouter } from 'kibana/server';

export function WazuhApiRoutes(router: IRouter) {

  // EXAMPLE
  router.get(
    {
      path: '/api/wazuh/example',
      validate: false
    },
    async (context, request, response) => {
      return response.ok({
        body: "Example request"
      })
    }
  )
}