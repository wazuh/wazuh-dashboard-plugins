import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  EuiPageHeader,
  EuiFieldText,
  EuiButtonEmpty,
  EuiButton,
  EuiHorizontalRule,
  EuiSteps,
  EuiSelect,
  EuiFlexGroup,
  EuiFlexItem,
} from '@elastic/eui';
import { set, cloneDeep } from 'lodash';
import convert from 'xml-js';
import { PopoverIconButton } from '../components/popover';
import { getAppUrl } from '../../utils/get-app-url';
import { capitalizeFirstLetter } from '../../utils/capitalize-first-letter';
import { metadataInitialValues } from '../../rules/schemas/metadata.schema';
import { RenderStepPanel } from '../components/render-steps';
import { XMLEditor } from '../components/xml-editor';

const getAvailableOptions = selectedSteps => {
  const baseOptions = [
    { value: 'Select step', text: 'Select step' },
    { value: 'check', text: 'Check' },
    { value: 'parse', text: 'Parse' },
    { value: 'normalize', text: 'Normalize' },
    { value: 'allow', text: 'Allow' },
    { value: 'outputs', text: 'Outputs' },
    { value: 'definitions', text: 'Definitions' },
  ];

  if (
    selectedSteps.includes('check') ||
    selectedSteps.includes('parse') ||
    selectedSteps.includes('normalize')
  ) {
    return baseOptions.filter(
      option => !['allow', 'outputs', ...selectedSteps].includes(option.value),
    );
  }

  if (selectedSteps.includes('outputs')) {
    return baseOptions.filter(
      option =>
        !['normalize', 'parse', ...selectedSteps].includes(option.value),
    );
  }

  if (selectedSteps.includes('allow')) {
    return baseOptions.filter(
      option =>
        !['check', 'normalize', ...selectedSteps].includes(option.value),
    );
  }

  return baseOptions;
};

export const CreateTemplate = () => {
  const cloneInitialValues = cloneDeep(metadataInitialValues);
  const [onXml, setOnXml] = useState(false);
  const [stepsToRender, setstepsToRender] = useState(['metadata']);
  const [item, setItem] = useState(cloneInitialValues);
  const [addStep, setAddStep] = useState(
    getAvailableOptions(stepsToRender)?.[0]?.value,
  );
  const view = getAppUrl();

  const handleSetItem = ({
    newValue,
    key,
  }: {
    newValue: string | boolean | object;
    key: string;
  }) => {
    setItem(prevItem => {
      const newItem = { ...prevItem };

      set(newItem, key, newValue);

      return newItem;
    });
  };

  const buttonsPopover = [
    {
      id: 'editOnFormOrXML',
      label: onXml ? 'Edit on form' : 'Edit on XML',
      color: 'text',
      onClick: () => setOnXml(!onXml),
    },
    {
      id: 'enable/disable',
      label: item?.enable ? 'Disable' : 'Enable',
      color: item?.enable ? 'danger' : 'primary',
      onClick: () => {
        handleSetItem({
          newValue: !item?.enable,
          key: 'enable',
        });
      },
    },
    {
      id: 'testItem',
      label: `Test ${view}`,
      color: 'text',
      onClick: () => {},
    },
    {
      id: 'setSaveAsDraft',
      label: useParams()?.id ? 'Save as Draft' : 'Set as draft',
      color: 'text',
      onClick: () =>
        handleSetItem({
          newValue: 'draft',
          key: 'status',
        }),
    },
  ];
  const buttons = [
    <PopoverIconButton key='more-item'>
      <div>
        {buttonsPopover.map((button, index) => (
          <span key={button.id}>
            <EuiButtonEmpty
              size='s'
              color={button.color}
              onClick={button.onClick}
            >
              {button.label}
            </EuiButtonEmpty>
            {index < buttonsPopover.length - 1 && (
              <EuiHorizontalRule margin='none' />
            )}
          </span>
        ))}
      </div>
    </PopoverIconButton>,
    <EuiButton
      size='s'
      key='save-item'
      color='primary'
      fill
      onClick={() =>
        console.log(
          Object.fromEntries(
            Object.entries(item).filter(
              ([key]) =>
                [
                  ...stepsToRender.filter(step => step !== 'parse'),
                  'name',
                  'status',
                  'enable',
                ].includes(key) || key.startsWith('parse|'),
            ),
          ),
        )
      }
    >
      Save
    </EuiButton>,
    <EuiButton
      size='s'
      key='cancel-item'
      color='danger'
      onClick={() => history.back()}
    >
      Cancel
    </EuiButton>,
  ];

  const addStepRender = () => {
    setstepsToRender([...stepsToRender, addStep]);
  };

  const steps = stepsItems => {
    const stepsArray = stepsToRender.map(stepName => ({
      title: capitalizeFirstLetter(stepName),
      children: (
        <RenderStepPanel
          step={{ key: stepName, value: stepsItems[stepName], handleSetItem }}
        />
      ),
    }));
    const optionsToSelect = getAvailableOptions(stepsToRender);

    if (optionsToSelect.length > 1) {
      stepsArray.push({
        title: 'Add step',
        children: (
          <EuiFlexGroup direction='row'>
            <EuiFlexItem grow={5}>
              <EuiSelect
                id='addStep'
                hasNoInitialSelection
                options={optionsToSelect}
                value={addStep}
                compressed
                fullWidth
                onChange={event => setAddStep(event.target.value)}
                placeholder='Select next step'
              />
            </EuiFlexItem>
            <EuiFlexItem>
              <EuiButton
                size='s'
                onClick={addStepRender}
                isDisabled={addStep === optionsToSelect[0].value}
              >
                Add step
              </EuiButton>
            </EuiFlexItem>
          </EuiFlexGroup>
        ),
      });
    }

    return stepsArray;
  };

  return (
    <>
      <EuiPageHeader
        pageTitle={
          <EuiFieldText
            placeholder={`${capitalizeFirstLetter(view)} name`}
            value={item.name}
            style={{ display: 'flex' }}
            compressed
            onChange={event =>
              handleSetItem({
                newValue: event.target.value,
                key: 'name',
              })
            }
          />
        }
        bottomBorder={true}
        alignItems='center'
        rightSideGroupProps={{
          alignItems: 'center',
        }}
        rightSideItems={buttons}
      />
      {onXml ? (
        <XMLEditor
          data={item}
          onChange={value => {
            console.log('Check', value);
          }}
        />
      ) : (
        <EuiSteps
          className='steps-details'
          status='incomplete'
          steps={steps(
            typeof item === 'string' ? convert.xml2json(item) : item,
          )}
        />
      )}
    </>
  );
};
