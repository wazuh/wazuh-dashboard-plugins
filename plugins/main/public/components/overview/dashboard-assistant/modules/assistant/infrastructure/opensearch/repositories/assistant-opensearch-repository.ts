import { IHttpClient } from '../../../../common/http/domain/entities/http-client';
import { AssistantRepository } from '../../../application/ports/assistant-repository';

export class AssistantOpenSearchRepository implements AssistantRepository {
  constructor(private readonly httpClient: IHttpClient) {}

  public async getConfig(): Promise<any> {
    const response = await this.httpClient.proxyRequest.post.WithGet('/.plugins-ml-config/_doc/os_chat');
    return response;
  }
}