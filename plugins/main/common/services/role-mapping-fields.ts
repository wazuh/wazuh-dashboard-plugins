/**
 * User fields a role mapping rule can match. A rule is evaluated against the
 * authentication context of the user, which on the security platform is the
 * `authinfo` response of the indexer security plugin.
 */
export const ROLE_MAPPING_USER_FIELDS = [
  'user_name',
  'backend_roles',
  'roles',
  'user_requested_tenant',
  'remote_address',
  'custom_attribute_names',
  'principal',
  'user',
];

/** The authentication context of the platforms without security plugin. */
export const ROLE_MAPPING_DEFAULT_PLATFORM_USER_FIELDS = ['username'];

export const getRoleMappingUserFields = (
  includeDefaultPlatformFields = false,
): string[] =>
  includeDefaultPlatformFields
    ? [
        ...ROLE_MAPPING_USER_FIELDS,
        ...ROLE_MAPPING_DEFAULT_PLATFORM_USER_FIELDS,
      ]
    : ROLE_MAPPING_USER_FIELDS;

export const isKnownRoleMappingUserField = (
  field: string,
  knownFields: string[] = ROLE_MAPPING_USER_FIELDS,
): boolean => knownFields.includes(field);
