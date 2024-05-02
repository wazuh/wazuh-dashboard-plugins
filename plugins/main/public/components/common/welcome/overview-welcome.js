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
import './welcome.scss';
import {
  withErrorBoundary,
  withGlobalBreadcrumb,
  withReduxProvider,
} from '../hocs';
import { compose } from 'redux';
import {
  Applications,
  Categories,
  endpointSummary,
  overview,
} from '../../../utils/applications';
import { getCore } from '../../../kibana-services';
import { RedirectAppLinks } from '../../../../../../src/plugins/opensearch_dashboards_react/public';

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
    return [{ text: overview.breadcrumbLabel }];
  }),
)(
  class OverviewWelcome extends Component {
    constructor(props) {
      super(props);
      this.strtools = new StringsTools();
    }

    addAgent() {
      return (
        <>
          <EuiFlexGroup>
            <EuiFlexItem>
              <RedirectAppLinks application={getCore().application}>
                <EuiCallOut
                  title={
                    <>
                      No agents were added to this manager.{' '}
                      <EuiButtonEmpty
                        href={getCore().application.getUrlForApp(
                          endpointSummary.id,
                          { path: '#/agents-preview' },
                        )}
                      >
                        Add agent
                      </EuiButtonEmpty>
                    </>
                  }
                  color='warning'
                  iconType='alert'
                ></EuiCallOut>
              </RedirectAppLinks>
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
                <EuiFlexGroup gutterSize='none'>
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
                                <RedirectAppLinks
                                  className='flex-redirect-app-links'
                                  application={getCore().application}
                                >
                                  <EuiCard
                                    size='xs'
                                    layout='horizontal'
                                    icon={
                                      <EuiIcon
                                        size='xl'
                                        type={app.euiIconType}
                                      />
                                    }
                                    className='homSynopsis__card'
                                    title={app.title}
                                    href={getCore().application.getUrlForApp(
                                      app.id,
                                    )}
                                    data-test-subj={`overviewWelcome${this.strtools.capitalize(
                                      app.id,
                                    )}`}
                                    description={app.description}
                                  />
                                </RedirectAppLinks>
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
