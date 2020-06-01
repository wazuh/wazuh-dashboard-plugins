import React, { Component } from 'react';
import WzReduxProvider from '../../../redux/wz-redux-provider';
import KibanaVis from '../../../kibana-integrations/kibana-vis';

export class KibanaVisWrapper extends Component {
  constructor(props) {
    super(props);
    this.state = {};
  }


  render() {
    return (
      <div style={{ height: '100%' }}>
        <WzReduxProvider>
          <KibanaVis
            visID={this.props.visId}
            tab={this.props.tab}></KibanaVis>
        </WzReduxProvider>
      </div>
    );
  }
}
