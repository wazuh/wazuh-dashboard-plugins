import { IRouter } from 'opensearch-dashboards/server';
import { schema } from '@osd/config-schema';
import { routes } from '../../../common/constants';
import type { CtiRegistrationPermissionApiBody } from '../../../common/cti-registration-permission-api';
import { checkCtiRegistrationPermission } from '../../services/cti-registration/registration-permission';

/**
 * Read-only probe the browser calls before offering a registration action: `register`
 * (default) before the registration modal starts, `clear` before the Subscription card
 * offers to clear the local registration.
 */
export const getCtiRegistrationPermissionRoute = (router: IRouter) => {
  router.get(
    {
      path: routes.ctiRegistrationPermission,
      validate: {
        query: schema.object({
          action: schema.oneOf(
            [schema.literal('register'), schema.literal('clear')],
            { defaultValue: 'register' },
          ),
        }),
      },
    },
    async (context, request, response) => {
      // `checkCtiRegistrationPermission` resolves even when the probe fails, so the
      // browser always gets an answer it can render.
      const body = await checkCtiRegistrationPermission(
        context.core.opensearch.client,
        request.query.action,
      );

      return response.ok<CtiRegistrationPermissionApiBody>({ body });
    },
  );
};
