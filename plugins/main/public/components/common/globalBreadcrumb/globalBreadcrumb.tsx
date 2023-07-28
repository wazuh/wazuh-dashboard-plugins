import React, { Component } from 'react';
import { EuiBreadcrumbs } from '@elastic/eui';
import { connect } from 'react-redux';
import './globalBreadcrumb.scss';
import { AppNavigate } from '../../../react-services/app-navigate';
import { getAngularModule } from '../../../kibana-services';

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
    const breadcrumbs = this.props.state.breadcrumb.map((breadcrumb) =>
      breadcrumb.agent
        ? {
            className: 'euiLink euiLink--subdued osdBreadcrumbs',
            onClick: (ev) => {
              ev.stopPropagation();
              AppNavigate.navigateToModule(ev, 'agents', {
                tab: 'welcome',
                agent: breadcrumb.agent.id,
              });
              this.router.reload();
            },
            truncate: true,
            text: breadcrumb.agent.name,
          }
        : {
            ...breadcrumb,
            className: 'osdBreadcrumbs',
          }
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
            className="wz-global-breadcrumb"
            responsive={false}
            truncate={false}
            max={6}
            breadcrumbs={this.crumbs()}
            aria-label="Wazuh global breadcrumbs"
          />
        )}
      </div>
    );
  }
}

const mapStateToProps = (state) => {
  return {
    state: state.globalBreadcrumbReducers,
  };
};

export default connect(mapStateToProps, null)(WzGlobalBreadcrumb);
