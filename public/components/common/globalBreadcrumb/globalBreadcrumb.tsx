import React, { Component } from 'react';
import { EuiBreadcrumbs, EuiToolTip } from '@elastic/eui';
import { connect } from 'react-redux';
import './globalBreadcrumb.scss';
import { AppNavigate } from '../../../react-services/app-navigate';
import { getAngularModule } from '../../../kibana-services';

class WzGlobalBreadcrumb extends Component {
  props: { state: { breadcrumb: [] } };
  constructor(props) {
    super(props);
    this.props = props;
  }

  async componentDidMount() {
    const $injector = getAngularModule().$injector;
    this.router = $injector.get('$route');
    $('#breadcrumbNoTitle').attr("title", "");
  }
  componnedDidUpdate() {
    $('#breadcrumbNoTitle').attr("title", "");
  }
  render() {
    return (
      <div>
        {!!this.props.state.breadcrumb.length && (
          <EuiBreadcrumbs
            className='wz-global-breadcrumb'
            responsive={false}
            truncate={false}
            max={6}
            breadcrumbs={this.props.state.breadcrumb.map(breadcrumb => breadcrumb.agent ? {
              className: "euiLink euiLink--subdued ",
              onClick: (ev) => {
                ev.stopPropagation();
                AppNavigate.navigateToModule(ev, 'agents', {
                  "tab": "welcome", "agent": breadcrumb.agent.id
                });
                this.router.reload();
              },
              id: "breadcrumbNoTitle",
              truncate: true,
              text: (
                <EuiToolTip position="top" content={"View agent summary"}>
                  <span>{breadcrumb.agent.name}</span>
                </EuiToolTip>
              )
            } : breadcrumb)}
            aria-label="Wazuh global breadcrumbs"
          />
        )}
      </div>
    )
  }
}

const mapStateToProps = state => {
  return {
    state: state.globalBreadcrumbReducers,
  };
};

export default connect(mapStateToProps, null)(WzGlobalBreadcrumb);
