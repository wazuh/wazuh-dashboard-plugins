import React, { useState } from 'react';
import {
  EuiButton,
  EuiModal,
  EuiModalHeader,
  EuiModalBody,
  EuiOverlayMask,
  EuiModalHeaderTitle,
  EuiFlexGroup,
  EuiFlexItem,
  EuiText,
  EuiPanel,
  EuiFormRow,
  EuiRadio,
  EuiModalFooter,
  EuiButtonEmpty,
} from '@elastic/eui';

interface CreateAssetModal {
  onClose: () => void;
  onClickContinue: (selectedOption: string) => void;
  options: { id: string; label: string; help: string }[];
  defaultOption?: string;
}

type CreateAssetModalButton = CreateAssetModal & {
  buttonLabel: string;
};

const CreateAssetSelectorModal: React.SFC<CreateAssetModal> = ({
  onClose,
  onClickContinue,
  options,
  defaultOption,
}: CreateAssetModal) => {
  const [selectedOption, setSelectedOption] = useState(
    defaultOption || options[0].id,
  );
  return (
    <EuiOverlayMask>
      {/*
      // @ts-ignore */}
      <EuiModal onCancel={onClose} onClose={onClose} maxWidth={600}>
        <EuiModalHeader>
          <EuiModalHeaderTitle>Configuration method</EuiModalHeaderTitle>
        </EuiModalHeader>

        <EuiModalBody>
          <EuiFlexGroup
            gutterSize='m'
            direction='column'
            style={{ margin: '-4px' }}
          >
            <EuiFlexItem grow={false}>
              <EuiText size='s' style={{ marginTop: 0 }}>
                Choose how you would like to create the asset, either using a
                visual editor or file editor.
              </EuiText>
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              <EuiFlexGroup>
                {options.map(option => {
                  const checked = option.id === selectedOption;

                  return (
                    <EuiFlexItem>
                      <EuiPanel
                        className={checked ? 'selected-radio-panel' : ''}
                      >
                        <EuiFormRow helpText={option.help}>
                          <EuiRadio
                            id={option.id}
                            label={option.label}
                            checked={checked}
                            onChange={e => setSelectedOption(option.id)}
                            data-test-subj='createAssetModalVisualRadio'
                          />
                        </EuiFormRow>
                      </EuiPanel>
                    </EuiFlexItem>
                  );
                })}
              </EuiFlexGroup>
            </EuiFlexItem>
          </EuiFlexGroup>
        </EuiModalBody>

        <EuiModalFooter>
          <EuiFlexGroup justifyContent='flexEnd'>
            <EuiFlexItem grow={false}>
              <EuiButtonEmpty
                onClick={onClose}
                data-test-subj='createAssetModalCancelButton'
              >
                Cancel
              </EuiButtonEmpty>
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              <EuiButton
                onClick={() => {
                  onClose();
                  onClickContinue(selectedOption);
                }}
                fill
                data-test-subj='createAssetModalContinueButton'
              >
                Continue
              </EuiButton>
            </EuiFlexItem>
          </EuiFlexGroup>
        </EuiModalFooter>
      </EuiModal>
    </EuiOverlayMask>
  );
};

export const CreateAssetSelectorButton: React.SFC<CreateAssetModalButton> = ({
  buttonLabel,
  options,
  defaultOption,
  onClickContinue,
}: CreateAssetModalButton) => {
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  const onCloseModal = () => setIsModalOpen(false);

  return (
    <>
      <EuiButton
        fill
        onClick={() => {
          setIsModalOpen(state => !state);
        }}
      >
        {buttonLabel}
      </EuiButton>
      {isModalOpen && (
        <CreateAssetSelectorModal
          onClose={onCloseModal}
          onClickContinue={onClickContinue}
          options={options}
          defaultOption={defaultOption}
        ></CreateAssetSelectorModal>
      )}
    </>
  );
};
