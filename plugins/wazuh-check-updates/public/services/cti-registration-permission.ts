import { routes } from '../../common/constants';
import type { CtiRegistrationPermissionApiBody } from '../../common/cti-registration-permission-api';
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
 * Asks the server whether the current user may start CTI registration.
 *
 * Never rejects: any failure resolves to "allowed", so the caller only has to handle
 * an explicit denial.
 */
export async function fetchCtiRegistrationPermission(): Promise<CtiRegistrationPermissionApiBody> {
  try {
    const body = await getCore().http.get<CtiRegistrationPermissionApiBody>(
      routes.ctiRegistrationPermission,
    );

    if (typeof body?.accessAllowed !== 'boolean') {
      return PERMISSION_NOT_EVALUATED;
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
    return PERMISSION_NOT_EVALUATED;
  }
}
