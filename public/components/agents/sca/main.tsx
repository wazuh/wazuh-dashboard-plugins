import React, { Component } from 'react';
import { Inventory } from './index';

export class MainSca extends Component {
  tabs = [
    { id: 'inventory', name: 'Inventory' },
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
          {selectView === 'inventory' && <Inventory {...this.props} />}
        </div>
      );
    } else {
      return false;
    }
  }
}
