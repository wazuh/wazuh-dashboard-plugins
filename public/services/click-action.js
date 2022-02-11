/*
 * Wazuh app - Wazuh table directive click wrapper
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

export function clickAction(
  item,
  openAction = false,
  instance,
  shareAgent,
  $location,
  $scope
) {
  if (
    instance.path === '/agents' ||
    new RegExp(/^\/agents\/groups\/[a-zA-Z0-9_\-.]*$/).test(instance.path)
  ) {
    shareAgent.setAgent(item);
    // Check location target and go to that path
    switch (openAction) {
      case 'configuration':
        shareAgent.setTargetLocation({
          tab: 'configuration',
          subTab: 'panels'
        });
        break;
      case 'discover':
        shareAgent.setTargetLocation({
          tab: 'general',
          subTab: 'discover'
        });
        break;
      default:
        shareAgent.setTargetLocation({
          tab: 'welcome',
          subTab: 'panels'
        });
    }

    $location.path('/agents');
  } else if (instance.path === '/agents/groups') {
    $scope.$emit('wazuhShowGroup', { group: item });
  } else if (
    new RegExp(/^\/agents\/groups\/[a-zA-Z0-9_\-.]*\/files$/).test(
      instance.path
    )
  ) {
    $scope.$emit('wazuhShowGroupFile', {
      groupName: instance.path.split('groups/')[1].split('/files')[0],
      fileName: item.filename
    });
  } else if (instance.path === '/rules') {
    $scope.$emit('wazuhShowRule', { rule: item });
  } else if (instance.path.includes('/decoders')) {
    $scope.$emit('wazuhShowDecoder', { decoder: item });
  } else if (instance.path.includes('/lists/files')) {
    $scope.$emit('wazuhShowCdbList', { cdblist: item });
  } else if (instance.path === '/cluster/nodes') {
    $scope.$emit('wazuhShowClusterNode', { node: item });
  }
}
