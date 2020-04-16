import React, { Component, Fragment } from 'react';
import { Events, Dashboard, Loader } from '../../common/modules';

export class MainGeneral extends Component {
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
    const { selectView } = this.props;
    if (selectView) {
      return (
        <Fragment>
          <div className='wz-module-body'>
            {selectView === 'events' && <Events {...this.props} />}
            {selectView === 'loader' &&
              <Loader {...this.props}
                loadSection={(section) => this.props.loadSection(section)}
                redirect={this.props.afterLoad}>
              </Loader>}
            {selectView === 'dashboard' && <Dashboard {...this.props} />}
          </div>
        </Fragment>
      );
    } else {
      return false;
    }
  }
}
