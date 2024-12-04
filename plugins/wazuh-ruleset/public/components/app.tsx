import React, { useState, useEffect } from 'react';
import { I18nProvider } from '@osd/i18n/react';
import {
  EuiPage,
  EuiPageBody,
  EuiSideNav,
  EuiPageSideBar,
  EuiPanel,
} from '@elastic/eui';
import { Router, Route, Switch, Redirect } from 'react-router-dom';
// import { CoreStart } from '../../../../src/core/public';
// import { NavigationPublicPluginStart } from '../../../../src/plugins/navigation/public';
import { getCore, getHistory } from '../plugin-services';
import { Steps } from './steps';
import { FlyoutForm } from './flyout';

// Commented because it gives linting error
// interface WazuhRulesetAppDeps {
//   basename: string;
//   notifications: CoreStart['notifications'];
//   http: CoreStart['http'];
//   navigation: NavigationPublicPluginStart;
// }

interface ViewInterface {
  name: string;
  id: string;
  render: () => React.ReactNode;
}

const views: ViewInterface[] = [
  {
    name: 'Integrations',
    id: 'integrations',
    render: Steps,
  },
  {
    name: 'Rules',
    id: 'rules',
    render: () => <FlyoutForm title={'Metadata'} />,
  },
  {
    name: 'Decoders',
    id: 'decoders',
    render: () => (
      <>
        <Steps />
        <FlyoutForm title={'Metadata'} />
      </>
    ),
  },
  {
    name: 'KVDB',
    id: 'kvdb',
    render: () => <div>KVDBs</div>,
  },
];

// Commented because it gives linting error
// export const WazuhRulesetApp = ({
//   basename,
//   notifications,
//   http,
//   navigation,
// }: WazuhRulesetAppDeps) => {
export const WazuhRulesetApp = () => {
  const history = getHistory();
  const [currentTab, setCurrentTab] = useState('');

  useEffect(() => {
    setCurrentTab(history.location.pathname);
  }, []);

  const sideNav = [
    {
      name: 'Ruleset',
      id: 'wazuhRuleset',
      items: views.map(item => {
        return {
          ...item,
          onClick: () => {
            history.push(`${item.id}`);
            setCurrentTab(item.id);
          },
          isSelected:
            item.id === currentTab ||
            history.location.pathname === `/${item.id}`,
        };
      }),
    },
  ];

  // Render the application DOM.
  // Note that `navigation.ui.TopNavMenu` is a stateful component exported on the `navigation` plugin's start contract.
  return (
    <Router history={history}>
      <I18nProvider>
        <>
          {/* <EuiPage restrictWidth='1000px'> */}
          <EuiPage>
            <EuiPageSideBar>
              <EuiSideNav aria-label='Ruleset' items={sideNav} />
            </EuiPageSideBar>
            <EuiPageBody component='main'>
              <EuiPanel paddingSize='l'>
                <Switch>
                  {views.map(view => (
                    <Route
                      key={view.id}
                      path={`/${view.id}`}
                      component={() => {
                        getCore().chrome.setBreadcrumbs([
                          {
                            className: 'osdBreadcrumbs',
                            text: view.name,
                          },
                        ]);

                        return view.render();
                      }}
                    />
                  ))}
                  <Redirect to={`/${views[0].id}`} />
                </Switch>
              </EuiPanel>
            </EuiPageBody>
          </EuiPage>
        </>
      </I18nProvider>
    </Router>
  );
};
