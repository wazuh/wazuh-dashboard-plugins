import { PERMISSIONS_FORBIDDEN_TOKEN } from '../constants/config';

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
  isPermissionsForbidden(res: any): boolean {
    return typeof res === 'string' && res.includes(PERMISSIONS_FORBIDDEN_TOKEN);
  }

  normalize(res: string | Record<string, any>): NormalizedResponse {
    const response = res || {};
    let status: number | undefined;
    let statusText: string | undefined;
    if (typeof response === 'object') {
      status = response.status;
      statusText = response.statusText;
    }
    const body =
      typeof response === 'object' && 'data' in response
        ? response.data
        : response;
    const hasPayloadError = !!body?.error;
    const ok =
      !hasPayloadError &&
      typeof status === 'number' &&
      status >= 200 &&
      status < 300;

    return { body, status, statusText, ok };
  }
}
