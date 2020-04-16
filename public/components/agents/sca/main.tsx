import React, { Component } from 'react';
import { States } from './index';

export class MainSca extends Component {
  tabs = [
    { id: 'states', name: 'States' },
    { id: 'events', name: 'Events' },
  ]

  buttons = ['settings']

  constructor(props) {
    super(props);
    this.props.loadSection('states');
    this.props.setTabs(this.tabs, this.buttons);
  }

  render() {
    const { selectView } = this.props;
    if (selectView) {
      return (
        <div>
          {selectView === 'states' && <States {...this.props} />}
        </div>
      );
    } else {
      return false;
    }
  }
}
