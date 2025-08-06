import { AgentRepository } from './modules/agent/application/ports/agent-repository';
import { createAgentUseCase } from './modules/agent/application/use-cases/create-agent';
import { useAgentByModelIdUseCase } from './modules/agent/application/use-cases/use-agent-by-model-id';
import { registerAgentUseCase } from './modules/agent/application/use-cases/register-agent';
import { AgentOpenSearchRepository } from './modules/agent/infrastructure/opensearch/repositories/agent-repository';
import { HttpWithProxyClient } from './modules/common/http/infrastructure/http-with-proxy-client';
import { ConnectorRepository } from './modules/connector/application/ports/connector-repository';
import { createConnectorUseCase } from './modules/connector/application/use-cases/create-connector';
import { ConnectorOpenSearchRepository } from './modules/connector/infrastructure/opensearch/repositories/connector-opensearch-repository';
import { MLCommonsSettingsRepository } from './modules/ml-commons-settings/application/ports/ml-commons-settings-repository';
import { persistMLCommonsSettingsUseCase } from './modules/ml-commons-settings/application/use-cases/update-ml-commons-settings';
import { MLCommonsSettingsHttpClientRepository } from './modules/ml-commons-settings/infrastructure/repositories/ml-commons-settings-http-client-repository';
import { ModelGroupRepository } from './modules/model-group/application/ports/model-group-repository';
import { ModelGroupOpenSearchRepository } from './modules/model-group/infrastructure/opensearch/repositories/model-group-opensearch-repository';
import { ModelRepository } from './modules/model/application/ports/model-repository';
import { createModelUseCase } from './modules/model/application/use-cases/create-model';
import { deleteModelUseCase } from './modules/model/application/use-cases/delete-model';
import { getModelsUseCase } from './modules/model/application/use-cases/get-models';
import { testModelConnectionUseCase } from './modules/model/application/use-cases/test-model-connection';
import { ModelOpenSearchRepository } from './modules/model/infrastructure/opensearch/repositories/model-opensearch-repository';

export const httpClient = new HttpWithProxyClient();

// Factory function to create real repositories with HttpClient
export class Repositories {
  static mlCommonsSettingsRepository: MLCommonsSettingsRepository =
    new MLCommonsSettingsHttpClientRepository(httpClient);
  static modelGroupRepository: ModelGroupRepository =
    new ModelGroupOpenSearchRepository(httpClient);
  static connectorRepository: ConnectorRepository =
    new ConnectorOpenSearchRepository(httpClient);
  static modelRepository: ModelRepository = new ModelOpenSearchRepository(
    httpClient,
  );
  static agentRepository: AgentRepository = new AgentOpenSearchRepository(
    httpClient,
  );
}

export class UseCases {
  static persistMlCommonsSettings = persistMLCommonsSettingsUseCase(
    Repositories.mlCommonsSettingsRepository,
  );
  static createConnector = createConnectorUseCase(
    Repositories.connectorRepository,
  );
  static createModel = createModelUseCase(Repositories.modelRepository);
  static createAgent = createAgentUseCase(Repositories.agentRepository);
  static registerAgent = registerAgentUseCase(Repositories.agentRepository);
  static getModels = getModelsUseCase(Repositories.modelRepository);
  static deleteModel = deleteModelUseCase(Repositories.modelRepository);
  static testModelConnection = testModelConnectionUseCase(
    Repositories.modelRepository,
  );
  static useAgentByModelId = useAgentByModelIdUseCase(
    Repositories.agentRepository,
  );
}
