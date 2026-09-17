/*
 * Wazuh app - Test for the pinned application shortcuts helpers
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
import {
  MAX_PINNED_APPLICATIONS,
  canPinApplication,
  canUnpinApplication,
  getAgentPinnedApplications,
  sanitizePinnedApplications,
  togglePinnedApplication,
} from './pinned-applications';
import {
  activeResponses,
  configurationAssessment,
  docker,
  malwareDetection,
  threatHunting,
  vulnerabilityDetection,
} from '../../../../utils/applications';
import { Agent } from '../../../endpoints-summary/types';

const agentWithOS = (os: Partial<Agent['os']>): Agent => ({ os } as Agent);

const linuxAgent = agentWithOS({ type: 'Linux' });
const windowsAgent = agentWithOS({ platform: 'windows' });
const sunosAgent = agentWithOS({ platform: 'sunos' });

describe('getAgentPinnedApplications', () => {
  it('should return the pinned applications in the pinned order', () => {
    expect(
      getAgentPinnedApplications(
        [configurationAssessment.id, threatHunting.id],
        linuxAgent,
      ),
    ).toEqual([configurationAssessment, threatHunting]);
  });

  it('should return the Incident Response application, which has no module entry', () => {
    expect(
      getAgentPinnedApplications([activeResponses.id], linuxAgent),
    ).toEqual([activeResponses]);
  });

  it('should discard identifiers without a matching application', () => {
    expect(
      getAgentPinnedApplications(
        ['a-removed-application', threatHunting.id],
        linuxAgent,
      ),
    ).toEqual([threatHunting]);
  });

  it('should discard applications unsupported by the agent operating system', () => {
    expect(
      getAgentPinnedApplications([docker.id, threatHunting.id], windowsAgent),
    ).toEqual([threatHunting]);

    expect(
      getAgentPinnedApplications(
        [vulnerabilityDetection.id, threatHunting.id],
        sunosAgent,
      ),
    ).toEqual([threatHunting]);
  });

  it('should return every pinned application', () => {
    expect(
      getAgentPinnedApplications(
        [configurationAssessment.id, threatHunting.id, activeResponses.id],
        linuxAgent,
      ),
    ).toEqual([configurationAssessment, threatHunting, activeResponses]);
  });

  it('should return an empty list when there are no pinned applications', () => {
    expect(getAgentPinnedApplications([], linuxAgent)).toEqual([]);
  });

  it('should support an undefined agent', () => {
    expect(getAgentPinnedApplications([threatHunting.id], undefined)).toEqual([
      threatHunting,
    ]);
  });
});

describe('sanitizePinnedApplications', () => {
  it('should discard identifiers without a matching application', () => {
    expect(
      sanitizePinnedApplications([
        'a-removed-application',
        threatHunting.id,
        configurationAssessment.id,
      ]),
    ).toEqual([threatHunting.id, configurationAssessment.id]);
  });

  it('should discard the identifiers over the pin limit', () => {
    const pinnedApplicationIds = [
      threatHunting.id,
      configurationAssessment.id,
      vulnerabilityDetection.id,
      docker.id,
      activeResponses.id,
      malwareDetection.id,
    ];

    expect(pinnedApplicationIds.length).toBeGreaterThan(
      MAX_PINNED_APPLICATIONS,
    );
    expect(sanitizePinnedApplications(pinnedApplicationIds)).toEqual(
      pinnedApplicationIds.slice(0, MAX_PINNED_APPLICATIONS),
    );
  });
});

describe('canPinApplication', () => {
  it('should allow pinning while the limit is not reached', () => {
    expect(canPinApplication([threatHunting.id])).toBe(true);
  });

  it('should not allow pinning once the limit is reached', () => {
    expect(
      canPinApplication(new Array(MAX_PINNED_APPLICATIONS).fill('an-app')),
    ).toBe(false);
  });
});

describe('canUnpinApplication', () => {
  it('should allow unpinning while over the minimum', () => {
    expect(
      canUnpinApplication([threatHunting.id, configurationAssessment.id]),
    ).toBe(true);
  });

  it('should not allow unpinning the last pinned application', () => {
    expect(canUnpinApplication([threatHunting.id])).toBe(false);
  });
});

describe('togglePinnedApplication', () => {
  it('should append an unpinned application, keeping the pinned order', () => {
    expect(
      togglePinnedApplication(
        [threatHunting.id, configurationAssessment.id],
        docker.id,
      ),
    ).toEqual([threatHunting.id, configurationAssessment.id, docker.id]);
  });

  it('should remove an already pinned application', () => {
    expect(
      togglePinnedApplication(
        [threatHunting.id, configurationAssessment.id],
        threatHunting.id,
      ),
    ).toEqual([configurationAssessment.id]);
  });

  it('should not pin over the limit', () => {
    const pinnedApplicationIds = new Array(MAX_PINNED_APPLICATIONS)
      .fill(null)
      .map((_, index) => `an-app-${index}`);

    expect(togglePinnedApplication(pinnedApplicationIds, docker.id)).toEqual(
      pinnedApplicationIds,
    );
  });

  it('should not unpin the last pinned application', () => {
    expect(
      togglePinnedApplication([threatHunting.id], threatHunting.id),
    ).toEqual([threatHunting.id]);
  });
});
