/**
 * GET `/api/wazuh-check-updates/cti-registration/permission` — may the current user
 * start CTI registration?
 *
 * Thin passthrough of the Content Manager privilege probe (see
 * `CONTENT_MANAGER_PERMISSION_CHECK_QUERY_PARAM`). The route always answers HTTP 200,
 * so the caller branches on `accessAllowed`.
 *
 * The probe is a user-experience gate, not the authorization control: the indexer
 * still evaluates the privilege when registration is applied. A probe that cannot be
 * evaluated therefore answers `accessAllowed: true` and lets the flow proceed rather
 * than hiding the action from a user who may well be allowed.
 */
export interface CtiRegistrationPermissionApiBody {
  /** False only when the indexer explicitly denied the privilege. */
  accessAllowed: boolean;
  /** Privileges the current user is missing, as reported by the indexer. */
  missingPrivileges: string[];
}
