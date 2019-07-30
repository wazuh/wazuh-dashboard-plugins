import React, { Component, Fragment } from 'react';
import PropTypes from 'prop-types';
import {
  EuiTabs,
  EuiTab
} from '@elastic/eui';

export class Tabs extends Component {
  constructor(props) {
    super(props);

    this.tabs = [];
    this.props.tabs.forEach((tab) => {
      this.tabs.push({
        id: tab.id,
        name: tab.name
      });
    });

    this.state = {
      selectedTabId: this.props.selectedTab,
    };
  }

  onSelectedTabChanged = id => {
    this.setState({
      selectedTabId: id,
    });
    this.props.clickAction(id);
  };

  renderTabs() {
    return this.tabs.map((tab, index) => (
      <EuiTab
        onClick={() => this.onSelectedTabChanged(tab.id)}
        isSelected={tab.id === this.state.selectedTabId}
        key={index}>
        {tab.name}
      </EuiTab>
    ));
  }

  render() {
    return (
      <Fragment>
        <EuiTabs>{this.renderTabs()}</EuiTabs>
      </Fragment>
    );
  }
}

Tabs.propTypes = {
  tabs: PropTypes.array,
  selectedTab: PropTypes.string,
  clickAction: PropTypes.func
};
