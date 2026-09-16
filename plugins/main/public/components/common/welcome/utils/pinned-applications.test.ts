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
import { getAgentPinnedApplications } from './pinned-applications';
import {
  activeResponses,
  configurationAssessment,
  docker,
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
        5,
      ),
    ).toEqual([configurationAssessment, threatHunting]);
  });

  it('should return the Incident Response application, which has no module entry', () => {
    expect(
      getAgentPinnedApplications([activeResponses.id], linuxAgent, 5),
    ).toEqual([activeResponses]);
  });

  it('should discard identifiers without a matching application', () => {
    expect(
      getAgentPinnedApplications(
        ['a-removed-application', threatHunting.id],
        linuxAgent,
        5,
      ),
    ).toEqual([threatHunting]);
  });

  it('should discard applications unsupported by the agent operating system', () => {
    expect(
      getAgentPinnedApplications(
        [docker.id, threatHunting.id],
        windowsAgent,
        5,
      ),
    ).toEqual([threatHunting]);

    expect(
      getAgentPinnedApplications(
        [vulnerabilityDetection.id, threatHunting.id],
        sunosAgent,
        5,
      ),
    ).toEqual([threatHunting]);
  });

  it('should limit the result to the maximum amount of shortcuts', () => {
    expect(
      getAgentPinnedApplications(
        [configurationAssessment.id, threatHunting.id, activeResponses.id],
        linuxAgent,
        2,
      ),
    ).toEqual([configurationAssessment, threatHunting]);
  });

  it('should return an empty list when there are no pinned applications', () => {
    expect(getAgentPinnedApplications([], linuxAgent, 5)).toEqual([]);
  });

  it('should support an undefined agent', () => {
    expect(
      getAgentPinnedApplications([threatHunting.id], undefined, 5),
    ).toEqual([threatHunting]);
  });
});
