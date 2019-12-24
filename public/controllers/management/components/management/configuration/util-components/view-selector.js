import React, { Component, Fragment } from "react";
import Proptypes from "prop-types";

import {
  
} from "@elastic/eui";

class WzViewSelector extends Component{
  constructor(props){
    super(props);
    // this.state = {
    //   view: this.props.children.find(child => child.props.default).props.view
    // }
  }
  // changeView(view){
  //   this.setState({ view })
  // }
  render(){
    // const { view } = this.state;
    const { view, children } = this.props;
    // const child = children.find(child => child.props.view === view) || children.find(child => child.props.default);
    return (
      <Fragment>
        {/* {React.cloneElement(child, {view, changeView})} */}
        {children.find(child => child.props.view === view) || children.find(child => child.props.default)}
      </Fragment>
    )
  }
}

WzViewSelector.propTypes = {
  children: Proptypes.array
}

export default WzViewSelector;