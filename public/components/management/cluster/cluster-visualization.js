import React from 'react';
import KibanaVis from '../../../kibana-integrations/kibana-vis';
import { withErrorBoundary, withReduxProvider } from '../../../components/common/hocs';
import {compose} from 'redux'

function KibanaVisClass() {
  return (
    <div style={{ height: '100%' }}>
      <KibanaVis visID={this.props.visId} tab={this.props.tab}></KibanaVis>
    </div>
  );
}

export const KibanaVisWrapper = compose(withErrorBoundary, withReduxProvider)(KibanaVisClass);