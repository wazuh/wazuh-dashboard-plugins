export interface ProviderModelConfig {
  model_family: string;
  model_provider: string;
  models: string[];
  response_filter?: string;
  url_path: string;
  headers: Record<string, string>;
  request_body: string;
  extra_parameters?: Record<string, any>;
}

export const modelProviderConfigs: ProviderModelConfig[] = [
  {
    model_family: 'GPT',
    model_provider: 'OpenAI',
    models: [
      'gpt-4o',
      'gpt-4o-mini',
      'gpt-4-turbo',
      'gpt-4',
      'gpt-3.5-turbo',
      'gpt-3.5-turbo-16k',
    ],
    response_filter: '$.choices[0].message.content',
    url_path: '/v1/chat/completions',
    headers: {
      Authorization: 'Bearer ${credential.api_key}',
    },
    request_body:
      '{ "model": "${parameters.model}", "messages": ${parameters.messages} }',
  },
  {
    model_family: 'Claude',
    model_provider: 'Anthropic',
    models: [
      'claude-3-5-sonnet-20241022',
      'claude-3-5-haiku-20241022',
      'claude-3-opus-20240229',
      'claude-3-sonnet-20240229',
      'claude-3-haiku-20240307',
      'claude-2.1',
      'claude-2.0',
      'claude-instant-1.2',
    ],
    response_filter: '$.content[0].text',
    url_path: '/v1/messages',
    headers: {
      'x-api-key': '${credential.api_key}',
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    extra_parameters: {
      max_tokens: 1024,
    },
    request_body:
      '{ "model": "${parameters.model}", "max_tokens": ${parameters.max_tokens}, "messages": ${parameters.messages} }',
  },
];
