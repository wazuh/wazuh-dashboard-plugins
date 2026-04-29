import {
  CTI_OAUTH_DEVICE_GRANT_TYPE,
  CTI_REGISTRATION_COMPLETED_BODY,
  routes,
  statusCodes,
} from '../../common/constants';
import type { CtiRegistrationStatusApiBody } from '../../common/cti-registration-status-api';
import { ctiFlowState } from './cti-flow-state';
import { getCore } from '../plugin-services';

function formatOAuthErrorMessage(
  error: string,
  errorDescription: string | undefined,
): string {
  if (errorDescription && errorDescription.length > 0) {
    return `${error}: ${errorDescription}`;
  }
  return error;
}

export async function hydrateCtiFlowFromServer(): Promise<void> {
  const body = await getCore().http.get<CtiRegistrationStatusApiBody>(
    routes.ctiRegistrationStatus,
  );

  if (body.registrationComplete) {
    ctiFlowState.setRegistrationComplete(true);
    return;
  }

  if (body.inProgress && body.device_code) {
    ctiFlowState.setRegistrationComplete(false);
    ctiFlowState.setDeviceCode(body.device_code);
    if (typeof body.poll_interval_sec === 'number') {
      ctiFlowState.setPollIntervalSec(body.poll_interval_sec);
    }
    if (
      typeof body.expires_in_remaining_sec === 'number' &&
      body.expires_in_remaining_sec > 0
    ) {
      ctiFlowState.setDeviceAuthExpiry(body.expires_in_remaining_sec);
    }
    return;
  }

  if (ctiFlowState.getDeviceCode() || ctiFlowState.isRegistrationComplete()) {
    ctiFlowState.reset();
  }
}

export async function fetchCtiRegistrationStatus(options?: {
  skipHydrate?: boolean;
}): Promise<{
  statusCode: number;
  message: string;
}> {
  if (!options?.skipHydrate) {
    await hydrateCtiFlowFromServer();
  }

  try {
    if (ctiFlowState.isRegistrationComplete()) {
      return { statusCode: statusCodes.SUCCESS, message: '' };
    }

    const deviceCode = ctiFlowState.getDeviceCode();
    if (!deviceCode) {
      return { statusCode: statusCodes.NOT_FOUND, message: '' };
    }

    if (ctiFlowState.isDeviceAuthExpired()) {
      ctiFlowState.reset();
      return {
        statusCode: statusCodes.REGISTRATION_FAILED,
        message: 'expired_token',
      };
    }

    const res = (await getCore().http.post<Record<string, unknown>>(
      routes.token,
      {
        body: JSON.stringify({
          grant_type: CTI_OAUTH_DEVICE_GRANT_TYPE,
          device_code: deviceCode,
        }),
      },
    )) as Record<string, unknown>;

    if (
      typeof res === 'object' &&
      res !== null &&
      'success' in res &&
      (res as { success: unknown }).success ===
        CTI_REGISTRATION_COMPLETED_BODY.success
    ) {
      ctiFlowState.setRegistrationComplete(true);
      return { statusCode: statusCodes.SUCCESS, message: '' };
    }

    if (typeof res.error === 'string') {
      const err = res.error;
      const errDesc =
        typeof res.error_description === 'string'
          ? res.error_description
          : undefined;

      if (err === 'slow_down') {
        ctiFlowState.applySlowDown();
        return {
          statusCode: statusCodes.NOT_FOUND,
          message: formatOAuthErrorMessage(err, errDesc),
        };
      }

      if (err === 'authorization_pending') {
        return {
          statusCode: statusCodes.NOT_FOUND,
          message: formatOAuthErrorMessage(err, errDesc),
        };
      }

      ctiFlowState.reset();
      return {
        statusCode: statusCodes.REGISTRATION_FAILED,
        message: formatOAuthErrorMessage(err, errDesc),
      };
    }

    return { statusCode: statusCodes.NOT_FOUND, message: '' };
  } catch (error: unknown) {
    console.error('Error fetching CTI registration status:', error);
    const e = error as {
      body?: { message?: string; statusCode?: number };
      statusCode?: number;
      message?: string;
    };
    const statusCode =
      e.statusCode ?? e.body?.statusCode ?? statusCodes.NOT_FOUND;
    const message =
      e.message ?? e.body?.message ?? 'Registration status request failed';
    throw { statusCode, message };
  }
}
