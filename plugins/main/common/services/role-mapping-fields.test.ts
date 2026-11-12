import {
  getRoleMappingUserFields,
  isKnownRoleMappingUserField,
} from './role-mapping-fields';

describe('role mapping user fields', () => {
  it('knows the security platform fields', () => {
    expect(isKnownRoleMappingUserField('user_name')).toBe(true);
    expect(isKnownRoleMappingUserField('backend_roles')).toBe(true);
  });

  it.each(['', 'user_namebackend_roles', 'username'])(
    'does not know %p on the security platform',
    field => {
      expect(isKnownRoleMappingUserField(field)).toBe(false);
    },
  );

  it('adds the legacy field for the other platforms', () => {
    expect(getRoleMappingUserFields(true)).toContain('username');
    expect(getRoleMappingUserFields()).not.toContain('username');
  });
});
