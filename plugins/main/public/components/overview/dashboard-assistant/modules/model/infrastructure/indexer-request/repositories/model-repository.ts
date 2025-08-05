import { ModelPredictResponse } from '../../../domain/types';
import { Model } from '../../../domain/entities/model';
import { validateModelPredictResponse } from '../../../validate-model-predict';
import { TEST_PROMPT } from '../../../../../components/model-test-result';
import { ModelRepository } from '../../../application/ports/model-repository';
import { CreateModelDto } from '../../../application/dtos/create-model-dto';
import { ModelFactory } from '../../../application/factories/model-factory';
import { IHttpClient } from '../../../../common/http/domain/entities/http-client';
import { ModelIndexerResponse } from '../dtos/model-indexer-response';
import { ModelIndexerMapper } from '../mappers/model-indexer-mapper';

export class ModelIndexerRepository implements ModelRepository {
  constructor(private readonly httpClient: IHttpClient) {}

  public async create(createModelDto: CreateModelDto): Promise<Model> {
    const response = await this.httpClient.proxyRequest.post<{
      model_id: string;
    }>('/_plugins/_ml/models/_register', createModelDto);
    return ModelFactory.create({
      ...createModelDto,
      id: response.model_id,
    });
  }

  public async getAll(): Promise<Model[]> {
    try {
      const searchPayload = {
        query: {
          match_all: {},
        },
        size: 1000,
      };

      /* ToDo: Change to call ml-commons-dashboards endpoints create on server */
      const response = await this.httpClient.proxyRequest.post<{
        hits: {
          hits: Array<{
            _id: string;
            _source: ModelIndexerResponse;
          }>;
        };
      }>('/_plugins/_ml/models/_search', searchPayload);

      return response.hits.hits.map(hit =>
        ModelIndexerMapper.toModel({
          ...hit._source,
          id: hit._id,
        }),
      );
    } catch (error) {
      console.error('Error fetching models:', error);
      return [];
    }
  }

  public async delete(id: string): Promise<void> {
    await this.undeploy(id);

    await this.httpClient.proxyRequest.post.WithDelete(
      `/_plugins/_ml/models/${id}`,
    );
  }

  public async testConnection(modelId: string): Promise<ModelPredictResponse> {
    try {
      const response =
        await this.httpClient.proxyRequest.post<ModelPredictResponse>(
          `/_plugins/_ml/models/${modelId}/_predict`,
          {
            parameters: {
              prompt: TEST_PROMPT,
            },
          },
        );

      // Validate that the response has the expected structure using the validation function
      validateModelPredictResponse(response);

      return response;
    } catch (error) {
      console.error('Error testing model connection:', error);
      throw error;
    }
  }

  public async deploy(modelId: string, deploy: boolean): Promise<void> {
    await this.httpClient.proxyRequest.put(`/_plugins/_ml/models/${modelId}`, {
      deploy,
    });
  }

  private async undeploy(modelId: string): Promise<void> {
    await this.httpClient.proxyRequest.post(
      `/_plugins/_ml/models/${modelId}/_undeploy`,
      {},
    );
  }
}
