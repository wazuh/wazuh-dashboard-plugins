import React, { Component, Fragment } from 'react';
import { Inventory } from './index';
import { showExploreAgentModal } from '../../../redux/actions/appStateActions';
import { EuiEmptyPrompt, EuiButton } from '@elastic/eui';
import { connect } from 'react-redux';

const mapStateToProps = state => ({
  currentAgentData: state.appStateReducers.currentAgentData
});

const mapDispatchToProps = dispatch => ({
  showExploreAgentModal: show => dispatch(showExploreAgentModal(show))
});

export const MainSca = connect(mapStateToProps, mapDispatchToProps)(class MainSca extends Component {
  tabs = [
    { id: 'inventory', name: 'Inventory' },
    { id: 'events', name: 'Events' },
  ]

  buttons = ['settings']

  constructor(props) {
    super(props);
  }

  showExploreAgentModal(){
    this.props.showExploreAgentModal(true);
  }

  render() {
    const { selectView } = this.props;
    const existsCurrentAgent = this.props.currentAgentData && this.props.currentAgentData.id;
    if (selectView) {
      return (
        <div>
          {selectView === 'inventory' && existsCurrentAgent && <Inventory {...this.props} agent={this.props.currentAgentData} />}
           
          {selectView === 'inventory' && (
            !existsCurrentAgent && !this.props.agent &&
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
});
