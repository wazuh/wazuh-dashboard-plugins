import { HttpWithProxyClient } from './common/http/infrastructure/http-with-proxy-client';
import { MLCommonsSettingsHttpClientRepository } from './common/ml-commons-settings/infrastructure/repositories/ml-commons-settings-http-client-repository';
import { ModelGroupHttpClientRepository } from './common/model-group/infrastructure/repositories/model-group-http-client-repository';
import { ConnectorHttpClientRepository } from './common/connector/infrastructure/repositories/connector-repository';
import { ModelHttpClientRepository } from './common/model/infrastructure/repositories/model-repository';
import { AgentHttpClientRepository } from './common/agent/infrastructure/agent-repository';
import { getModelsUseCase } from './common/model/application/use-cases/get-models';
import { createConnectorUseCase } from './common/connector/application/use-cases/create-connector';
import { deleteModelUseCase } from './common/model/application/use-cases/delete-model';
import { testModelConnectionUseCase } from './common/model/application/use-cases/test-model-connection';
import { updateClusterSettingsUseCase } from './common/ml-commons-settings/application/use-cases/update-ml-commons-settings';
import { createModelUseCase } from './common/model/application/use-cases/create-model';
import { createAgentUseCase } from './common/agent/application/use-cases/create-agent';
import { registerAgentUseCase } from './common/agent/application/use-cases/register-agent';

export const httpClient = new HttpWithProxyClient();

// Factory function to create real repositories with HttpClient
export const repositories = {
  clusterSettingsRepository: new MLCommonsSettingsHttpClientRepository(
    httpClient,
  ),
  modelGroupRepository: new ModelGroupHttpClientRepository(httpClient),
  connectorRepository: new ConnectorHttpClientRepository(httpClient),
  modelRepository: new ModelHttpClientRepository(httpClient),
  agentRepository: new AgentHttpClientRepository(httpClient),
};

export function useCases() {
  return {
    updateClusterSettings: updateClusterSettingsUseCase(
      repositories.clusterSettingsRepository,
    ),
    createConnector: createConnectorUseCase(repositories.connectorRepository),
    createModel: createModelUseCase(repositories.modelRepository),
    createAgent: createAgentUseCase(repositories.agentRepository),
    registerAgent: registerAgentUseCase(repositories.agentRepository),
    getModels: getModelsUseCase(repositories.modelRepository),
    deleteModel: deleteModelUseCase(repositories.modelRepository),
    testModelConnection: testModelConnectionUseCase(
      repositories.modelRepository,
    ),
  };
}
