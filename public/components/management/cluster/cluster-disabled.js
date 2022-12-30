import React, { Component, Fragment } from 'react';
import { EuiPage, EuiPageContent, EuiEmptyPrompt } from '@elastic/eui';
import { withErrorBoundary } from '../../common/hocs'
import { webDocumentationLink } from '../../../../common/services/web_documentation';
import { i18n } from '@kbn/i18n';
const Descp1 = i18n.translate("components.addModule.guide.Descp1", {
  defaultMessage: "'The cluster is disabled'",
});
const Descp2 = i18n.translate("components.addModule.guide.Descp2", {
  defaultMessage: "The cluster is not running",
});
export const ClusterDisabled = withErrorBoundary (class ClusterDisabled extends Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  render() {
    return (
      <EuiEmptyPrompt
        iconType="iInCircle"
        title={
          <h2>
            {!this.props.enabled
              ? 
              : !this.props.running
              ? Descp1
              : Descp2}
          </h2>
        }
        body={
          <Fragment>
            {!this.props.enabled && (
              <p>{
  i18n.translate("components.manage.cluster.visit on", {
    defaultMessage: "Visit the documentation on",
  });
}
                {' '}
                <a href={webDocumentationLink('user-manual/configuring-cluster/index.html')}>
                  this link
                </a>{' '}{
  i18n.translate("components.manage.cluster.enableit", {
    defaultMessage: "to learn about how to enable it.",
  });
}
                
              </p>
            )}
            {!this.props.running && (
              <p>{
  i18n.translate("components.manage.cluster.running", {
    defaultMessage: "The cluster is enabled but it is not running.",
  });
}</p>
            )}
          </Fragment>
        }
      />
    );
  }
})
