import React, { Component } from 'react';
import { Events, Dashboard, Loader } from '../../common/modules';

export class MainPm extends Component {
  tabs = [
    { id: 'events', name: 'Events' },
  ]
  buttons = ['dashboard', 'reporting']

  constructor(props) {
    super(props);
    this.props.loadSection('dashboard');
    this.props.setTabs(this.tabs, this.buttons);
  }

  render() {
    return false;
  }
}
