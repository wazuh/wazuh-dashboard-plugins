import type { EditorLike } from '../../types/editor';
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
  const [, inputHttpMethod, inputPath]: [any, string, string] = match as any;
  if (!inputHttpMethod || !inputPath) return null;

  const inputEndpoint = inputPath
    .split('/')
    .filter(Boolean)
    .map(s => s.toLowerCase());

  const inputHttpMethodEndpoints =
    (
      (editor.model || []).find((it: any) => it.method === inputHttpMethod) ||
      {}
    ).endpoints || [];

  const candidate = inputHttpMethodEndpoints
    .map((endpoint: any) => ({
      ...endpoint,
      splitURL: String(endpoint.name || '')
        .split('/')
        .filter(Boolean),
    }))
    .filter(
      (endpoint: any) => endpoint.splitURL.length === inputEndpoint.length,
    )
    .find((endpoint: any) =>
      endpoint.splitURL.reduce(
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
