import { IModelRepository, ModelPredictResponse } from './domain/types';
import { Model } from './domain/model';
import { IHttpClient } from '../installation-manager/domain/types';
import { validateModelPredictResponse } from './validate-model-predict';
import { TEST_PROMPT } from '../../components/model-test-result';


const getProxyPath = (path:string, method:string) => `/api/console/proxy?path=${path}&method=${method}&dataSourceId=`

export class ModelRepository implements IModelRepository {
  constructor(private readonly httpClient: IHttpClient) {}

  public async create(model: Model): Promise<string> {
    const response = (await this.httpClient.post(
      getProxyPath('/_plugins/_ml/models/_register', 'POST'),
      model.toApiPayload(),
    )) as { model_id: string };
    return response.model_id;
  }

  public async findById(id: string): Promise<Model | null> {
    try {
      const response = await this.httpClient.get(getProxyPath(`/_plugins/_ml/models/${id}`, 'GET'));
      return Model.fromResponse(response);
    } catch (error: any) {
      if (error.status === 404) return null;
      throw error;
    }
  }

  public async getAll(): Promise<Model[]> {
    try {
      const searchPayload = {
        query: {
          match_all: {}
        },
        size: 1000
      };

      /* ToDo: Change to call ml-commons-dashboards endpoints create on server */
      const response = await this.httpClient.post(getProxyPath('/_plugins/_ml/models/_search', 'POST'), searchPayload) as {
        hits: {
          hits: Array<{
            _source: any;
          }>;
        };
      };

      const models = response.hits.hits.map(hit => Model.fromResponse(hit));
      return models;
    } catch (error) {
      console.error('Error fetching models:', error);
      return [];
    }
  }

  public async update(id: string, model: Model): Promise<void> {
    await this.httpClient.put(
      getProxyPath(`/_plugins/_ml/models/${id}`, 'PUT'),
      model.toApiPayload(),
    );
  }

  public async delete(id: string): Promise<void> {
    await this.httpClient.post(getProxyPath(`/_plugins/_ml/models/${id}`, 'DELETE'));
  }

  public async testConnection(modelId: string): Promise<ModelPredictResponse> {
    try {
      const response = await this.httpClient.post(
        getProxyPath(`/_plugins/_ml/models/${modelId}/_predict`, 'POST'),
        {
          parameters: {
            messages: [
              { role: 'assistant', content: 'You are a helpful assistant.' },
              { role: 'user', content: TEST_PROMPT },
            ],
          }
        }
      ) as ModelPredictResponse;

      // Validar que la respuesta tenga la estructura esperada usando la función de validación
      validateModelPredictResponse(response);

      return response;
    } catch (error) {
      console.error('Error testing model connection:', error);
      throw error;
    }
  }

  public async deploy(modelId: string, deploy: boolean): Promise<void> {
    await this.httpClient.put(
      getProxyPath(`/_plugins/_ml/models/${modelId}`, 'PUT'),
      { deploy }
    );
  }

  public async undeploy(modelId: string): Promise<void> {
    await this.httpClient.post(
      getProxyPath(`/_plugins/_ml/models/${modelId}/_undeploy`, 'POST'),
      {}
    );
  }
}
