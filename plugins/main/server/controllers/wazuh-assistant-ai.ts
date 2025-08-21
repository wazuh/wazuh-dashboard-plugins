import axios from 'axios';
import { WazuhCorePluginStart } from '../../../wazuh-core/server';
import {
  OpenSearchDashboardsRequest,
  RequestHandlerContext,
  OpenSearchDashboardsResponseFactory,
} from 'src/core/server';
import https from 'https';
import fs from 'fs/promises';
import { first } from 'rxjs/operators';

export class WazuhAssistantCtrl {
  async getRegisterAgentCommand(
    context: RequestHandlerContext & { wazuh_core: WazuhCorePluginStart },
    request: OpenSearchDashboardsRequest<{ agentId: string }>,
    response: OpenSearchDashboardsResponseFactory,
  ) {
    const certsDir = '/etc/wazuh-indexer/certs';
    const indexerUrl =
      context.core.opensearch.opensearchStart.client.config.hosts[0];
    const data = {
      type: 'os_chat_root_agent',
      configuration: {
        agent_id: request.params.agentId,
      },
    };
    const certs = {
      cacert: `root-ca.pem`,
      cert: `admin.pem`,
      key: `admin-key.pem`,
    };

    return response.ok({
      body: {
        command: `INDEXER_URL="${indexerUrl}"; \\
DIR="${certsDir}"; \\
CACERT="$DIR/${certs.cacert}"; \\
CERT="$DIR/${certs.cert}"; \\
KEY="$DIR/${certs.key}"; \\
curl --cacert $CACERT --cert $CERT --key $KEY \\
-X PUT $INDEXER_URL/.plugins-ml-config/_doc/os_chat \\
-H 'Content-Type: application/json' \\
-d '${JSON.stringify(data)}'`,
      },
    });
  }

  async registerAgent(
    context: RequestHandlerContext & { wazuh_core: WazuhCorePluginStart },
    request: OpenSearchDashboardsRequest<{ agentId: string }>,
    response: OpenSearchDashboardsResponseFactory,
  ) {
    const config = await context.core.opensearch.opensearchStart.legacy.config$
      .pipe(first())
      .toPromise();

    const { server_admin_certificate, server_admin_certificate_key } =
      await context.wazuh_core.configuration.get(
        'server_admin_certificate',
        'server_admin_certificate_key',
      );

    const httpsAgent = new https.Agent({
      ca: config.ssl.certificateAuthorities[0],
      cert: await fs.readFile(server_admin_certificate),
      key: await fs.readFile(server_admin_certificate_key),
      rejectUnauthorized: true, // You can optionally set it to false for testing
    });

    // Prepare the data to be sent
    const data = {
      type: 'os_chat_root_agent',
      configuration: {
        agent_id: request.params.agentId,
      },
    };

    await axios.put(
      `${context.core.opensearch.opensearchStart.client.config.hosts[0]}/.plugins-ml-config/_doc/os_chat`,
      data,
      {
        httpsAgent, // Use the HTTPS agent with the certificates
        headers: {
          'Content-Type': 'application/json',
        },
      },
    );

    return response.ok({ body: { success: true } });
  }
}
