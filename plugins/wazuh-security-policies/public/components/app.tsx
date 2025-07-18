import React, { useState, useEffect } from 'react';
import { I18nProvider } from '@osd/i18n/react';
import {
  EuiPage,
  EuiPageBody,
  EuiSideNav,
  EuiPageSideBar,
  EuiPanel,
} from '@elastic/eui';
import { Router, Route, Switch, Redirect, useParams } from 'react-router-dom';
import { getCore, getHistory } from '../plugin-services';
import { views } from './common/views';
import '../components/common/common.scss';

export const WazuhSecurityPoliciesApp = () => {
  const history = getHistory();
  const [currentTab, setCurrentTab] = useState('');
  const [renderMenu, setRenderMenu] = useState(true);
  const [isSideNavOpenOnMobile, setIsSideNavOpenOnMobile] = useState(false);

  const toggleOpenOnMobile = () => {
    setIsSideNavOpenOnMobile(!isSideNavOpenOnMobile);
  };

  useEffect(() => {
    setCurrentTab(history.location.pathname);
  }, [history.location.pathname]);

  const sideNav = [
    {
      name: 'Ruleset',
      id: 'wazuhRuleset',
      items: views
        .filter(view => view.renderOnMenu)
        .map(item => ({
          id: item.id,
          name: item.name,
          onClick: () => {
            history.push(`${item.path}`);
            setCurrentTab(item.id);
          },
          isSelected:
            item.id === currentTab ||
            history.location.pathname === `/${item.id}`,
        })),
    },
  ];

  // Render the application DOM.
  // Note that `navigation.ui.TopNavMenu` is a stateful component exported on the `navigation` plugin's start contract.
  return (
    <Router history={history}>
      <I18nProvider>
        <>
          <EuiPage paddingSize='m'>
            {renderMenu && (
              <EuiPageSideBar>
                <EuiSideNav
                  mobileTitle='Ruleset'
                  toggleOpenOnMobile={() => toggleOpenOnMobile()}
                  isOpenOnMobile={isSideNavOpenOnMobile}
                  aria-label='Ruleset'
                  items={sideNav}
                />
              </EuiPageSideBar>
            )}

            <EuiPageBody component='main'>
              <EuiPanel
                paddingSize='none'
                color='transparent'
                hasShadow={false}
                hasBorder={false}
              >
                <Switch>
                  {views.map(view => [
                    <Route
                      key={view.id}
                      path={`${view.path}`}
                      exact
                      component={() => {
                        const { id } = useParams() || null;

                        if (id) {
                          getCore().chrome.setBreadcrumbs(
                            view.breadcrumb(decodeURIComponent(id)),
                          );
                        } else {
                          getCore().chrome.setBreadcrumbs(view.breadcrumb());
                        }

                        if (view.renderMenu) {
                          setRenderMenu(true);
                        } else {
                          setRenderMenu(false);
                        }

                        return view.render();
                      }}
                    />,
                  ])}
                  <Redirect to={`${views[0].path}`} />
                </Switch>
              </EuiPanel>
            </EuiPageBody>
          </EuiPage>
        </>
      </I18nProvider>
    </Router>
  );
};
