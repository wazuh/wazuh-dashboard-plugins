import React from 'react';
import {
  EuiCard,
  EuiIcon,
  EuiButtonEmpty,
  EuiHorizontalRule,
} from '@elastic/eui';
import { PopoverIconButton } from '../../common/components/popover';
import { getHistory } from '../../../plugin-services';

interface CardIntegrationProps {
  image: string;
  title: string;
  description: string;
  isEnable: boolean;
}

export const CardIntegration = (props: CardIntegrationProps) => {
  const history = getHistory();
  const { image = 'logoOpenSearch', title, description, isEnable } = props;
  const buttonIntegrations = [
    {
      id: 'goToDecoder',
      label: 'Go to Decoder',
      color: 'text',
    },
    {
      id: 'goToRules',
      label: 'Go to Rules',
      color: 'text',
    },
    {
      id: 'goToKVDB',
      label: 'Go to KVDB',
      color: 'text',
    },
    {
      id: 'enable/disable',
      label: isEnable ? 'Disable' : 'Enable',
      color: isEnable ? 'danger' : 'primary',
    },
  ];

  const handleNavigation = (path: string) => {
    history.push(path);
  };

  return (
    <>
      <EuiCard
        title={title}
        description={description}
        icon={<EuiIcon type={image} size='xl' />}
        paddingSize='m'
        onClick={() => handleNavigation(`/integrations/${title}`)}
      />
      <PopoverIconButton
        styles={{
          position: 'absolute',
          top: '5px',
          right: '5px',
        }}
      >
        <div>
          {buttonIntegrations.map((button, index) => (
            <span key={button.id}>
              <EuiButtonEmpty size='s' color={button.color}>
                {button.label}
              </EuiButtonEmpty>
              {index < buttonIntegrations.length - 1 && (
                <EuiHorizontalRule margin='none' />
              )}
            </span>
          ))}
        </div>
      </PopoverIconButton>
    </>
  );
};
