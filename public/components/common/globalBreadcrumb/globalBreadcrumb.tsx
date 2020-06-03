import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import { EuiBreadcrumbs, EuiToolTip } from '@elastic/eui';
import { connect } from 'react-redux';
import './globalBreadcrumb.less';
import chrome from 'ui/chrome';
import { AppNavigate } from '../../../react-services/app-navigate';
import { getServices } from 'plugins/kibana/discover/kibana_services';


class WzGlobalBreadcrumb extends Component {
  props: { state: { breadcrumb: [] } };
  constructor(props) {
    super(props);
    this.props = props;
    this.navigation = [];
    window.innerDocClick = true;
  }

  
  async componentDidMount() {
    const $injector = await chrome.dangerouslyGetActiveInjector();
    this.router = $injector.get('$route');
    $('#breadcrumbNoTitle').attr("title","");

    document.onmouseover = function() {
      //User's mouse is inside the page.
      window.innerDocClick = true;
    }
    document.getElementsByTagName('body')[0].addEventListener('mouseleave',function() {
      //User's mouse has left the page.
      window.innerDocClick = false;
    });
    window.onhashchange = (e) => {
      e.preventDefault();
        if (window.innerDocClick) {
        } else {
          if(this.navigation.length > 1){
            this.navigatingFrom = this.navigation[this.navigation.length-1];
            window.innerDocClick = true;
            window.location.href = this.navigation[this.navigation.length-2];
            this.navigation.pop();
            this.navigation.pop();
          }
        }
      }
  }

  componnedDidUpdate(){
    $('#breadcrumbNoTitle').attr("title","");
  }

  render() {
    const container = document.getElementsByClassName('euiBreadcrumbs');
    const newNavigation = this.props.state.breadcrumb.length ? this.props.state.breadcrumb[this.props.state.breadcrumb.length-1] : false;
 
    if(newNavigation && newNavigation["navigation"] ){
      if(this.navigation.length > 50){
        this.navigation.splice(0,10);
      }
      const exists= this.navigation.indexOf(newNavigation["navigation"]);
      if(exists > -1){
        this.navigation.splice(exists,1)
      }
      
      if(this.navigatingFrom !== newNavigation["navigation"]){
        this.navigation.push(newNavigation["navigation"])
      }
      else
        this.navigatingFrom = ""
    }

    return (
      <div>
        {!!this.props.state.breadcrumb.length && (
          ReactDOM.createPortal(
            <EuiBreadcrumbs
              className='wz-global-breadcrumb'
              responsive={false}
              truncate={false}
              max={6}
              showMaxPopover
              breadcrumbs={this.props.state.breadcrumb.map(breadcrumb => breadcrumb.agent ? {
                text: (
                  <a 
                    style={{marginRight: 0, marginBottom: 3 }}
                    className="euiLink euiLink--subdued euiBreadcrumb"
                    onClick={(ev) =>  {ev.stopPropagation(); AppNavigate.navigateToModule(ev, 'agents', {"tab": "welcome", "agent": breadcrumb.agent.id  } ); this.router.reload();}}
                    id="breadcrumbNoTitle"
                    >
                    <EuiToolTip position="top" content={"View agent summary"}>
                      <span>{breadcrumb.agent.name}</span>
                    </EuiToolTip>
                  </a> )
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