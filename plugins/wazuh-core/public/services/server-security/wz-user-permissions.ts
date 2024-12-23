/*
 * Wazuh app - React hook for get query of plugin platform searchBar
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

// Data extrated of /security/actions endpoint
import wazuhPermissions from '../../../common/api-info/security-actions.json';

// Constants
const RESOURCE_ANY = '*:*:*';
const RESOURCE_ANY_SHORT = '*:*';
const RBAC_MODE_WHITE = 'white';
const ALLOW = 'allow';
// Utility functions
const isAllow = (value: string) => value === ALLOW;

// Check the missing permissions of the required ones that the user does not have
export const checkMissingUserPermissions = (
  requiredPermissions,
  userPermissions,
) => {
  const filtered = requiredPermissions.filter(permission => {
    if (Array.isArray(permission)) {
      const missingOrPermissions = checkMissingUserPermissions(
        permission,
        userPermissions,
      );

      return Array.isArray(missingOrPermissions)
        ? missingOrPermissions.length === permission.length
        : missingOrPermissions;
    }

    const isGenericResource =
      permission.resource.match(String.raw`:\*`)?.index ===
      permission.resource.length - 2;
    const actionName =
      typeof permission === 'string' ? permission : permission.action;
    const actionResource =
      typeof permission === 'string' &&
      wazuhPermissions[actionName].resources.length === 1
        ? wazuhPermissions[actionName].resources[0] + ':*'
        : permission.resource;
    const actionResourceAll = actionResource
      .split('&')
      .map(str =>
        str
          .split(':')
          .map((str, index) => (index === 2 ? '*' : str))
          .join(':'),
      )
      .join('&');
    const multiplePermission = (resource: string) =>
      ![actionResource, actionResourceAll].includes(resource) &&
      (resource.match(`/${actionResource}/`) ||
        resource.match(`/${actionResourceAll}/`));
    const simplePermission = (resource: string) =>
      ![actionResource, actionResourceAll].includes(resource) &&
      (resource.match(actionResource.replaceAll('*', '.+')) ||
        resource.match(actionResourceAll.replaceAll('*', '.+')));
    const userPartialResources: string[] | undefined = userPermissions[
      actionName
    ]
      ? Object.keys(userPermissions[actionName]).filter(resource =>
          resource.match('&')
            ? multiplePermission(resource)
            : simplePermission(resource),
        )
      : undefined;

    if (!userPermissions[actionName]) {
      return userPermissions.rbac_mode === RBAC_MODE_WHITE;
    }

    const existInWazuhPermissions = userResource =>
      !!wazuhPermissions[actionName].resources.includes(
        userResource
          .split('&')
          .map(str =>
            str
              .split(':')
              .map((str, index) => (index === 2 ? '*' : str))
              .join(':'),
          )
          .join('&')
          .replaceAll(':*', ''),
      );

    const notAllowInWazuhPermissions = userResource => {
      if (userResource === RESOURCE_ANY) {
        return !isAllow(userPermissions[actionName][userResource]);
      } else {
        return existInWazuhPermissions(userResource)
          ? !isAllow(userPermissions[actionName][userResource])
          : true;
      }
    };

    const partialResourceIsAllow = resource =>
      isGenericResource
        ? !isAllow(userPermissions[actionName][resource])
        : isAllow(userPermissions[actionName][resource]);

    return userPermissions[actionName][actionResource]
      ? notAllowInWazuhPermissions(actionResource)
      : Object.keys(userPermissions[actionName]).some(
            resource =>
              resource.match(actionResourceAll.replaceAll('*', '.+')) !== null,
          )
        ? Object.keys(userPermissions[actionName]).some(resource => {
            // eslint-disable-next-line unicorn/prefer-regexp-test
            if (resource.match(actionResourceAll.replaceAll('*', '.+'))) {
              return notAllowInWazuhPermissions(resource);
            }
          })
        : userPartialResources?.length > 0
          ? userPartialResources.some(resource =>
              partialResourceIsAllow(resource),
            )
          : wazuhPermissions[actionName].resources.includes(
                RESOURCE_ANY_SHORT,
              ) && userPermissions[actionName][RESOURCE_ANY]
            ? !isAllow(userPermissions[actionName][RESOURCE_ANY])
            : userPermissions.rbac_mode === RBAC_MODE_WHITE;
  });

  return filtered.length > 0 ? filtered : false;
};

// Check the missing roles of the required ones that the user does not have
export const checkMissingUserRoles = (requiredRoles, userRoles) => {
  const rolesUserNotOwn = requiredRoles.filter(
    requiredRole => !userRoles.includes(requiredRole),
  );

  return rolesUserNotOwn.length > 0 ? rolesUserNotOwn : false;
};
