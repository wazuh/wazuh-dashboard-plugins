import { REQUEST_LINE_REGEX } from '../../../constants/regex';
import type { DevToolsModel, EndpointDef, MethodDef } from '../types';

export interface ParsedRequestLine {
  method?: string;
  path?: string;
  queryMark?: string;
  queryString?: string;
}

export function parseRequestLine(text?: string): ParsedRequestLine {
  if (!text) return {};
  const [, inputHttpMethod, inputPath, inputQueryParamsStart, inputQueryParams] =
    (text.match(REQUEST_LINE_REGEX) as RegExpMatchArray | null) || [] as any;
  return {
    method: inputHttpMethod,
    path: inputPath,
    queryMark: inputQueryParamsStart,
    queryString: inputQueryParams,
  };
}

export function splitPathToSegments(path?: string): string[] {
  if (!path) return [];
  return path
    .split('/')
    .filter(Boolean)
    .map((s: string) => s.toLowerCase());
}

export function getMethodEndpoints(model: DevToolsModel | undefined, method?: string): EndpointDef[] {
  if (!model || !method) return [];
  const entry: MethodDef | undefined = model.find((m: MethodDef) => m.method === method);
  return (entry && entry.endpoints) || [];
}

export function findMatchingEndpoint(
  endpoints: EndpointDef[] = [],
  inputSegments: string[] = [],
): EndpointDef | undefined {
  const candidates = endpoints
    .map((endpoint: EndpointDef) => ({
      ...endpoint,
      splitURL: endpoint.name.split('/').filter(Boolean),
    }))
    .filter((e: EndpointDef) => (e.splitURL || []).length === inputSegments.length);

  return candidates.find((e: EndpointDef) =>
    (e.splitURL || []).reduce((acc: boolean, seg: string, idx: number) =>
      acc && (seg.startsWith(':') ? true : seg.toLowerCase() === inputSegments[idx]), true),
  );
}

