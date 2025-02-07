import React, { useEffect, useState } from 'react';
import { I18nProvider } from '@osd/i18n/react';
import {
  EuiPage,
  EuiPageBody,
  EuiPageSideBar,
  EuiSideNav,
  EuiPanel,
} from '@elastic/eui';
import { Router, Route, Switch, Redirect } from 'react-router-dom';
import NavigationService from '../react-services/navigation-service';
import { summaryAgent, views } from './common/views';
import { RouteComponent } from './common/route-component';

export interface FleetManagementProps {
  indexPattern: any;
  // useTimeFilter: any;
}

export const FleetManagement = ({ ...restProps }: FleetManagementProps) => {
  const navigationService = NavigationService.getInstance();
  const history = navigationService.getHistory();
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
      name: 'Fleet Management',
      id: 'fleet-management',
      items: views
        .filter(view => view.renderOnMenu)
        .map(item => ({
          id: item.id,
          name: item.name,
          onClick: () => {
            NavigationService.getInstance().navigate(item.path);
            setCurrentTab(item.path);
          },
          isSelected: item.path === currentTab,
        })),
    },
  ];

  return (
    <Router history={history}>
      <I18nProvider>
        <EuiPage>
          {renderMenu && (
            <EuiPageSideBar>
              <EuiSideNav
                aria-label='Fleet'
                items={sideNav}
                isOpenOnMobile={isSideNavOpenOnMobile}
                toggleOpenOnMobile={() => toggleOpenOnMobile()}
              />
            </EuiPageSideBar>
          )}
          <EuiPageBody>
            <EuiPanel paddingSize='l'>
              <Switch>
                {views.map(view => (
                  <Route
                    key={view.id}
                    path={`${view.path}`}
                    exact
                    render={() => (
                      <RouteComponent
                        view={view}
                        restProps={restProps}
                        setRenderMenu={setRenderMenu}
                      />
                    )}
                  />
                ))}
                <Redirect to={summaryAgent.path} />
              </Switch>
            </EuiPanel>
          </EuiPageBody>
        </EuiPage>
      </I18nProvider>
    </Router>
  );
};
