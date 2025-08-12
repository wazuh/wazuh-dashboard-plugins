// Minimal requirements provided by the UI to derive DTOs within steps (JIT)
export interface InstallAIDashboardAssistantDto {
  selected_provider: string; // key to locate provider config
  model_id: string; // provider's model identifier (e.g., gpt-4o)
  api_url: string; // base URL/endpoint for the connector
  api_key: string; // credential for the provider
  description?: string; // optional human-friendly description
}
