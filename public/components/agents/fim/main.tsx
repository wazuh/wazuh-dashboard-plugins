import React, { Component, Fragment } from 'react';
import { Inventory } from './index';
import '../../common/modules/module.less';
import  store  from '../../../redux/store';
import { EuiEmptyPrompt, EuiButton } from '@elastic/eui';


export class MainFim extends Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  componentDidUpdate(){
    if(store.getState().appStateReducers.currentAgentId !== this.state.currentAgentId){
      this.setState({currentAgentId: store.getState().appStateReducers.currentAgentId, agentData: {os: {"platform": "linux"}, agentPlatform: "linux", id: store.getState().appStateReducers.currentAgentId }  })
    }
  }

  render() {
    const { selectView } = this.props;
    if (selectView) {
      return (
        <div>
          {selectView === 'inventory' && (
            this.state.currentAgentId &&
            <Inventory {...this.props} agent={this.state.agentData}
            />)}


          {selectView === 'inventory' && (
            this.props.agent &&
            <Inventory {...this.props} agent={this.props.agent}
            />)}

            
            
          {selectView === 'inventory' && (
            !this.state.currentAgentId && !this.props.agent &&
            (<EuiEmptyPrompt
              iconType="editorStrike"
              title={<h2>You need to select an agent</h2>}
              body={
                <Fragment>
                  <p>
                    bla bla
                  </p>
                  <p>bla bla</p>
                </Fragment>
              }
              actions={
                <EuiButton color="primary" fill>
                  Select an agent
                </EuiButton>
              }
            />)) 
            }
        </div>
      );
    } else {
      return false;
    }
  }
}
