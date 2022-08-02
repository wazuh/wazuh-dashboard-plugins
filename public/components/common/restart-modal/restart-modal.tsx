import React from 'react'
import { EuiOverlayMask, EuiProgress, EuiText } from '@elastic/eui';

export const RestartModal = (props) => {
    
    const { isRestarting, isCluster, timeRestarting } = props;

    const clusterOrManager = isCluster ? 'cluster' : 'manager';
    
    return (
        <EuiOverlayMask>
           <div className='wz-modal-restart'>  
             <EuiText>
                <h2 className='wz-margin-10'>{isRestarting ? `Restarting ${clusterOrManager}, please wait.` : `Wazuh could not be recovered.` }</h2>              
              {
                isRestarting &&
                <p className='wz-margin-10 wz-padding-bt-5'>
                  {timeRestarting} seconds left to restart {clusterOrManager}
                </p>
              }
             </EuiText>
           <EuiProgress value={timeRestarting} max={60} size="m" color='primary'/>
         </div>
        </EuiOverlayMask>
    )
}