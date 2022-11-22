import React, { useState } from 'react';
import { EuiCallOut, EuiSpacer, EuiText, EuiComboBox, EuiComboBoxOptionOption } from '@elastic/eui';

type Props = {
  onChange: (value: string) => void;
  options: EuiComboBoxOptionOption<any>[];
}

const AgentGroup = (props: Props) => {
  const { onChange, options } = props;
  const [groups] = useState(options || []);
  const [selectedGroup, setSelectedGroup] = useState([]);

  const onHandleChange = (e:any) => {
    setSelectedGroup(e);
    onChange(e);
  }

  return (
    <>
      {!groups.length && (
        <>
          <EuiCallOut
            color='warning'
            title='This section could not be configured because you do not have permission to read groups.'
            iconType='iInCircle'
          />
          <EuiSpacer />
        </>
      )}
      <EuiText>
        <p>Select one or more existing groups</p>
        <EuiComboBox
          placeholder={!groups.length ? 'Default' : 'Select group'}
          options={groups}
          selectedOptions={selectedGroup}
          onChange={(e) => onHandleChange(e)}
          isDisabled={!groups.length}
          isClearable={true}
          data-test-subj='demoComboBox'
        />
      </EuiText>
    </>
  );
};

export default AgentGroup;
