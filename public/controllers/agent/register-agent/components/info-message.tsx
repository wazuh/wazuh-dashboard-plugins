import React, { useEffect, useState } from 'react';
import { EuiCallOut, EuiLink } from '@elastic/eui';
import { webDocumentationLink } from '../../../../../common/services/web_documentation';
import { getWazuhVersion } from '../services/register-agent-service';

type Props = {
    OS: string,
}

const InfoMessage = (props: Props) => {
  const { OS } = props;
  const [wazuhVersion, setWazuhVersion] = useState('');

  useEffect(() => {
   init();
  }, [])
  
  const init = async () => {
    const wazuhVersion = await getWazuhVersion();
    const appVersionMajorDotMinor = wazuhVersion.split('.').slice(0, 2).join('.');
    setWazuhVersion(appVersionMajorDotMinor);
  }

  return (
    <EuiCallOut
      color='warning'
      className='message'
      iconType='iInCircle'
      title={
        <span>
          Might require some extra installation{' '}
          <EuiLink
            target='_blank'
            href={webDocumentationLink(
              `installation-guide/wazuh-agent/wazuh-agent-package-${OS}.html`,
              wazuhVersion,
            )}
          >
            steps
          </EuiLink>
          .
        </span>
      }
    />
  );
}

export default InfoMessage;
