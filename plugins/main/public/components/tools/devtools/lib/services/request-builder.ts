import queryString from 'query-string';
import { HTTP_METHODS, DEFAULT_HTTP_METHOD, HttpMethod } from '../constants/http';
import type { EditorGroup } from '../types/editor';
import type { BuiltRequest } from '../types/http';
import { safeJsonParse, stripReservedFlags } from '../utils/json';
import { RESERVED_QUERY_PARAMS } from '../constants/config';

/**
 * Builds sanitized HTTP requests from editor groups.
 * - Detects method and path
 * - Parses inline/body JSON
 * - Strips reserved flags from body and query
 */
export class RequestBuilder {
  build(group: EditorGroup): BuiltRequest {
    const raw = group.requestText || '';
    const method = this.detectMethod(raw);
    const { path, inlineBody } = this.extractPathAndInlineBody(raw, method);

    // Ensure absolute-like path
    const normalizedPath = path ? (path.startsWith('/') ? path : `/${path}`) : '/';

    // Parse and sanitize query parameters
    const { url, query } = queryString.parseUrl(normalizedPath);
    for (const key of RESERVED_QUERY_PARAMS) delete (query as any)[key];
    const sanitizedPath = queryString.stringifyUrl(
      { url, query },
      { skipEmptyString: true, skipNull: true },
    );

    // Body: inline has priority, fallback to multi-line JSON body
    let body = safeJsonParse((inlineBody as string) || group.requestTextJson, {} as any);
    body = stripReservedFlags(body);
    if (typeof body === 'object') (body as any).devTools = true;

    return {
      method,
      path: sanitizedPath,
      body,
    };
  }

  private detectMethod(raw: string): HttpMethod {
    return (
      HTTP_METHODS.find(m => raw.startsWith(m)) || DEFAULT_HTTP_METHOD
    );
  }

  private extractPathAndInlineBody(
    raw: string,
    method: HttpMethod,
  ): { path: string; inlineBody?: string | false } {
    const withoutMethod = raw.includes(method)
      ? raw.split(method)[1].trim()
      : raw.trim();

    // Inline body handling: e.g. POST /path { ... }
    if (withoutMethod.includes('{') && withoutMethod.includes('}')) {
      const inlineBody = `{${withoutMethod.split('{')[1]}`;
      const path = withoutMethod.split('{')[0].trim();
      return { path, inlineBody };
    }
    return { path: withoutMethod };
  }
}

