import React from 'react';
import KibanaVis from '../../../kibana-integrations/kibana-vis';
import { withErrorBoundary, withReduxProvider } from '../../../components/common/hocs';
import { compose } from 'redux';

export const KibanaVisWrapper = compose(
  withErrorBoundary,
  withReduxProvider
)((props) => {
  return (
    <div style={{ height: '100%' }}>
      <KibanaVis visID={props.visId} tab={props.tab}></KibanaVis>
    </div>
  );
});