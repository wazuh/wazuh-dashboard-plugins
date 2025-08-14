import { ModelPredictResponse } from '../../../domain/types';
import { Model } from '../../../domain/entities/model';
import { ModelPredictValidator } from '../../../model-predict-validator';
import { TEST_PROMPT } from '../../../../../components/model-test-result';
import { ModelRepository } from '../../../application/ports/model-repository';
import { CreateModelDto } from '../../../application/dtos/create-model-dto';
import { ModelOpenSearchCreateFactory } from '../factories/model-opensearch-create-factory';
import { IHttpClient } from '../../../../common/http/domain/entities/http-client';
import { ModelOpenSearchResponseDto } from '../dtos/model-opensearch-response-dto';
import { ModelOpenSearchMapper } from '../mappers/model-opensearch-mapper';
import { ModelOpenSearchResponseCreateDto } from '../dtos/model-opensearch-response-create-dto';
import { OpenSearchResponseDto } from '../../../../common/infrastructure/opensearch/dtos/opensearch-response-dto';

export class ModelOpenSearchRepository implements ModelRepository {
  constructor(private readonly httpClient: IHttpClient) {}

  public async create(createModelDto: CreateModelDto): Promise<Model> {
    const modelOpenSearchRequestCreateDto =
      ModelOpenSearchCreateFactory.create(createModelDto);
    const response =
      await this.httpClient.proxyRequest.post<ModelOpenSearchResponseCreateDto>(
        '/_plugins/_ml/models/_register',
        modelOpenSearchRequestCreateDto,
      );
    return ModelOpenSearchMapper.fromRequest(
      response.model_id,
      modelOpenSearchRequestCreateDto,
    );
  }

  public async findById(id: string): Promise<Model | null> {
    try {
      const response = await this.httpClient.proxyRequest.post<
        OpenSearchResponseDto<ModelOpenSearchResponseDto>
      >(`/_plugins/_ml/models/_search`, {
        query: {
          term: {
            _id: {
              value: id,
            },
          },
        },
        size: 1,
      });

      const hits = response.hits.hits;
      if (hits.length === 0) {
        return null;
      }

      return ModelOpenSearchMapper.fromResponse(id, hits[0]._source);
    } catch (error) {
      console.error('Error fetching model by ID:', error);
      return null;
    }
  }

  public async getAll(): Promise<Model[]> {
    try {
      const searchPayload = {
        query: {
          match_all: {},
        },
        size: 25,
      };

      /* ToDo: Change to call ml-commons-dashboards endpoints create on server */
      const response = await this.httpClient.proxyRequest.post<
        OpenSearchResponseDto<ModelOpenSearchResponseDto>
      >('/_plugins/_ml/models/_search', searchPayload);

      return response.hits.hits.map(hit =>
        ModelOpenSearchMapper.fromResponse(hit._id, hit._source),
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
      ModelPredictValidator.validate(response);

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
