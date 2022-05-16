import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import {
  EuiPage,
  EuiFlexGroup,
  EuiFlexItem,
  EuiTabs,
  EuiTab,
  EuiPanel,
  EuiEmptyPrompt,
  EuiSpacer,
} from '@elastic/eui';
import { Router, Route, Switch, Redirect, useHistory, useLocation, useRouteMatch  } from 'react-router-dom';
import { Users } from './users/users';
import { Roles } from './roles/roles';
import { Policies } from './policies/policies';
import { RolesMapping } from './roles-mapping/roles-mapping';
import { withReduxProvider, withGlobalBreadcrumb, withUserAuthorizationPrompt } from '../common/hocs';
import { compose } from 'redux';
import { WAZUH_ROLE_ADMINISTRATOR_NAME } from '../../../util/constants';
import { updateSecuritySection } from '../../redux/actions/securityActions';

const tabs = [
  {
    id: 'users',
    name: 'Users',
    disabled: false,
  },
  {
    id: 'roles',
    name: 'Roles',
    disabled: false,
  },
  {
    id: 'policies',
    name: 'Policies',
    disabled: false,
  },
  {
    id: 'roleMapping',
    name: 'Roles mapping',
    disabled: false,
  },
];

export const WzSecurity = compose(
  withReduxProvider,
  withGlobalBreadcrumb([{ text: '' }, { text: 'Security' }]),
  withUserAuthorizationPrompt(null, [WAZUH_ROLE_ADMINISTRATOR_NAME])
)(() => {
  const history = useHistory();
  const location = useLocation();
  const routeMatch = useRouteMatch();
  const dispatch = useDispatch();
  const LANDING_PAGE_URL = '/overview';
  // // Get the initial tab when the component is initiated
  // const securityTabRegExp = new RegExp(`tab=(${tabs.map(tab => tab.id).join('|')})`);
  // const tab = window.location.href.match(securityTabRegExp);
   
  const [selectedTabId, setSelectedTabId] = useState('users');
  // const [selectedTabId, setSelectedTabId] = useState('users');

  //check current url for select security tab
  useEffect(() => {
    switch(location.pathname) {
      case "/security/users":
        return setSelectedTabId("users");
      case "/security/roles":
        return setSelectedTabId("roles");
      case "/security/policies":
        return setSelectedTabId("policies");
      case "/security/roleMapping":
        return setSelectedTabId("roleMapping");
      case "/security":
        return setSelectedTabId("users");
      default:
        return setSelectedTabId("users");
    }
  },[]);


  // const listenerLocationChanged = () => {
  //   const tab = window.location.href.match(securityTabRegExp);
  //   // setSelectedTabId(tab && tab[1] || 'users')
  // }
  // // This allows to redirect to a Security tab if you click a Security link in menu when you're already in a Security section 
  // useEffect(() => {
  //   window.addEventListener('popstate', listenerLocationChanged)
  //   return () => window.removeEventListener('popstate', listenerLocationChanged);
  // });

  // useEffect(() => {
  //   dispatch(updateSecuritySection(selectedTabId));
  // })


  const onSelectedTabChanged = id => {
    setSelectedTabId(id);    
    useHistory().push(`/security/${id}`)
    // window.location.href = window.location.href.replace(`tab=${selectedTabId}`, `tab=${id}`);
  };

  const renderTabs = () => {
    return tabs.map((tab, index) => (          
      <EuiTab
        // {...(tab.href && { href: tab.href, target: '_blank' })}
        onClick={() => {
          setSelectedTabId(tab.id);  
          history.push(`/security/${tab.id}`)
          // onSelectedTabChanged(tab.id)
        }}
        isSelected={tab.id === selectedTabId}
        // isSelected={tab.id}
        disabled={tab.disabled}
        key={index}>
        {tab.name}
      </EuiTab>
    ));
  };

  return (
    <EuiPage>
      <EuiFlexGroup>
        <EuiFlexItem>
          <EuiTabs>{renderTabs()}</EuiTabs>
          <EuiSpacer size='m'></EuiSpacer>
          {/* {selectedTabId === 'users' &&
            <Users></Users>
          }
          {selectedTabId === 'roles' &&
            <Roles></Roles>
          }
          {selectedTabId === 'policies' &&
            <Policies></Policies>
          }
          {selectedTabId === 'roleMapping' &&
            <RolesMapping></RolesMapping>
          } */}
          <Switch>
            {/* <Route path="/security" render={() => <Users />} /> */}
            <Route path="/security/users" render={() => <Users />} />
            <Route path="/security/roles" render={() => <Roles />} />
            <Route path="/security/policies" render={() => <Policies />} />
            <Route path="/security/roleMapping" render={() => <RolesMapping />} />
            <Redirect exact from="/" to={LANDING_PAGE_URL} />
          </Switch>
        </EuiFlexItem>
      </EuiFlexGroup>
    </EuiPage>

          

  //   <Router history={props.params.history}>
  //   <EuiPage>
  //     <EuiPageBody>
  //       <Switch>
  //         <Route path={LANDING_PAGE_URL} render={() => <MainOverview />} />
  //         <Route path="/health-check" render={() => <HealthCheck />} />
  //         <Route path="/security" render={() => <MainSecurity />} />
  //         <Redirect exact from="/" to={LANDING_PAGE_URL} />
  //       </Switch>
  //     </EuiPageBody>
  //     {/* <WzMenuWrapper/>
  //     <WzAgentSelectorWrapper/>
  //     <ToastNotificationsModal/> */}
  //   </EuiPage>
  // </Router>
  );
});