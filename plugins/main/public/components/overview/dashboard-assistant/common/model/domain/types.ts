import { Repository } from '../../domain/repository';
import { Model } from './model';

export interface IModelRepository extends Repository<Model> {
  testConnection(modelId: string): Promise<ModelPredictResponse>;
  deploy(modelId: string, deploy: boolean): Promise<void>;
  undeploy(modelId: string): Promise<void>;
}

export interface CreateModelRequest {
  name: string;
  functionName: string;
  modelGroupId?: string; // is optional
  connectorId: string;
  description: string;
}

export interface TestModelConnectionRequest {
  modelId: string;
}

// Tipos para la respuesta del modelo
export interface ModelPredictChoice {
  finish_reason: string;
  index: number;
  message: {
    role: string;
    content: string;
  };
}

export interface ModelPredictUsage {
  completion_tokens?: number;
  prompt_tokens?: number;
  total_tokens?: number;
  // Claude-specific fields
  input_tokens?: number;
  output_tokens?: number;
  cache_creation_input_tokens?: number;
  cache_read_input_tokens?: number;
  service_tier?: string;
}

export interface ModelPredictContent {
  type: string;
  text: string;
}

export interface ModelPredictDataAsMap {
  id: string;
  // OpenAI-style format
  choices?: ModelPredictChoice[];
  created?: number;
  object?: string;
  // Claude-style format
  type?: string;
  role?: string;
  content?: ModelPredictContent[];
  stop_reason?: string;
  stop_sequence?: string | null;
  // Common fields
  model: string;
  usage: ModelPredictUsage;
}

export interface ModelPredictOutput {
  name: string;
  dataAsMap: ModelPredictDataAsMap;
}

export interface ModelPredictInferenceResult {
  output: ModelPredictOutput[];
  status_code: number;
}

export interface ModelPredictResponse {
  inference_results: ModelPredictInferenceResult[];
}
