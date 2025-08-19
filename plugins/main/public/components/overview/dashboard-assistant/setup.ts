import { InstallationProgress } from './modules/installation-manager/domain';
import { AgentRepository } from './modules/agent/application/ports/agent-repository';
import { createAgentUseCase } from './modules/agent/application/use-cases/create-agent';
import { registerAgentUseCase } from './modules/agent/application/use-cases/register-agent';
import { useAgentByModelIdUseCase } from './modules/agent/application/use-cases/use-agent-by-model-id';
import { AgentOpenSearchRepository } from './modules/agent/infrastructure/opensearch/repositories/agent-opensearch-repository';
import { HttpWithProxyClient } from './modules/common/http/infrastructure/http-with-proxy-client';
import { ConnectorRepository } from './modules/connector/application/ports/connector-repository';
import { createConnectorUseCase } from './modules/connector/application/use-cases/create-connector';
import { ConnectorOpenSearchRepository } from './modules/connector/infrastructure/opensearch/repositories/connector-opensearch-repository';
import { installDashboardAssistantUseCase } from './modules/installation-manager/application/use-cases';
import { InstallationManager } from './modules/installation-manager/infrastructure/installation-manager';
import { MLCommonsSettingsRepository } from './modules/ml-commons-settings/application/ports/ml-commons-settings-repository';
import { persistMLCommonsSettingsUseCase } from './modules/ml-commons-settings/application/use-cases/update-ml-commons-settings';
import { MLCommonsSettingsHttpClientRepository } from './modules/ml-commons-settings/infrastructure/repositories/ml-commons-settings-http-client-repository';
import { ModelGroupRepository } from './modules/model-group/application/ports/model-group-repository';
import { ModelGroupOpenSearchRepository } from './modules/model-group/infrastructure/opensearch/repositories/model-group-opensearch-repository';
import { ModelRepository } from './modules/model/application/ports/model-repository';
import { createModelUseCase } from './modules/model/application/use-cases/create-model';
import { deleteModelWithRelatedEntitiesUseCase } from './modules/model/application/use-cases/delete-model-with-related-entities';
import { deleteModelUseCase } from './modules/model/application/use-cases/delete-model';
import { getModelsUseCase } from './modules/model/application/use-cases/get-models';
import { getModelsComposedUseCase } from './modules/model/application/use-cases/get-models-composed';
import { testModelConnectionUseCase } from './modules/model/application/use-cases/test-model-connection';
import { ModelOpenSearchRepository } from './modules/model/infrastructure/opensearch/repositories/model-opensearch-repository';
import { getRegisterAgentCommandUseCase } from './modules/agent/application/use-cases/get-register-agent-command';
import { getRegisterAgentCommandByModelIdUseCase } from './modules/agent/application/use-cases/get-register-agent-command-by-model-id';
import { AssistantRepository } from './modules/assistant/application/ports/assistant-repository';
import { getConfigUseCase } from './modules/assistant/application/use-cases/get-config';
import { AssistantOpenSearchRepository } from './modules/assistant/infrastructure/opensearch/repositories/assistant-opensearch-repository';

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
  static assistantRepository: AssistantRepository =
    new AssistantOpenSearchRepository(httpClient);
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
  static getRegisterAgentCommand = getRegisterAgentCommandUseCase(
    Repositories.agentRepository,
  );
  static getRegisterAgentCommandByModelId =
    getRegisterAgentCommandByModelIdUseCase(Repositories.agentRepository);
  static getModels = getModelsUseCase(Repositories.modelRepository);
  static getModelsComposed = getModelsComposedUseCase(
    Repositories.modelRepository,
    Repositories.agentRepository,
    Repositories.assistantRepository,
  );
  static deleteModel = deleteModelUseCase(Repositories.modelRepository);
  static deleteModelWithRelatedEntities = deleteModelWithRelatedEntitiesUseCase(
    Repositories.modelRepository,
    Repositories.connectorRepository,
    Repositories.modelGroupRepository,
    Repositories.agentRepository,
  );
  static testModelConnection = testModelConnectionUseCase(
    Repositories.modelRepository,
  );
  static useAgentByModelId = useAgentByModelIdUseCase(
    Repositories.agentRepository,
  );
  static getConfig = getConfigUseCase(Repositories.assistantRepository);
  static installDashboardAssistant = (
    callback: (progress: InstallationProgress) => void,
  ) =>
    installDashboardAssistantUseCase(
      new InstallationManager(progressUpdate => {
        callback(progressUpdate);
      }),
    );
}
