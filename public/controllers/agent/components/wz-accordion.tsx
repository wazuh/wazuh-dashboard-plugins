import React, { useState } from 'react';
import {
  EuiPanel,
  EuiSpacer,
  EuiAccordion,
  EuiButtonGroup,
  htmlIdGenerator,
} from '@elastic/eui';
import { osButtons } from '../wazuh-config';

export const PrincipalButtonGroup = ({
  legend,
  options,
  idSelected,
  onChange,
}) => {
  return (
    <>
      <EuiButtonGroup
        color='primary'
        legend={legend}
        options={options}
        idSelected={idSelected}
        onChange={onChange}
        className={'osButtonsStyle'}
      />
      <EuiSpacer size='l' />
      <WzAccordion>
        <EuiButtonGroup
          color='primary'
          legend={legend}
          options={osButtons}
          idSelected={idSelected}
          onChange={onChange}
          className={'osButtonsStyle'}
        />
      </WzAccordion>
    </>
  );
};

export const WzAccordion = ({ children }) => {
  const [isAccordionOpen, setIsAccordionOpen] = useState(false);
  const rightArrowAccordionId = htmlIdGenerator('wz-accordion')();
  return (
    <EuiAccordion
      id={rightArrowAccordionId}
      arrowDisplay='left'
      buttonContent={isAccordionOpen ? 'Show less' : 'Show more'}
      onToggle={(isOpen: boolean) => setIsAccordionOpen(isOpen)}
      className={'action-btn-td'}
    >
      <EuiSpacer size='l' />
      <EuiPanel className={'wz-border-none'} color='subdued'>
        {children}
      </EuiPanel>
    </EuiAccordion>
  );
};
