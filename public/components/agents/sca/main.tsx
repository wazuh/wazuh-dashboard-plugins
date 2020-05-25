import React, { Component, Fragment } from 'react';
import { Inventory } from './index';
import  store  from '../../../redux/store';
import { showExploreAgentModal } from '../../../redux/actions/appStateActions';
import { EuiEmptyPrompt, EuiButton } from '@elastic/eui';

export class MainSca extends Component {
  tabs = [
    { id: 'inventory', name: 'Inventory' },
    { id: 'events', name: 'Events' },
  ]

  buttons = ['settings']

  constructor(props) {
    super(props);
    this.state = { }
  }
  
  componentDidUpdate(){
    if(store.getState().appStateReducers.currentAgentData.id !== this.state.currentAgentId){
      if(this.props.selectView === 'inventory' && this.state.currentAgentId){
        console.log("eooo")
        this.setState({currentAgentId: false})
      }else{
        this.setState({currentAgentId: store.getState().appStateReducers.currentAgentData.id, agentData:  store.getState().appStateReducers.currentAgentData }  );
      }
    }
  }

  showExploreAgentModal(){
    store.dispatch(showExploreAgentModal(true));
  }

  render() {
    const { selectView } = this.props;
    if (selectView) {
      return (
        <div>
          {selectView === 'inventory' && this.state.currentAgentId && <Inventory {...this.props} agent={this.state.agentData} />}
           
          {selectView === 'inventory' && (
            !this.state.currentAgentId && !this.props.agent &&
            (<EuiEmptyPrompt
              iconType="watchesApp"
              title={<h2>No agent is selected</h2>}
              body={
                <Fragment>
                  <p>
                    You need to select an agent to see Security Configuration Assessment inventory.
                  </p>
                </Fragment>
              }
              actions={
                <EuiButton color="primary" fill onClick={() => this.showExploreAgentModal()}>
                  Select agent
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
