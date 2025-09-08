import queryString from 'query-string';
import {
  HTTP_METHODS,
  DEFAULT_HTTP_METHOD,
  HttpMethod,
} from '../constants/http';
import type { EditorGroup } from '../types/editor';
import type { BuiltRequest } from '../types/http';
import { safeJsonParse, stripReservedFlags } from '../utils/json';
import { RESERVED_QUERY_PARAMS } from '../constants/config';
import { NOT_FOUND_INDEX } from '../constants/common';

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
    const normalizedPath = path
      ? path.startsWith('/')
        ? path
        : `/${path}`
      : '/';

    // Parse and sanitize query parameters
    const { url, query } = queryString.parseUrl(normalizedPath);
    for (const key of RESERVED_QUERY_PARAMS) delete query[key];
    const sanitizedPath = queryString.stringifyUrl(
      { url, query },
      { skipEmptyString: true, skipNull: true },
    );

    // Body: inline has priority, fallback to multi-line JSON body
    let body = safeJsonParse<Record<string, boolean>>(
      (inlineBody as string) || group.requestTextJson,
      {},
    );
    body = stripReservedFlags(body);
    if (typeof body === 'object') body.devTools = true;

    return {
      method,
      path: sanitizedPath,
      body,
    };
  }

  private detectMethod(raw: string): HttpMethod {
    return HTTP_METHODS.find(m => raw.startsWith(m)) || DEFAULT_HTTP_METHOD;
  }

  private extractPathAndInlineBody(
    raw: string,
    method: HttpMethod,
  ): { path: string; inlineBody?: string | false } {
    const withoutMethod = raw.includes(method)
      ? raw.split(method)[1].trim()
      : raw.trim();

    // Inline body handling robust to nested braces: e.g. POST /path { ... { ... } }
    const startIdx = withoutMethod.indexOf('{');
    if (startIdx === NOT_FOUND_INDEX) {
      return { path: withoutMethod };
    }
    // Find matching closing brace using a simple brace counter
    let depth = 0;
    let endIdx = NOT_FOUND_INDEX;
    for (let i = startIdx; i < withoutMethod.length; i++) {
      const ch = withoutMethod[i];
      if (ch === '{') depth++;
      else if (ch === '}') {
        depth--;
        if (depth === 0) {
          endIdx = i;
          break;
        }
      }
    }
    // If we couldn't find a matching closing brace, treat as no inline body
    if (endIdx === NOT_FOUND_INDEX) {
      return { path: withoutMethod };
    }

    const path = withoutMethod.slice(0, startIdx).trim();
    const inlineBody = withoutMethod.slice(startIdx, endIdx + 1);
    return { path, inlineBody };
  }
}
