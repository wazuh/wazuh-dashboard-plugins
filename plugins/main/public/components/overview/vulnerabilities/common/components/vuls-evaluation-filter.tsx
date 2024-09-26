import React, { useState, useEffect } from 'react';
import { EuiButtonGroup } from '@elastic/eui';
import {
  FILTER_OPERATOR,
  PatternDataSourceFilterManager,
} from '../../../../common/data-source';
import { Filter } from '../../../../../../../../src/plugins/data/common';
import './vuls-evaluation-filter.scss';

type VulsEvaluatedFilterProps = {
  setValue: (underEvaluation: boolean | null) => void;
  value: boolean | null;
};

const UNDER_EVALUATION_FIELD = 'wazuh.vulnerability.under_evaluation';

export const getUnderEvaluationFilterValue = (
  filters: Filter[],
): boolean | null => {
  const underEvaluationFilter = filters.find(
    f => f.meta?.key === UNDER_EVALUATION_FIELD,
  );
  if (underEvaluationFilter) {
    return underEvaluationFilter.meta?.params.query as boolean;
  }
  return null;
};

export const excludeUnderEvaluationFilter = (filters: Filter[]): Filter[] => {
  return filters.filter(f => f.meta?.key !== UNDER_EVALUATION_FIELD);
};

export const createUnderEvaluationFilter = (
  underEvaluation: boolean,
  indexPatternId: string,
): Filter => {
  return PatternDataSourceFilterManager.createFilter(
    FILTER_OPERATOR.IS,
    UNDER_EVALUATION_FIELD,
    underEvaluation,
    indexPatternId,
  );
};

const VulsEvaluationFilter = ({
  setValue,
  value,
}: VulsEvaluatedFilterProps) => {
  const toggleButtons = [
    {
      id: 'evaluated',
      label: 'Evaluated',
    },
    {
      id: 'underEvaluation',
      label: 'Under evaluation',
    },
  ];

  const getDefaultValue = () => {
    if (value === true) {
      return { underEvaluation: true, evaluated: false };
    } else if (value === false) {
      return { underEvaluation: false, evaluated: true };
    } else {
      return {};
    }
  };

  const [toggleIdToSelectedMap, setToggleIdToSelectedMap] = useState(
    getDefaultValue(),
  );

  useEffect(() => {
    setToggleIdToSelectedMap(getDefaultValue());
  }, [value]);

  const handleChange = (optionId: string) => {
    let newToggleIdToSelectedMap = {};
    if (!toggleIdToSelectedMap[optionId]) {
      newToggleIdToSelectedMap = { [optionId]: true };
    }
    setToggleIdToSelectedMap(newToggleIdToSelectedMap);
    if (optionId === 'underEvaluation' && newToggleIdToSelectedMap[optionId]) {
      setValue(true);
    } else if (optionId === 'evaluated' && newToggleIdToSelectedMap[optionId]) {
      setValue(false);
    } else {
      setValue(null);
    }
  };

  return (
    <EuiButtonGroup
      className='button-group-filter'
      type='multi'
      idToSelectedMap={toggleIdToSelectedMap}
      options={toggleButtons}
      onChange={id => handleChange(id)}
      buttonSize='compressed'
    />
  );
};

export default VulsEvaluationFilter;
