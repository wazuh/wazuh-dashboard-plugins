import React, { useEffect, useState } from 'react'
import { EuiOverlayMask, EuiProgress, EuiText } from '@elastic/eui';

export const RestartModal = (props) => {
  
    const { isRestarting, isCluster } = props;
    const time = isCluster ? 80 : 70;
    const [timeRestarting, setTimeRestarting] = useState(time);

    const clusterOrManager = isCluster ? 'cluster' : 'manager';

    useEffect(() => {
      countDown(timeRestarting)
    },[])

    const countDown = (time) => {
      let countDown = time;
      const interval = setInterval(() => {
        countDown--;
        setTimeRestarting( countDown );
        if (countDown === 0) {
          clearInterval(interval);
        }
      }, 1000);
    }
    
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
           <EuiProgress value={timeRestarting} max={isCluster ? 80 : 70} size="m" color='primary'/>
         </div>
        </EuiOverlayMask>
    )
}