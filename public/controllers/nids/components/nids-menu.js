import React, { Component, Fragment } from 'react';
import PropTypes from 'prop-types';
import {
  EuiCard,
  EuiIcon,
  EuiPanel,
  EuiFlexItem,
  EuiFlexGroup,
  EuiSpacer,
  EuiText,
  EuiFlexGrid,
  EuiButtonEmpty,
  EuiTitle,
  EuiHealth,
  EuiHorizontalRule,
  EuiPage,
  EuiButton,
  EuiPopover,
  EuiSelect,
  EuiLoadingChart,
  EuiToolTip,
  EuiButtonIcon,
  EuiEmptyPrompt,
  EuiPageBody
} from '@elastic/eui';
import { Pie } from "../../../components/d3/pie";
import { ProgressChart } from "../../../components/d3/progress";
import { NidsTable } from './nids-table';
import KibanaVis from '../../../kibana-integrations/kibana-vis';
import WzReduxProvider from '../../../redux/wz-redux-provider';
import { VisFactoryHandler } from '../../../react-services/vis-factory-handler';
import { AppState } from '../../../react-services/app-state';
import { FilterHandler } from '../../../utils/filter-handler';
import { TabVisualizations } from '../../../factories/tab-visualizations';
import { WazuhConfig } from '../../../react-services/wazuh-config.js';
import { NidsConfig } from '../../../react-services/nids-config.js';
import { WzDatePicker } from '../../../components/wz-date-picker/wz-date-picker';
import { withReduxProvider, withGlobalBreadcrumb, withUserAuthorizationPrompt } from '../../../components/common/hocs';
import { compose } from 'redux';
import { log } from '../../../../server/logger';
import { connect } from 'react-redux';
import { changeTabSelected } from '../../../redux/actions/nidsActions';
// import { AppNavigate } from '../../../react-services/app-navigate'

export const NidsMenu = compose(
  withReduxProvider
)(class NidsMenu extends Component {
    constructor (props) {
        super(props);
        this.state = {
            menuNodes: {},
            nodesTableFilters: []
        }
    }

    async componentDidMount() {
      this.updateMenuNodes();
      // this.router = $injector.get('$route');
    }

    updateMenuNodes() {
      const defaultMenuNodes = {
        nd: {
          id: 'nodes',
          text: 'Nodes',
          isPin: true,
        },
        gr: {
          id: 'groups',
          text: 'Groups',
          isPin: true,
        },
        or: {
          id: 'openrules',
          text: 'OpenRules',
          isPin: true,
        },
        mstr: {
          id: 'master',
          text: 'Master config',
          isPin: true,
        },
        conf: {
          id: 'config',
          text: 'Configuration',
          isPin: true,
        },
      }

      let menuNodes = JSON.parse(window.localStorage.getItem('menuNodes'));

      // Check if pinned modules to agent menu are enabled in Settings/Modules, if not then modify localstorage removing the disabled modules
      // if(menuNodes){
      //   const needUpdateMenuNodes = Object.keys(menuNodes).map(moduleName => menuNodes[moduleName]).reduce((accum, item) => {
      //     if(typeof this.props.extensions[item.id] !== 'undefined' && this.props.extensions[item.id] === false){
      //       delete menuNodes[item.id];
      //       accum = true;
      //     }
      //     return accum;
      //   }, false);
      //   if(needUpdateMenuNodes){
      //     // Update the pinned modules matching to enabled modules in Setings/Modules
      //     window.localStorage.setItem('menuNodes', JSON.stringify(menuNodes))
      //   }
      // }else{
      //   window.localStorage.setItem('menuNodes', JSON.stringify(defaultMenuNodes));
      // }
      window.localStorage.setItem('menuNodes', JSON.stringify(defaultMenuNodes));
      menuNodes = defaultMenuNodes;
      this.setState({ menuNodes: menuNodes});
    }


  render() {
    const menuNodes = [...Object.keys(this.state.menuNodes).map((item) => { 
      return this.state.menuNodes[item] 
    })];

    return (
      <EuiFlexGroup style={{ marginLeft: 5, marginTop: 2 }}>
      {
        menuNodes.map((menuNodes, i) => {
          return (
          <EuiFlexItem key={i} grow={false} style={{ marginLeft: 0, marginTop: 7 }}>
            <EuiButtonEmpty
              onClick={() => {
                this.props.toggleTabSelected(menuNodes.id);
                // window.location.href = `#/nids/?tab=${menuNodes.id}&tabView=${menuNodes.text}`;
                // this.router.reload();
              }} style={{ cursor: 'pointer' }}>
              <span>{menuNodes.text}&nbsp;</span>
            </EuiButtonEmpty>
          </EuiFlexItem>
          )
        }
      )}
      </EuiFlexGroup>
    )
  }
});


const mapStateToProps = state => {
  return {
    tab: state.nidsReducers.tabSelected
  };
};

const mapDispatchToProps = dispatch => {
  return {
    toggleTabSelected: tab => dispatch(changeTabSelected(tab)),
  };
};

export default connect(mapStateToProps,mapDispatchToProps)(NidsMenu);