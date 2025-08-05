import { IAgentRepository } from './modules/agent/application/ports/agent-repository';
import { createAgentUseCase } from './modules/agent/application/use-cases/create-agent';
import { registerAgentUseCase } from './modules/agent/application/use-cases/register-agent';
import { AgentHttpClientRepository } from './modules/agent/infrastructure/agent-repository';
import { HttpWithProxyClient } from './modules/common/http/infrastructure/http-with-proxy-client';
import { IConnectorRepository } from './modules/connector/application/ports/connector-repository';
import { createConnectorUseCase } from './modules/connector/application/use-cases/create-connector';
import { ConnectorHttpClientRepository } from './modules/connector/infrastructure/repositories/connector-repository';
import { MLCommonsSettingsRepository } from './modules/ml-commons-settings/application/ports/ml-commons-settings-repository';
import { persistMLCommonsSettingsUseCase } from './modules/ml-commons-settings/application/use-cases/update-ml-commons-settings';
import { MLCommonsSettingsHttpClientRepository } from './modules/ml-commons-settings/infrastructure/repositories/ml-commons-settings-http-client-repository';
import { IModelGroupRepository } from './modules/model-group/application/ports/model-group-repository';
import { ModelGroupHttpClientRepository } from './modules/model-group/infrastructure/repositories/model-group-http-client-repository';
import { ModelRepository } from './modules/model/application/ports/model-repository';
import { createModelUseCase } from './modules/model/application/use-cases/create-model';
import { deleteModelUseCase } from './modules/model/application/use-cases/delete-model';
import { getModelsUseCase } from './modules/model/application/use-cases/get-models';
import { testModelConnectionUseCase } from './modules/model/application/use-cases/test-model-connection';
import { ModelIndexerRepository } from './modules/model/infrastructure/indexer-request/repositories/model-repository';

export const httpClient = new HttpWithProxyClient();

// Factory function to create real repositories with HttpClient
export class Repositories {
  static mlCommonsSettingsRepository: MLCommonsSettingsRepository =
    new MLCommonsSettingsHttpClientRepository(httpClient);
  static modelGroupRepository: IModelGroupRepository =
    new ModelGroupHttpClientRepository(httpClient);
  static connectorRepository: IConnectorRepository =
    new ConnectorHttpClientRepository(httpClient);
  static modelRepository: ModelRepository = new ModelIndexerRepository(
    httpClient,
  );
  static agentRepository: IAgentRepository = new AgentHttpClientRepository(
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
}
