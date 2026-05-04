import { IRouter } from 'opensearch-dashboards/server';
import { routes } from '../../../common/constants';
import type { CtiRegistrationStatusApiBody } from '../../../common/cti-registration-status-api';
import {
  hasPersistedCtiCredentials,
  resolveCtiOAuthClientId,
} from '../../services/cti-registration';
import { CtiConfigurationError } from '../../services/cti-registration/cti-console-url';
import { CtiRegistrationStore } from '../../services/cti-registration/cti-registration-store';

type StatusWithoutCtiCredentialsFlag = Omit<
  CtiRegistrationStatusApiBody,
  'hasPersistedCtiCredentials'
>;

async function withCtiCredentialsFlag(
  base: StatusWithoutCtiCredentialsFlag,
): Promise<CtiRegistrationStatusApiBody> {
  return {
    ...base,
    hasPersistedCtiCredentials: await hasPersistedCtiCredentials(),
  };
}

export const getCtiRegistrationStatusRoute = (router: IRouter) => {
  router.get(
    {
      path: routes.ctiRegistrationStatus,
      validate: {},
    },
    async (_context, _request, response) => {
      try {
        const environmentUuid = await resolveCtiOAuthClientId(undefined);
        const store = CtiRegistrationStore.getInstance();
        const rec = store.getStatus(environmentUuid);

        if (!rec) {
          return response.ok({
            body: await withCtiCredentialsFlag({
              registrationComplete: false,
              inProgress: false,
            }),
          });
        }

        if (rec.registrationComplete) {
          return response.ok({
            body: await withCtiCredentialsFlag({
              registrationComplete: true,
              inProgress: false,
            }),
          });
        }

        if (Date.now() > rec.deviceAuthExpiresAtMs) {
          store.clear(environmentUuid);
          return response.ok({
            body: await withCtiCredentialsFlag({
              registrationComplete: false,
              inProgress: false,
            }),
          });
        }

        const expires_in_remaining_sec = Math.max(
          0,
          Math.floor((rec.deviceAuthExpiresAtMs - Date.now()) / 1000),
        );

        return response.ok({
          body: await withCtiCredentialsFlag({
            registrationComplete: false,
            inProgress: true,
            device_code: rec.device_code ?? undefined,
            user_code: rec.user_code,
            verification_uri: rec.verification_uri,
            verification_uri_complete: rec.verification_uri_complete,
            poll_interval_sec: rec.poll_interval_sec,
            expires_in_remaining_sec,
          }),
        });
      } catch (error) {
        const finalError =
          error instanceof Error
            ? error
            : typeof error === 'string'
            ? new Error(error)
            : new Error('Error reading CTI registration status');

        const statusCode =
          error instanceof CtiConfigurationError
            ? 500
            : (error as { statusCode?: number })?.statusCode ?? 503;

        return response.customError({
          statusCode,
          body: finalError,
        });
      }
    },
  );
};
