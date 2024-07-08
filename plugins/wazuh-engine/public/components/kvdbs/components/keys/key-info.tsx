import React from 'react';
import {
  EuiFlexGroup,
  EuiFlexItem,
  EuiFlyoutHeader,
  EuiFlyoutBody,
} from '@elastic/eui';
import { getServices } from '../../../../services';

export const KeyInfo = ({ keys, setKeysRequest }) => {
  const WzListEditor = getServices().WzListEditor;

  return (
    <>
      <EuiFlyoutHeader>
        <EuiFlexGroup>
          <EuiFlexItem grow={false}>View keys of this Database</EuiFlexItem>
        </EuiFlexGroup>
      </EuiFlyoutHeader>
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
