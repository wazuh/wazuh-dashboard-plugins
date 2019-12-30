import React, { Component, Fragment } from "react";
import Proptypes from "prop-types";

import {
  EuiGlobalToastList
} from "@elastic/eui";

let addToastHandler, removeToastHandler, removeAllToastsHandler;

export const addToast = (toast) => addToastHandler(toast);
export const removeToast = (toast) => removeToastHandler(toast);
export const removeAllToasts = (toast) => removeAllToastsHandler(toast);

let toastID = 0;

class WzToastProvider extends Component{
  constructor(props){
    super(props);
    this.state = {
      toasts : []
    }
    addToastHandler = this.addToast.bind(this);
    removeToastHandler = this.removeToast.bind(this);
    removeAllToastsHandler = this.removeAllToasts.bind(this);
  }
  addToast(toast){
    this.setState({
      toasts: this.state.toasts.concat({...toast, id: `${toastID++}`})
    })
  }
  removeToast(removedToast){
    this.setState({
      toasts: [...this.state.toasts.filter(toast => toast.id !== removedToast.id)]
    })
  }
  removeAllToasts(){
    this.setState({
      toasts: []
    })
  }
  render(){
    return (
      <EuiGlobalToastList
        toasts={this.state.toasts}
        dismissToast={(t) => this.removeToast(t)}
        toastLifeTimeMs={5000}
      />
    )
  }
}

export default WzToastProvider;