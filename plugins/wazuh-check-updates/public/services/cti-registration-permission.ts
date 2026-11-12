import { routes } from '../../common/constants';
import type {
  CtiRegistrationPermissionAction,
  CtiRegistrationPermissionApiBody,
} from '../../common/cti-registration-permission-api';
import { getCore } from '../plugin-services';

/**
 * Fail-open answer. The indexer enforces the privilege when registration is applied,
 * so a probe we could not read must never hide the Register action.
 */
const PERMISSION_NOT_EVALUATED: CtiRegistrationPermissionApiBody = {
  accessAllowed: true,
  missingPrivileges: [],
};

/**
 * Fail-closed answer for `clear`: clearing the local registration is only offered to
 * users the indexer confirms.
 */
const CLEAR_PERMISSION_NOT_EVALUATED: CtiRegistrationPermissionApiBody = {
  accessAllowed: false,
  missingPrivileges: [],
};

/**
 * Asks the server whether the current user may start CTI registration (`register`) or
 * clear the local registration (`clear`).
 *
 * Never rejects: a failure resolves to "allowed" for `register`, so the caller only has
 * to handle an explicit denial, and to "denied" for `clear`.
 */
export async function fetchCtiRegistrationPermission(
  action: CtiRegistrationPermissionAction = 'register',
): Promise<CtiRegistrationPermissionApiBody> {
  const notEvaluated =
    action === 'clear'
      ? CLEAR_PERMISSION_NOT_EVALUATED
      : PERMISSION_NOT_EVALUATED;
  try {
    const body = await getCore().http.get<CtiRegistrationPermissionApiBody>(
      routes.ctiRegistrationPermission,
      action === 'register' ? undefined : { query: { action } },
    );

    if (typeof body?.accessAllowed !== 'boolean') {
      return notEvaluated;
    }

    return {
      accessAllowed: body.accessAllowed,
      missingPrivileges: Array.isArray(body.missingPrivileges)
        ? body.missingPrivileges.filter(
            (privilege): privilege is string => typeof privilege === 'string',
          )
        : [],
    };
  } catch {
    return notEvaluated;
  }
}
