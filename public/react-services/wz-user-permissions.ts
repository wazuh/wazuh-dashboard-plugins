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
import wazuhPermissions from '../../common/api-info/security-actions';

export class WzUserPermissions{
  // Check the missing permissions of the required ones that the user does not have
  static checkMissingUserPermissions = (requiredPermissions, userPermissions) => {
    const filtered = requiredPermissions.filter(permission => {
      if(Array.isArray(permission)){
        const missingOrPermissions = WzUserPermissions.checkMissingUserPermissions(permission, userPermissions);
        return Array.isArray(missingOrPermissions) ? missingOrPermissions.length === permission.length : missingOrPermissions;
      }
      
      const isGenericResource = (permission.resource.match(':\\*') || []).index === permission.resource.length - 2

      const actionName = typeof permission === 'string' ? permission : permission.action;
      let actionResource = (typeof permission === 'string' && wazuhPermissions[actionName].resources.length === 1) ? (wazuhPermissions[actionName].resources[0] + ':*') : permission.resource;
      const actionResourceAll = actionResource
        .split('&')
        .map(function (str) {
          return str
            .split(':')
            .map(function (str, index) {
              return index === 2 ? '*' : str;
            })
            .join(':');
        })
        .join('&');

      const multiplePermission = (resource: string) => {
        return (
          ![actionResource, actionResourceAll].includes(resource) &&
          (resource.match(`/${actionResource}/`) || resource.match(`/${actionResourceAll}/`))
        );
      };

      const simplePermission = (resource: string) => {
        return (
          ![actionResource, actionResourceAll].includes(resource) &&
          (resource.match(actionResource.replace('*', '\\*')) ||
            resource.match(actionResourceAll.replace('*', '\*')))
        );
      };

      const userPartialResources: string[] | undefined = userPermissions[actionName]
        ? Object.keys(userPermissions[actionName]).filter((resource) =>
            resource.match('&')
              ? multiplePermission(resource)
              : simplePermission(resource)
          )
        : undefined;

      if (!userPermissions[actionName]) {
        return userPermissions.rbac_mode === RBAC_MODE_WHITE;
      }

      const existInWazuhPermissions = (userResource) => {
        return !!wazuhPermissions[actionName].resources.find(function (resource) {
          return (
            resource ===
            userResource
              .split('&')
              .map((str) => {
                return str
                  .split(':')
                  .map(function (str, index) {
                    return index === 2 ? '*' : str;
                  })
                  .join(':');
              })
              .join('&')
              .replace(/:\*/g, '')
          );
        });
      };

      const notAllowInWazuhPermissions = (userResource) => {
        if (userResource !== RESOURCE_ANY) {
          return existInWazuhPermissions(userResource)
            ? !isAllow(userPermissions[actionName][userResource])
            : true;
        } else {
          return !isAllow(userPermissions[actionName][userResource]);
        }
      };

      const partialResourceIsAllow = (resource) => {
        return isGenericResource ? !isAllow(userPermissions[actionName][resource]) : isAllow(userPermissions[actionName][resource]);
      }

      return userPermissions[actionName][actionResource]
        ? notAllowInWazuhPermissions(actionResource)
        : Object.keys(userPermissions[actionName]).some((resource) => {
            return resource.match(actionResourceAll.replace('*', '\\*')) !== null;
          })
        ? Object.keys(userPermissions[actionName]).some((resource) => {
            if (resource.match(actionResourceAll.replace('*', '\\*'))) {
              return notAllowInWazuhPermissions(resource);
            }
          })
        : (userPartialResources || []).length
        ? userPartialResources.some((resource) => partialResourceIsAllow(resource))
        : wazuhPermissions[actionName].resources.find(
            (resource) => resource === RESOURCE_ANY_SHORT
          ) && userPermissions[actionName][RESOURCE_ANY]
        ? !isAllow(userPermissions[actionName][RESOURCE_ANY])
        : userPermissions.rbac_mode === RBAC_MODE_WHITE;
    });

    return filtered.length ? filtered : false;
  }
  // Check the missing roles of the required ones that the user does not have
  static checkMissingUserRoles(requiredRoles, userRoles) {
    const rolesUserNotOwn = requiredRoles.filter(requiredRole => !userRoles.includes(requiredRole));
    return rolesUserNotOwn.length ? rolesUserNotOwn : false;
  }
}

// Constants
const RESOURCE_ANY = '*:*:*';
const RESOURCE_ANY_SHORT = '*:*';
const RBAC_MODE_BLACK = 'black';
const RBAC_MODE_WHITE = 'white';

// Utility functions
const isAllow = value => value === 'allow';
