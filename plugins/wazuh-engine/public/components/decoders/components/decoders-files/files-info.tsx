import React, { useEffect, useState } from 'react';
import _ from 'lodash';
import {
  EuiPage,
  EuiPanel,
  EuiFlexGroup,
  EuiFlexItem,
  EuiToolTip,
  EuiButtonIcon,
  EuiFieldText,
  EuiSpacer,
  EuiTitle,
} from '@elastic/eui';
import { FileViewer } from '../../../../common/assets/file-viewer';
import { ResourcesHandler } from '../../../../controllers/resources-handler';
import { getServices } from '../../../../services';

export const DecodersFile = ({ type, name, version }) => {
  const fileName = `${type}${name}${version}`;
  const navigationService = getServices().navigationService;
  const resourcesHandler = new ResourcesHandler('decoders');
  const [content, setContent] = useState(false);

  //Get file content
  useEffect(() => {
    const fetchData = async () => {
      setContent(await resourcesHandler.getFileContent(fileName, ''));
    };
    fetchData();
  }, []);

  return (
    <>
      <EuiPage style={{ background: 'transparent' }}>
        <EuiPanel>
          <EuiFlexGroup>
            <EuiFlexItem>
              {(!content && (
                <EuiFlexGroup>
                  <EuiFlexItem grow={false}>
                    <EuiToolTip position='right' content={`Back to decoders`}>
                      <EuiButtonIcon
                        aria-label='Back'
                        color='primary'
                        iconSize='l'
                        iconType='arrowLeft'
                        onClick={() => {}}
                      />
                    </EuiToolTip>
                  </EuiFlexItem>
                  <EuiFlexItem>
                    <EuiFieldText
                      style={{ width: '300px' }}
                      placeholder={`Type your new decoders file name here`}
                      aria-label='aria-label to prevent react warning'
                    />
                  </EuiFlexItem>
                </EuiFlexGroup>
              )) || (
                <EuiTitle>
                  <span style={{ fontSize: '22px' }}>
                    <EuiToolTip position='right' content={`Back to decoders`}>
                      <EuiButtonIcon
                        aria-label='Back'
                        color='primary'
                        iconSize='l'
                        iconType='arrowLeft'
                        onClick={() => {
                          navigationService
                            .getInstance()
                            .navigate(`/engine/decoders`);
                        }}
                      />
                    </EuiToolTip>
                    {`${type}/${name}/${version}`}
                  </span>
                </EuiTitle>
              )}
            </EuiFlexItem>
            <EuiFlexItem />
          </EuiFlexGroup>
          <EuiSpacer size='m' />
          <EuiFlexGroup>
            <EuiFlexItem>
              <EuiFlexGroup>
                <EuiFlexItem>
                  <FileViewer content={content ? content : ''} />
                </EuiFlexItem>
              </EuiFlexGroup>
            </EuiFlexItem>
          </EuiFlexGroup>
        </EuiPanel>
      </EuiPage>
    </>
  );
};
