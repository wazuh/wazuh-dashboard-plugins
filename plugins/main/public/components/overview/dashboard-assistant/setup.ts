import { createAgentUseCase } from './modules/agent/application/use-cases/create-agent';
import { registerAgentUseCase } from './modules/agent/application/use-cases/register-agent';
import { AgentHttpClientRepository } from './modules/agent/infrastructure/agent-repository';
import { HttpWithProxyClient } from './modules/common/http/infrastructure/http-with-proxy-client';
import { createConnectorUseCase } from './modules/connector/application/use-cases/create-connector';
import { ConnectorHttpClientRepository } from './modules/connector/infrastructure/repositories/connector-repository';
import { updateClusterSettingsUseCase } from './modules/ml-commons-settings/application/use-cases/update-ml-commons-settings';
import { MLCommonsSettingsHttpClientRepository } from './modules/ml-commons-settings/infrastructure/repositories/ml-commons-settings-http-client-repository';
import { ModelGroupHttpClientRepository } from './modules/model-group/infrastructure/repositories/model-group-http-client-repository';
import { createModelUseCase } from './modules/model/application/use-cases/create-model';
import { deleteModelUseCase } from './modules/model/application/use-cases/delete-model';
import { getModelsUseCase } from './modules/model/application/use-cases/get-models';
import { testModelConnectionUseCase } from './modules/model/application/use-cases/test-model-connection';
import { ModelHttpClientRepository } from './modules/model/infrastructure/repositories/model-repository';

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
