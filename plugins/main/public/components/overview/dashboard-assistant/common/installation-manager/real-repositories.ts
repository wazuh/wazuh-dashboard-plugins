import { HttpWithProxyClient } from '../http-client';
import { ClusterSettingsHttpClientRepository } from '../cluster/cluster-settings-repository';
import { ModelGroupRepository } from '../model-group/model-group-repository';
import { ConnectorRepository } from '../connector/connector-repository';
import { ModelHttpClientRepository } from '../model/model-repository';
import { AgentHttpClientRepository } from '../agent/agent-repository';

// Factory function to create real repositories with HttpClient
export function createRealRepositories() {
  const httpClient = new HttpWithProxyClient();

  return {
    httpClient,
    clusterSettingsRepository: new ClusterSettingsHttpClientRepository(
      httpClient,
    ),
    modelGroupRepository: new ModelGroupRepository(httpClient),
    connectorRepository: new ConnectorRepository(httpClient),
    modelRepository: new ModelHttpClientRepository(httpClient),
    agentRepository: new AgentHttpClientRepository(httpClient),
  };
}
