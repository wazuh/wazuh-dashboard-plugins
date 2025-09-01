import { ADMIN_MODE_FORBIDDEN_TOKEN } from '../constants/config';

export interface NormalizedResponse {
  body: any;
  status?: number;
  statusText?: string;
  ok: boolean;
}

/**
 * Interprets API responses and extracts consistent metadata.
 */
export class ResponseHandler {
  isAdminModeForbidden(res: any): boolean {
    return typeof res === 'string' && res.includes(ADMIN_MODE_FORBIDDEN_TOKEN);
  }

  normalize(res: any): NormalizedResponse {
    const response = res || {};
    const status: number | undefined = response.status;
    const statusText: string | undefined = response.statusText;
    const body =
      typeof response === 'object' && 'data' in response
        ? response.data
        : response;
    const hasPayloadError = !!(body && (body as any).error);
    const ok =
      !hasPayloadError &&
      typeof status === 'number' &&
      status >= 200 &&
      status < 300;

    return { body, status, statusText, ok };
  }
}
