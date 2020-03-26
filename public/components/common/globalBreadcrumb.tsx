import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import { EuiBreadcrumbs } from '@elastic/eui';
import { connect } from 'react-redux';
import './globalBreadcrumb.less';

class WzGlobalBreadcrumb extends Component {
  props: { state: { breadcrumb: [] } };
  constructor(props) {
    super(props);
    this.props = props;
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
              breadcrumbs={this.props.state.breadcrumb}
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