/*
* Wazuh app - React component for registering agents.
* Copyright (C) 2015-2020 Wazuh, Inc.
*
* This program is free software; you can redistribute it and/or modify
* it under the terms of the GNU General Public License as published by
* the Free Software Foundation; either version 2 of the License, or
* (at your option) any later version.
*
* Find more information about this on the LICENSE file.
*/

import withLoading from './loading';
import { getCurrentConfig } from '../utils/wz-fetch';
import { connect } from 'react-redux';
import { compose } from 'redux';

/**
 * 
 * @param {string} agentId 
 * @param {[]} sections 
 * @param {React Component} LoadingComponent 
 * @param {React Component} ErrorComponent 
 * @param {function} throwError 
 */
// const withWzConfig = (agentId, sections, LoadingComponent, ErrorComponent, throwError) => (WrappedComponent) => withLoading(async () => {
//   const currentConfig = await getCurrentConfig(agentId, sections);
//   if(throwError){
//     const error = throwError(currentConfig);
//     if(error){
//       throw error;
//     };
//   }
//   return { currentConfig };
// }, LoadingComponent, ErrorComponent)(WrappedComponent)


const mapDispatchToProps = (dispatch) => ({
  updateWazuhNotReadyYet: (value) => dispatch(updateWazuhNotReadyYet(value))
});

const withWzConfig = (sections) => (WrappedComponent) => 
  compose(
    connect(null, mapDispatchToProps),
    withLoading(async (props) => {
      const currentConfig = await getCurrentConfig(props.agent.id, sections, props.node, props.updateWazuhNotReadyYet);
      // if(throwError){
      //   const error = throwError(currentConfig);
      //   if(error){
      //     throw error;
      //   };
      // }
      return { ...props, currentConfig };
    })
  )(WrappedComponent)

export default withWzConfig;