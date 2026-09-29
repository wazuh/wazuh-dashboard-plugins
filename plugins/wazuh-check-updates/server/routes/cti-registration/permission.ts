import { IRouter } from 'opensearch-dashboards/server';
import { routes } from '../../../common/constants';
import type { CtiRegistrationPermissionApiBody } from '../../../common/cti-registration-permission-api';
import { checkCtiRegistrationPermission } from '../../services/cti-registration/registration-permission';

/**
 * Read-only probe the registration modal calls before offering to register, so a user
 * without the indexer privilege gets a warning instead of a flow that fails at the end.
 */
export const getCtiRegistrationPermissionRoute = (router: IRouter) => {
  router.get(
    {
      path: routes.ctiRegistrationPermission,
      validate: {},
    },
    async (context, _request, response) => {
      // `checkCtiRegistrationPermission` resolves even when the probe fails, so the
      // modal always gets an answer it can render.
      const body = await checkCtiRegistrationPermission(
        context.core.opensearch.client,
      );

      return response.ok<CtiRegistrationPermissionApiBody>({ body });
    },
  );
};
