import type { IHttpClient } from '../domain/types';
import { ClusterSettingsRepository } from '../../cluster/cluster-settings-repository';
import { ModelGroupRepository } from '../../model-group/model-group-repository';
import { ConnectorRepository } from '../../connector/connector-repository';
import { ModelRepository } from '../../model/model-repository';
import { AgentRepository } from '../../agent/agent-repository';

class MockHttpClient implements IHttpClient {
  async get<T = any>(url: string, config?: any): Promise<T> {
    console.log(`Mock GET request to: ${url}`);
    await new Promise(resolve => setTimeout(resolve, 500));
    return {} as T;
  }

  async post<T = any>(url: string, data?: any, config?: any): Promise<T> {
    console.log(`Mock POST request to: ${url}`, data);
    await new Promise(resolve => setTimeout(resolve, 800));

    // Mock responses based on URL patterns
    if (url.includes('_cluster/settings')) {
      return { acknowledged: true } as T;
    }
    if (url.includes('_plugins/_ml/model_groups/_register')) {
      return { model_group_id: `group_${Date.now()}` } as T;
    }
    if (url.includes('_plugins/_ml/connectors/_create')) {
      return { connector_id: `connector_${Date.now()}` } as T;
    }
    if (url.includes('_plugins/_ml/models/_register')) {
      return { model_id: `model_${Date.now()}` } as T;
    }
    if (url.includes('_plugins/_ml/agents/_register')) {
      return { agent_id: `agent_${Date.now()}` } as T;
    }

    return {} as T;
  }

  async put<T = any>(url: string, data?: any, config?: any): Promise<T> {
    console.log(`Mock PUT request to: ${url}`, data);
    await new Promise(resolve => setTimeout(resolve, 500));
    return {} as T;
  }

  async delete<T = any>(url: string, config?: any): Promise<T> {
    console.log(`Mock DELETE request to: ${url}`);
    await new Promise(resolve => setTimeout(resolve, 300));
    return {} as T;
  }
}

// Factory function to create mock repositories
export function createMockRepositories() {
  const httpClient = new MockHttpClient();

  return {
    httpClient,
    clusterSettingsRepository: new ClusterSettingsRepository(httpClient),
    modelGroupRepository: new ModelGroupRepository(httpClient),
    connectorRepository: new ConnectorRepository(httpClient),
    modelRepository: new ModelRepository(httpClient),
    agentRepository: new AgentRepository(httpClient),
  };
}
