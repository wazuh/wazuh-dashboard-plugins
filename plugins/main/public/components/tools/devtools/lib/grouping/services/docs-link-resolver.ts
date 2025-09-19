import type { EditorLike } from '../../types/editor';
import type {
  DevToolsModel,
  EndpointDef,
  MethodDef,
} from '../../hints/dictionary/types';
import { REQUEST_LINE_REGEX } from '../../constants/regex';

/**
 * Resolves the API documentation URL for a given request line using the editor model.
 */
export function resolveDocsUrl(
  editor: EditorLike,
  requestText: string,
): string | null {
  if (!editor || !requestText) return null;

  const match = requestText.match(REQUEST_LINE_REGEX) || [];
  const [, inputHttpMethod, inputPath] = match as unknown as [
    string,
    string,
    string,
    ...unknown[],
  ];
  if (!inputHttpMethod || !inputPath) return null;

  const inputEndpoint = inputPath
    .split('/')
    .filter(Boolean)
    .map(s => s.toLowerCase());

  const methods = (editor.model || []) as unknown as DevToolsModel;
  const methodDef = methods.find(
    (it: MethodDef) => it.method === inputHttpMethod,
  );
  const inputHttpMethodEndpoints: EndpointDef[] = methodDef?.endpoints || [];

  const candidate = inputHttpMethodEndpoints
    .map((endpoint: EndpointDef) => ({
      ...endpoint,
      splitURL: String(endpoint.name || '')
        .split('/')
        .filter(Boolean),
    }))
    .filter(endpoint => endpoint.splitURL!.length === inputEndpoint.length)
    .find(endpoint =>
      endpoint.splitURL!.reduce(
        (accum: boolean, str: string, index: number) =>
          accum &&
          (str.startsWith(':')
            ? true
            : str.toLowerCase() === inputEndpoint[index]),
        true,
      ),
    );

  return candidate && candidate.documentation ? candidate.documentation : null;
}
