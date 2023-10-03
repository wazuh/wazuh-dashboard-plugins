/*
 * Wazuh app - React component for building the Overview welcome screen.
 *
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

import React, { Component, Fragment } from 'react';
import { StringsTools } from '../../../utils/strings-tools';
import {
  EuiCard,
  EuiIcon,
  EuiFlexItem,
  EuiFlexGroup,
  EuiSpacer,
  EuiFlexGrid,
  EuiCallOut,
  EuiPage,
  EuiButtonEmpty,
} from '@elastic/eui';
import { updateCurrentTab } from '../../../redux/actions/appStateActions';
import store from '../../../redux/store';
import './welcome.scss';
import { WAZUH_MODULES } from '../../../../common/wazuh-modules';
import {
  withErrorBoundary,
  withGlobalBreadcrumb,
  withReduxProvider,
} from '../hocs';
import { compose } from 'redux';
import {
  getNavigationAppURL,
  navigateAppURL,
} from '../../../react-services/navigate-app';
import { Applications, Categories } from '../../../utils/applications';

const appCategories = Applications.reduce((categories, app) => {
  const existingCategory = categories.find(
    category => category.label === app.category,
  );
  if (app.showInOverviewApp) {
    if (existingCategory) {
      existingCategory.apps.push(app);
    } else {
      categories.push({
        label: app.category,
        apps: [app],
      });
    }
  }
  return categories;
}, []).sort((a, b) => {
  return (
    Categories.find(category => a.label === category.id).order -
    Categories.find(category => b.label === category.id).order
  );
});

export const OverviewWelcome = compose(
  withReduxProvider,
  withErrorBoundary,
  withGlobalBreadcrumb(props => {
    return [{ text: '' }, { text: 'Overview' }];
  }),
)(
  class OverviewWelcome extends Component {
    constructor(props) {
      super(props);
      this.strtools = new StringsTools();

      this.state = {
        extensions: this.props.extensions,
      };
    }

    buildTabCard(tab, icon) {
      return (
        <EuiFlexItem>
          <EuiCard
            size='xs'
            layout='horizontal'
            icon={<EuiIcon size='xl' type={icon} color='primary' />}
            className='homSynopsis__card'
            title={WAZUH_MODULES[tab].title}
            onClick={() => store.dispatch(updateCurrentTab(tab))}
            data-test-subj={`overviewWelcome${this.strtools.capitalize(tab)}`}
            description={WAZUH_MODULES[tab].description}
          />
        </EuiFlexItem>
      );
    }

    addAgent() {
      return (
        <>
          <EuiFlexGroup>
            <EuiFlexItem>
              <EuiCallOut
                title={
                  <>
                    No agents were added to this manager.{' '}
                    <EuiButtonEmpty
                      href={getNavigationAppURL(
                        '/app/endpoints-summary#/agents-preview',
                      )}
                    >
                      Add agent
                    </EuiButtonEmpty>
                  </>
                }
                color='warning'
                iconType='alert'
              ></EuiCallOut>
            </EuiFlexItem>
          </EuiFlexGroup>
          <EuiSpacer size='xl' />
        </>
      );
    }

    render() {
      return (
        <Fragment>
          <EuiPage className='wz-welcome-page'>
            <EuiFlexGroup gutterSize='l'>
              <EuiFlexItem>
                {this.props.agentsCountTotal === 0 && this.addAgent()}
                <EuiFlexGroup>
                  <EuiFlexGrid columns={2}>
                    {appCategories.map(({ label, apps }) => (
                      <EuiFlexItem key={label}>
                        <EuiCard
                          title
                          description
                          betaBadgeLabel={
                            Categories.find(category => category.id === label)
                              ?.label
                          }
                        >
                          <EuiSpacer size='s' />
                          <EuiFlexGrid columns={2}>
                            {apps.map(app => (
                              <EuiFlexItem key={app.id}>
                                <EuiCard
                                  size='xs'
                                  layout='horizontal'
                                  icon={
                                    <EuiIcon
                                      size='xl'
                                      type={app.euiIconType}
                                      color='primary'
                                    />
                                  }
                                  className='homSynopsis__card'
                                  title={app.title}
                                  onClick={() =>
                                    navigateAppURL(`/app/${app.id}`)
                                  }
                                  data-test-subj={`overviewWelcome${this.strtools.capitalize(
                                    app.id,
                                  )}`}
                                  description={app.description}
                                />
                              </EuiFlexItem>
                            ))}
                          </EuiFlexGrid>
                        </EuiCard>
                      </EuiFlexItem>
                    ))}
                  </EuiFlexGrid>
                </EuiFlexGroup>
              </EuiFlexItem>
            </EuiFlexGroup>
          </EuiPage>
        </Fragment>
      );
    }
  },
);
