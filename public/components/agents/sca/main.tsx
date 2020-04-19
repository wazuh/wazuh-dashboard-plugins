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
