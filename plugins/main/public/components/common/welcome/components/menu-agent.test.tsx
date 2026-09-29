/*
 * Wazuh app - Test for the agent applications menu
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
import '@testing-library/jest-dom';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MenuAgent } from './menu-agent';
import {
  configurationAssessment,
  fileIntegrityMonitoring,
  malwareDetection,
  mitreAttack,
  threatHunting,
  vulnerabilityDetection,
} from '../../../../utils/applications';
import { Agent } from '../../../endpoints-summary/types';
import { MAX_PINNED_APPLICATIONS } from '../utils/pinned-applications';

const mockPinAgent = jest.fn();

jest.mock('react-redux', () => ({
  useSelector: jest.fn(() => ''),
}));

jest.mock('../../../../kibana-services', () => ({
  getCore: jest.fn(() => ({
    application: { getUrlForApp: jest.fn(() => '/mock-url') },
  })),
}));

jest.mock('../../../../react-services/navigation-service', () => ({
  __esModule: true,
  default: {
    getInstance: () => ({
      getAppURL: (applicationId: string) => `/app/${applicationId}`,
    }),
  },
}));

jest.mock(
  '../../../../../../../src/plugins/opensearch_dashboards_react/public',
  () => ({
    RedirectAppLinks: ({ children }: { children: React.ReactNode }) => (
      <>{children}</>
    ),
  }),
);

jest.mock('../../../wz-agent-selector/wz-agent-selector-service', () => ({
  PinnedAgentManager: jest.fn().mockImplementation(() => ({
    pinAgent: (...args: unknown[]) => mockPinAgent(...args),
    getPinnedAgent: () => ({ os: { type: 'Linux' } }),
  })),
}));

const agent = { id: '001', os: { type: 'Linux' } } as Agent;

const renderMenu = (pinnedApplications: string[]) => {
  const updatePinnedApplications = jest.fn();
  const closePopover = jest.fn();

  render(
    <MenuAgent
      agent={agent}
      pinnedApplications={pinnedApplications}
      updatePinnedApplications={updatePinnedApplications}
      closePopover={closePopover}
    />,
  );

  return { updatePinnedApplications, closePopover };
};

const pinnedToTheLimit = [
  threatHunting.id,
  fileIntegrityMonitoring.id,
  configurationAssessment.id,
  mitreAttack.id,
  vulnerabilityDetection.id,
];

beforeEach(() => {
  jest.clearAllMocks();
});

describe('MenuAgent', () => {
  it('should render the pin state of every application without hovering it', () => {
    renderMenu([threatHunting.id, configurationAssessment.id]);

    expect(
      screen.getByRole('button', { name: `Unpin ${threatHunting.title}` }),
    ).toHaveAttribute('aria-pressed', 'true');
    expect(
      screen.getByRole('button', { name: `Pin ${malwareDetection.title}` }),
    ).toHaveAttribute('aria-pressed', 'false');
  });

  it('should pin an application that is not pinned yet', () => {
    const { updatePinnedApplications } = renderMenu([threatHunting.id]);

    fireEvent.click(
      screen.getByRole('button', { name: `Pin ${malwareDetection.title}` }),
    );

    expect(updatePinnedApplications).toHaveBeenCalledWith([
      threatHunting.id,
      malwareDetection.id,
    ]);
  });

  it('should unpin an already pinned application', () => {
    const { updatePinnedApplications } = renderMenu([
      threatHunting.id,
      configurationAssessment.id,
    ]);

    fireEvent.click(
      screen.getByRole('button', { name: `Unpin ${threatHunting.title}` }),
    );

    expect(updatePinnedApplications).toHaveBeenCalledWith([
      configurationAssessment.id,
    ]);
  });

  it('should disable the remaining pins once the limit is reached', () => {
    expect(pinnedToTheLimit).toHaveLength(MAX_PINNED_APPLICATIONS);

    renderMenu(pinnedToTheLimit);

    expect(
      screen.getByRole('button', { name: `Pin ${malwareDetection.title}` }),
    ).toBeDisabled();
    expect(
      screen.getByRole('button', { name: `Unpin ${threatHunting.title}` }),
    ).toBeEnabled();
  });

  it('should not allow unpinning the last pinned application', () => {
    renderMenu([threatHunting.id]);

    expect(
      screen.getByRole('button', { name: `Unpin ${threatHunting.title}` }),
    ).toBeDisabled();
  });

  it('should pin the agent and close the popover when an application is opened', () => {
    const { closePopover } = renderMenu([threatHunting.id]);

    fireEvent.click(screen.getByText(malwareDetection.title));

    expect(closePopover).toHaveBeenCalled();
    expect(mockPinAgent).toHaveBeenCalledWith(agent);
  });
});
