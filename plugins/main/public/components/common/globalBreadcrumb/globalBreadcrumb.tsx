import React, { Component } from 'react';
import { EuiBreadcrumbs } from '@elastic/eui';
import { connect } from 'react-redux';
import { getAngularModule, getCore } from '../../../kibana-services';
import { itHygiene } from '../../../utils/applications';

class WzGlobalBreadcrumb extends Component {
  props: { state: { breadcrumb: [{ agent; text }] } };
  constructor(props) {
    super(props);
    this.props = props;
  }

  async componentDidMount() {
    const $injector = getAngularModule().$injector;
    this.router = $injector.get('$route');
  }

  crumbs = () => {
    const breadcrumbs = this.props.state.breadcrumb.map(breadcrumb =>
      breadcrumb.agent
        ? {
            className:
              'euiLink euiLink--subdued osdBreadcrumbs wz-vertical-align-middle',
            onClick: ev => {
              ev.stopPropagation();
              getCore().application.navigateToApp(itHygiene.id, {
                path: `#/agents?tab=welcome&agent=${breadcrumb.agent.id}`,
              });
              this.router.reload();
            },
            truncate: true,
            text: breadcrumb.agent.name,
          }
        : {
            ...breadcrumb,
            className: 'osdBreadcrumbs',
          },
    );

    // remove frist breadcrumb if it's empty
    if (breadcrumbs?.[0]?.text === '') {
      breadcrumbs.shift();
    }

    return breadcrumbs;
  };

  render() {
    return (
      <div>
        {!!this.props.state.breadcrumb.length && (
          <EuiBreadcrumbs
            responsive={false}
            truncate={false}
            max={6}
            breadcrumbs={this.crumbs()}
            aria-label='Wazuh global breadcrumbs'
          />
        )}
      </div>
    );
  }
}

const mapStateToProps = state => {
  return {
    state: state.globalBreadcrumbReducers,
  };
};

export default connect(mapStateToProps, null)(WzGlobalBreadcrumb);
