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
    models: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-4'],
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
      'claude-opus-4-1',
      'claude-opus-4-0',
      'claude-sonnet-4-0',
      'claude-3-7-sonnet-latest',
      'claude-3-5-sonnet-latest',
      'claude-3-5-haiku-latest',
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
