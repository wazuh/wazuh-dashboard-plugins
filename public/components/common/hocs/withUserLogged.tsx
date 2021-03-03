/*
 * Wazuh app - React HOCs to manage user authorization requirements
 * Copyright (C) 2015-2021 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

import React from "react";
import { useSelector } from 'react-redux';
import { EuiProgress, EuiText,EuiSpacer } from '@elastic/eui';
import { getHttp } from '../../../kibana-services';



export function withUserHasLogged(WrappedComponent){
    return (props)=>{
        const userHasLogged = useSelector((state)=> state.appStateReducers.userHasLogged);
        return userHasLogged?<WrappedComponent {...props}/>: 
        <div className="withUserLogged">
            <img src={getHttp().basePath.prepend('/plugins/wazuh/assets/icon_blue.svg')} className="withUserLogged-logo" alt=""></img>
            <EuiSpacer size="s" />
            <EuiText className="subdued-color">Loading ...</EuiText>
            <EuiSpacer size="s" />
            <EuiProgress className ="withUserLogged-loader" size="xs" color="primary" />
        </div>
    }
} 

