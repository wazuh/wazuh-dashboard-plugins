/*
 * Wazuh app - Helpers for the pinned application shortcuts of the agent welcome screen
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
import { Applications } from '../../../../utils/applications';
import { hasAgentSupportModule } from '../../../../react-services/wz-agents';
import { Agent } from '../../../endpoints-summary/types';

type Application = (typeof Applications)[number];

/**
 * Resolve the pinned application identifiers into the applications to render as
 * shortcuts for an agent.
 *
 * Identifiers without a matching application are discarded, so a stale value
 * stored in the browser can not break the screen. Applications unsupported by
 * the agent operating system are discarded too, keeping the shortcuts
 * consistent with the applications menu.
 *
 * @param pinnedApplicationIds pinned application identifiers, in display order
 * @param agent agent being displayed
 */
export function getAgentPinnedApplications(
  pinnedApplicationIds: string[],
  agent: Agent | undefined,
): Application[] {
  return pinnedApplicationIds
    .map(applicationId => Applications.find(({ id }) => id === applicationId))
    .filter(
      (application): application is Application =>
        Boolean(application) && hasAgentSupportModule(agent, application!.id),
    );
}

/** Maximum amount of applications that can be pinned to the agent header. */
export const MAX_PINNED_APPLICATIONS = 5;

const MIN_PINNED_APPLICATIONS = 1;

/** Drop unknown applications and the ones over the pin limit. */
export function sanitizePinnedApplications(
  pinnedApplicationIds: string[],
): string[] {
  return pinnedApplicationIds
    .filter(pinnedApplicationId =>
      Applications.some(({ id }) => id === pinnedApplicationId),
    )
    .slice(0, MAX_PINNED_APPLICATIONS);
}

export function canPinApplication(pinnedApplicationIds: string[]): boolean {
  return pinnedApplicationIds.length < MAX_PINNED_APPLICATIONS;
}

export function canUnpinApplication(pinnedApplicationIds: string[]): boolean {
  return pinnedApplicationIds.length > MIN_PINNED_APPLICATIONS;
}

/** Pin or unpin an application. Returns the list unchanged at the limits. */
export function togglePinnedApplication(
  pinnedApplicationIds: string[],
  applicationId: string,
): string[] {
  if (pinnedApplicationIds.includes(applicationId)) {
    return canUnpinApplication(pinnedApplicationIds)
      ? pinnedApplicationIds.filter(id => id !== applicationId)
      : pinnedApplicationIds;
  }

  return canPinApplication(pinnedApplicationIds)
    ? [...pinnedApplicationIds, applicationId]
    : pinnedApplicationIds;
}
