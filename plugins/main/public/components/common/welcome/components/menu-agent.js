/*
 * Wazuh app - React component for registering agents.
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
import React, { Component } from 'react';
import {
  EuiFlexGrid,
  EuiFlexGroup,
  EuiFlexItem,
  EuiIcon,
  EuiSideNav,
  EuiLink,
} from '@elastic/eui';
import { connect } from 'react-redux';
import { hasAgentSupportModule } from '../../../../react-services/wz-agents';
import {
  getAngularModule,
  getCore,
  getToasts,
} from '../../../../kibana-services';
import { Applications, Categories } from '../../../../utils/applications';
import { RedirectAppLinks } from '../../../../../../../src/plugins/opensearch_dashboards_react/public';
import { PinnedAgentManager } from '../../../wz-agent-selector/wz-agent-selector-service';

class WzMenuAgent extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hoverAddFilter: '',
    };

    this.pinnedAgentManager = new PinnedAgentManager();

    this.appCategories = Applications.reduce((categories, app) => {
      const existingCategory = categories.find(
        category => category.id === app.category,
      );
      if (app.showInAgentMenu) {
        if (existingCategory) {
          existingCategory.apps.push(app);
        } else {
          const category = Categories.find(
            category => app.category === category.id,
          );
          categories.push({
            id: category.id,
            label: Categories.find(category => app.category === category.id)
              .label,
            icon: category.euiIconType,
            apps: [app],
          });
        }
      }
      return categories;
    }, []).sort((a, b) => {
      return (
        Categories.find(category => a.id === category.id).order -
        Categories.find(category => b.id === category.id).order
      );
    });
  }

  componentDidMount() {
    const $injector = getAngularModule().$injector;
    this.router = $injector.get('$route');
  }

  clickMenuItem = appId => {
    this.props.closePopover();
    // do not redirect if we already are in that tab
    this.pinnedAgentManager.pinAgent(this.props.isAgent);
  };

  addToast({ color, title, text, time = 3000 }) {
    getToasts().add({ title, text, toastLifeTimeMs: time, color });
  }

  createItems = items => {
    const currentAgentData = this.pinnedAgentManager.getPinnedAgent();
    return items
      .filter(item => hasAgentSupportModule(currentAgentData, item.id))
      .map(item => this.createItem(item));
  };

  createItem = (item, data = {}) => {
    // NOTE: Duplicate `name` values will cause `id` collisions.
    return {
      ...data,
      id: item.id,
      name: (
        <EuiFlexGroup
          responsive={false}
          onMouseEnter={() => {
            this.setState({ hoverAddFilter: item.id });
          }}
          onMouseLeave={() => {
            this.setState({ hoverAddFilter: '' });
          }}
        >
          <EuiFlexItem
            onClick={() => (!item.isTitle ? this.clickMenuItem(item.id) : null)}
            style={{ cursor: !item.isTitle ? 'pointer' : 'normal' }}
          >
            <RedirectAppLinks application={getCore().application}>
              <EuiLink
                href={getCore().application.getUrlForApp(item.id)}
                style={{ cursor: 'pointer' }}
              >
                {item.title}
              </EuiLink>
            </RedirectAppLinks>
          </EuiFlexItem>
          {this.state.hoverAddFilter === item.id &&
            !item.isTitle &&
            (this.props.pinnedApplications.length < 6 || item.isPin) &&
            (this.props.pinnedApplications.length > 1 || !item.isPin) && (
              <EuiFlexItem grow={false}>
                <EuiIcon
                  onClick={() => {
                    if (
                      !item.isPin &&
                      this.props.pinnedApplications.length < 6
                    ) {
                      this.props.updatePinnedApplications([
                        ...this.props.pinnedApplications,
                        item.id,
                      ]);
                    } else if (
                      this.props.pinnedApplications.includes(item.id)
                    ) {
                      this.props.updatePinnedApplications([
                        ...this.props.pinnedApplications.filter(
                          id => id !== item.id,
                        ),
                      ]);
                    } else {
                      this.addToast({
                        title:
                          'The limit of pinned applications has been reached',
                        color: 'danger',
                      });
                    }
                  }}
                  color='primary'
                  type={
                    this.props.pinnedApplications.includes(item.id)
                      ? 'pinFilled'
                      : 'pin'
                  }
                  aria-label='Next'
                  style={{ cursor: 'pointer' }}
                />
              </EuiFlexItem>
            )}
        </EuiFlexGroup>
      ),
      isSelected: this.props.currentTab === item.id,
    };
  };

  render() {
    const items = this.appCategories.map(({ apps, ...rest }) => ({
      ...rest,
      items: this.createItems(
        apps.map(app => ({
          id: app.id,
          title: app.title,
          isPin: this.props.pinnedApplications.includes(app.id),
        })),
      ),
    }));

    return (
      <div className='WzManagementSideMenu'>
        <div>
          <EuiFlexGrid columns={2}>
            {items.map(item => (
              <EuiFlexItem key={item.label}>
                <EuiSideNav
                  items={[
                    {
                      id: item.label,
                      name: item.label,
                      icon: <EuiIcon type={item.icon}></EuiIcon>,
                      items: item.items,
                    },
                  ]}
                  style={{ padding: '4px 12px' }}
                />
              </EuiFlexItem>
            ))}
          </EuiFlexGrid>
        </div>
      </div>
    );
  }
}

const mapStateToProps = state => {
  return {
    currentTab: state.appStateReducers.currentTab,
  };
};

export default connect(mapStateToProps, null)(WzMenuAgent);
