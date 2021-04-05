import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import { EuiBreadcrumbs, EuiToolTip } from '@elastic/eui';
import { connect } from 'react-redux';
import './globalBreadcrumb.scss';
import { AppNavigate } from '../../../react-services/app-navigate';
import { getAngularModule, getChrome } from '../../../kibana-services';

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
    const container = document.getElementsByClassName('euiBreadcrumbs');
    return (
      <div>
        {!!this.props.state.breadcrumb.length && (
          ReactDOM.createPortal(
            <EuiBreadcrumbs
              className='wz-global-breadcrumb'
              responsive={false}
              truncate={false}
              max={6}
              breadcrumbs={this.props.state.breadcrumb.map(breadcrumb => breadcrumb.agent ? {
                text: (
                  <a
                    style={{ margin: '0px 0px -5px 0px', height: 20 }}
                    className="euiLink euiLink--subdued euiBreadcrumb "
                    onClick={(ev) => { ev.stopPropagation(); AppNavigate.navigateToModule(ev, 'agents', { "tab": "welcome", "agent": breadcrumb.agent.id }); this.router.reload(); }}
                    id="breadcrumbNoTitle"
                  >
                    <EuiToolTip position="top" content={"View agent summary"}>
                      <span>{breadcrumb.agent.name}</span>
                    </EuiToolTip>
                  </a>)
              } : breadcrumb)}
              aria-label="Wazuh global breadcrumbs"
            />,
            container[0])
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