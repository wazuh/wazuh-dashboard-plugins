export interface ModelConfig {
  name: string;
  versions: string[];
  response_filter?: string;
  url_path?: string;
  headers?: Record<string, string>;
  request_body?: string;
  extra_parameters?: Record<string, any>;
}

export const modelConfig: ModelConfig[] = [
  {
    name: 'OpenAI GPT',
    versions: [
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
      Authorization: 'Bearer ${parameters.apiKey}',
    },
    request_body:
      '{ "model": "${parameters.model}", "messages": ${parameters.messages} }',
  },
  {
    name: 'Anthropic Claude',
    versions: [
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
      'x-api-key': '${credential.apiKey}',
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    extra_parameters: {
      max_tokens: 1024,
    },
    request_body:
      '{ "model": "${parameters.model}", "max_tokens": ${parameters.max_tokens}, "messages": ${parameters.messages} }',
  },
  {
    name: 'Google Gemini',
    versions: [
      'gemini-1.5-pro',
      'gemini-1.5-flash',
      'gemini-1.0-pro',
      'gemini-1.0-pro-vision',
    ],
  },
  {
    name: 'Amazon Bedrock - Titan',
    versions: [
      'amazon.titan-text-express-v1',
      'amazon.titan-text-lite-v1',
      'amazon.titan-embed-text-v1',
      'amazon.titan-embed-text-v2',
    ],
  },
  {
    name: 'Amazon Bedrock - Claude',
    versions: [
      'anthropic.claude-3-5-sonnet-20241022-v2:0',
      'anthropic.claude-3-5-haiku-20241022-v1:0',
      'anthropic.claude-3-opus-20240229-v1:0',
      'anthropic.claude-3-sonnet-20240229-v1:0',
    ],
  },
  {
    name: 'Amazon Bedrock - Llama',
    versions: [
      'meta.llama3-2-90b-instruct-v1:0',
      'meta.llama3-2-11b-instruct-v1:0',
      'meta.llama3-2-3b-instruct-v1:0',
      'meta.llama3-2-1b-instruct-v1:0',
    ],
  },
  {
    name: 'Microsoft Azure OpenAI',
    versions: [
      'gpt-4o',
      'gpt-4o-mini',
      'gpt-4-turbo',
      'gpt-4',
      'gpt-3.5-turbo',
      'gpt-3.5-turbo-16k',
    ],
  },
  {
    name: 'Cohere',
    versions: [
      'command-r-plus',
      'command-r',
      'command',
      'command-nightly',
      'command-light',
      'command-light-nightly',
    ],
  },
  {
    name: 'Mistral AI',
    versions: [
      'mistral-large-latest',
      'mistral-medium-latest',
      'mistral-small-latest',
      'open-mistral-7b',
      'open-mixtral-8x7b',
      'open-mixtral-8x22b',
    ],
  },
  {
    name: 'Deepseek',
    versions: ['deepseek-chat', 'deepseek-coder', 'deepseek-math'],
  },
  {
    name: 'Hugging Face',
    versions: [
      'microsoft/DialoGPT-large',
      'facebook/blenderbot-400M-distill',
      'microsoft/DialoGPT-medium',
      'facebook/blenderbot-1B-distill',
    ],
  },
  {
    name: 'Ollama',
    versions: [
      'llama3.2:latest',
      'llama3.1:latest',
      'llama3:latest',
      'mistral:latest',
      'codellama:latest',
      'phi3:latest',
    ],
  },
];
