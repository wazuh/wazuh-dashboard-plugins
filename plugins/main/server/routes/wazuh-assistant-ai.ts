import { WazuhCorePluginStart } from '../../../wazuh-core/server';
import { IRouter } from 'opensearch_dashboards/server';
import { schema } from '@osd/config-schema';
import { WazuhAssistantCtrl } from '../controllers/wazuh-assistant-ai';

export function WazuhAssistantRoutes(
  router: IRouter,
  services: WazuhCorePluginStart,
) {
  const ctrl = new WazuhAssistantCtrl();

  // Returns if the wazuh-api configuration is working
  router.post(
    {
      path: '/assistant/agent/register/{agentId}',
      validate: {
        params: schema.object({
          agentId: schema.string(),
        }),
      },
    },
    async (context, request, response) =>
      ctrl.registerAgent(context, request, response),
  );
}
