/*
 * Wazuh app - React component for the agent applications menu.
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
import React, { useMemo } from 'react';
import {
  EuiButtonIcon,
  EuiFlexGrid,
  EuiFlexGroup,
  EuiFlexItem,
  EuiIcon,
  EuiLink,
  EuiSideNav,
  EuiToolTip,
} from '@elastic/eui';
import { useSelector } from 'react-redux';
import { hasAgentSupportModule } from '../../../../react-services/wz-agents';
import { getCore } from '../../../../kibana-services';
import { Applications, Categories } from '../../../../utils/applications';
import NavigationService from '../../../../react-services/navigation-service';
import { RedirectAppLinks } from '../../../../../../../src/plugins/opensearch_dashboards_react/public';
import { PinnedAgentManager } from '../../../wz-agent-selector/wz-agent-selector-service';
import { Agent } from '../../../endpoints-summary/types';
import {
  MAX_PINNED_APPLICATIONS,
  canPinApplication,
  canUnpinApplication,
  togglePinnedApplication,
} from '../utils/pinned-applications';
import './menu-agent.scss';

type Application = (typeof Applications)[number];

interface ApplicationsCategory {
  id: string;
  label: string;
  icon: string;
  order: number;
  applications: Application[];
}

/** Group the agent menu applications by category, in the registry order. */
function getApplicationsCategories(): ApplicationsCategory[] {
  return Applications.filter(({ showInAgentMenu }) => showInAgentMenu)
    .reduce<ApplicationsCategory[]>((categories, application) => {
      const existingCategory = categories.find(
        ({ id }) => id === application.category,
      );

      if (existingCategory) {
        existingCategory.applications.push(application);
        return categories;
      }

      const category = Categories.find(({ id }) => id === application.category);

      if (category) {
        categories.push({
          id: category.id,
          label: category.label,
          icon: category.euiIconType,
          order: category.order,
          applications: [application],
        });
      }

      return categories;
    }, [])
    .sort((a, b) => a.order - b.order);
}

interface PinApplicationButtonProps {
  application: Application;
  isPinned: boolean;
  canPin: boolean;
  canUnpin: boolean;
  onClick: () => void;
}

/**
 * Always rendered, so the pinned applications can be told apart without
 * hovering them. Disabled with the reason as its tooltip at the pin limits.
 */
const PinApplicationButton = ({
  application,
  isPinned,
  canPin,
  canUnpin,
  onClick,
}: PinApplicationButtonProps) => {
  const isDisabled = isPinned ? !canUnpin : !canPin;
  const label = isPinned
    ? `Unpin ${application.title}`
    : `Pin ${application.title}`;

  let tooltip: string;

  if (isPinned) {
    tooltip = canUnpin
      ? 'Unpin from the agent header'
      : 'At least one application must stay pinned';
  } else {
    tooltip = canPin
      ? 'Pin to the agent header'
      : `Pin limit reached (${MAX_PINNED_APPLICATIONS}). Unpin an application to pin ${application.title}`;
  }

  return (
    <EuiToolTip content={tooltip} position='top'>
      <EuiButtonIcon
        className={`wz-menu-agent-application-pin${
          isPinned ? ' wz-menu-agent-application-pin-pinned' : ''
        }`}
        iconType={isPinned ? 'pinFilled' : 'pin'}
        color={isPinned ? 'primary' : 'text'}
        iconSize='m'
        aria-label={label}
        aria-pressed={isPinned}
        isDisabled={isDisabled}
        onClick={onClick}
        data-test-subj={`menu-agent-pin-${application.id}`}
      />
    </EuiToolTip>
  );
};

interface MenuAgentProps {
  agent: Agent;
  pinnedApplications: string[];
  updatePinnedApplications: (pinnedApplications: string[]) => void;
  closePopover: () => void;
}

export const MenuAgent = ({
  agent,
  pinnedApplications,
  updatePinnedApplications,
  closePopover,
}: MenuAgentProps) => {
  const currentTab = useSelector(
    (state: { appStateReducers?: { currentTab?: string } }) =>
      state.appStateReducers?.currentTab,
  );
  const categories = useMemo(() => getApplicationsCategories(), []);
  const pinnedAgentManager = useMemo(() => new PinnedAgentManager(), []);
  const canPin = canPinApplication(pinnedApplications);
  const canUnpin = canUnpinApplication(pinnedApplications);

  const pinnedAgent = pinnedAgentManager.getPinnedAgent();

  const navigateToApplication = () => {
    closePopover();
    pinnedAgentManager.pinAgent(agent);
  };

  const createItem = (application: Application) => {
    const isPinned = pinnedApplications.includes(application.id);

    return {
      id: application.id,
      isSelected: currentTab === application.id,
      name: (
        <EuiFlexGroup
          className='wz-menu-agent-application'
          responsive={false}
          alignItems='center'
          gutterSize='s'
        >
          <EuiFlexItem>
            <RedirectAppLinks application={getCore().application}>
              <EuiLink
                href={NavigationService.getInstance().getAppURL(application.id)}
                onClick={navigateToApplication}
              >
                {application.title}
              </EuiLink>
            </RedirectAppLinks>
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <PinApplicationButton
              application={application}
              isPinned={isPinned}
              canPin={canPin}
              canUnpin={canUnpin}
              onClick={() =>
                updatePinnedApplications(
                  togglePinnedApplication(pinnedApplications, application.id),
                )
              }
            />
          </EuiFlexItem>
        </EuiFlexGroup>
      ),
    };
  };

  return (
    <div className='WzManagementSideMenu'>
      <EuiFlexGrid columns={2}>
        {categories.map(category => (
          <EuiFlexItem key={category.id}>
            <EuiSideNav
              items={[
                {
                  id: category.id,
                  name: category.label,
                  icon: <EuiIcon type={category.icon} />,
                  items: category.applications
                    .filter(({ id }) => hasAgentSupportModule(pinnedAgent, id))
                    .map(application => createItem(application)),
                },
              ]}
              style={{ padding: '4px 12px' }}
            />
          </EuiFlexItem>
        ))}
      </EuiFlexGrid>
    </div>
  );
};
