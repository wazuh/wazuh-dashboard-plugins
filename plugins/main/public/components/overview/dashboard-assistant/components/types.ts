export interface ModelFormData {
  name: string;
  model: string;
  apiUrl: string;
  apiKey: string;
}

export interface ModelFieldDefinition {
  name: string;
  id: string;
  version: string;
  status: string;
  createdAt: string;
}
