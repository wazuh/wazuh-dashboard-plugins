import React, { Component, Fragment, useState, useEffect } from 'react';
// import PropTypes from 'prop-types';
import {
  EuiBasicTable,
  EuiButton,
  EuiButtonEmpty,
  EuiButtonIcon,
  EuiFlexGroup,
  EuiFlexItem,
  EuiPanel,
  EuiToolTip,
  EuiTitle,
  EuiHealth,
  EuiSpacer,
  EuiCallOut,
  EuiOverlayMask,
  EuiConfirmModal,
  EuiDescribedFormGroup,
  EuiFieldPassword,
  EuiLoadingSpinner,
  EuiFlexGrid,
  EuiFieldText,
  DisplayToggles,
  EuiFormRow,
  EuiComboBox,
  EuiForm
} from '@elastic/eui';
import { NidsRequest } from '../../../react-services/nids-request';
import { saveSelectedTags } from '../../../redux/actions/nidsActions';
import { useSelector, useDispatch } from 'react-redux';

export const AddNodeTags = () => {
  const dispatch = useDispatch();  
  const tags = useSelector(state => state.nidsReducers.tags);
  const [allTags, setTags] = useState([]); //set default tag list
  const [selectedTags, setSelectedTag] = useState([]); //tags selected
  
  useEffect(() => { 
    //filter tags
    filterTags()
  }, []);

  useEffect(() => { 
		var orgsNameToId = []
		Object.entries(selectedTags || {}).map((id) => {
      orgsNameToId.push(id[1].label)
		})
    dispatch(saveSelectedTags(orgsNameToId))
  }, [selectedTags]);

  function filterTags(){
    var tagsFiltered = []
    Object.entries(tags || {}).map((id) => {
      tagsFiltered.push({label: id[1].tagName})
    })
    setTags(tagsFiltered)
  }


  //change tags
  const tagChange = (data) => {
    setSelectedTag(data);
  }

  const onCreateTags = (searchValue, flattenedOptions = []) => {
    const normalizedSearchValue = searchValue.trim().toLowerCase();

    if (!normalizedSearchValue) {
      return;
    }

    const newTag = {
      label: searchValue,
    };

    // Create the option if it doesn't exist.
    if (flattenedOptions.findIndex((option) => option.label.trim().toLowerCase() === normalizedSearchValue) === -1) {
      setTags([...allTags, newTag]);
    }

    // Select the option.
    setSelectedTag([...selectedTags, newTag]);
  };

  return (
    <EuiFlexItem>   
      <EuiFormRow label="Tags">
        <EuiComboBox
          placeholder="Select Tags"
          options={allTags}
          selectedOptions={selectedTags}
          onChange={tagChange}
          onCreateOption={onCreateTags}
          isClearable={true}
          data-test-subj="demoComboBox"
        />
      </EuiFormRow>         
    </EuiFlexItem>
  )
}
