import React from 'react';
import WzConfigurationAlerts from './alerts';
import { shallow } from 'enzyme';
import { Provider } from 'react-redux';
import configureMockStore from 'redux-mock-store';

jest.mock('../../../../../../kibana-services', () => ({
    getUiSettings:() => ({
        get:() => {
            return false
        }
    }),
}));

const mockProps = {
    "clusterNodeSelected":"master-node",
    "agent":{
       "id":"000"
    },
    "refreshTime":false,
    "currentConfig":{
       "analysis-alerts":{
          "alerts":{
             "email_alert_level":12,
             "log_alert_level":3
          }
       },
       "analysis-labels":{
          "labels":[
             
          ]
       },
       "mail-alerts":"Fetch configuration. 3013 - Error connecting with socket",
       "monitor-reports":{
          
       },
       "csyslog-csyslog":"Fetch configuration. 3013 - Error connecting with socket"
    },
    "wazuhNotReadyYet":""
 }


const mockStore = configureMockStore();
const store = mockStore({});

describe('WzConfigurationAlerts component mount OK', () => {

  it('renders correctly to match the snapshot', () => {
    const wrapper = shallow(
        <Provider store={store}>
            <WzConfigurationAlerts {...mockProps} /> 
        </Provider>
        );
    expect(wrapper).toMatchSnapshot();
  });

});