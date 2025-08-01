import { HttpClient } from '../http-client';
import { ClusterSettingsRepository } from '../cluster/cluster-settings-repository';
import { ModelGroupRepository } from '../model-group/model-group-repository';
import { ConnectorRepository } from '../connector/connector-repository';
import { ModelRepository } from '../model/model-repository';
import { AgentHttpClientRepository } from '../agent/agent-repository';

// Factory function to create real repositories with HttpClient
export function createRealRepositories() {
  const httpClient = new HttpClient();

  return {
    httpClient,
    clusterSettingsRepository: new ClusterSettingsRepository(httpClient),
    modelGroupRepository: new ModelGroupRepository(httpClient),
    connectorRepository: new ConnectorRepository(httpClient),
    modelRepository: new ModelRepository(httpClient),
    agentRepository: new AgentHttpClientRepository(httpClient),
  };
}
