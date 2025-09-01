import type { EditorLike } from '../../types/editor';

export interface EndpointParamSchema {
  type?: string;
}

export interface QueryParamDef {
  name: string;
  schema?: EndpointParamSchema;
}

export interface BodyParamDef {
  name: string;
  type: 'string' | 'array' | 'object' | string;
  properties?: Record<string, BodyParamDef>;
}

export interface EndpointDef {
  name: string;
  query?: QueryParamDef[];
  body?: BodyParamDef[];
  // Optional fields present in /api/routes and used by other parts
  documentation?: string;
  description?: string;
  summary?: string;
  tags?: string[];
  args?: any[];
  // Internal helper during matching
  splitURL?: string[];
}

export interface MethodDef {
  method: string;
  endpoints: EndpointDef[];
}

export type DevToolsModel = MethodDef[];

export interface EditorWithModel extends EditorLike {
  model?: DevToolsModel;
}

export interface HintItem {
  text: string;
  displayText?: string;
  render?: (elt: HTMLElement, data: any, cur: any) => void;
  hint?: (cm: any, self: any, data: any) => void;
  _moveCursor?: boolean;
  bodyParam?: BodyParamDef;
}
