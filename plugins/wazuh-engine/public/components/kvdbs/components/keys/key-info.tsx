import React from 'react';
import {
  EuiFlexGroup,
  EuiFlexItem,
  EuiButtonIcon,
  EuiFlyoutBody,
} from '@elastic/eui';
import { getServices } from '../../../../services';

export const KeyInfo = ({ keys, setKeysRequest }) => {
  const WzListEditor = getServices().WzListEditor;

  return (
    <>
      <EuiFlyoutBody>
        <EuiFlexGroup>
          <WzListEditor
            listContent={keys}
            clearContent={() => {
              setKeysRequest(false);
            }}
            updateListContent={keys => {
              setKeysRequest(keys);
            }}
          ></WzListEditor>
        </EuiFlexGroup>
      </EuiFlyoutBody>
    </>
  );
};
