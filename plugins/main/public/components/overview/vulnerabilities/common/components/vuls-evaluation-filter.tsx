import React, { useState, useEffect } from 'react';
import { i18n } from '@osd/i18n';
import { EuiButtonGroup } from '@elastic/eui';
import {
  FILTER_OPERATOR,
  PatternDataSourceFilterManager,
} from '../../../../common/data-source';
import { Filter } from '../../../../../../../../src/plugins/data/common';

type VulsEvaluatedFilterProps = {
  setValue: (underEvaluation: boolean | null) => void;
  value: boolean | null;
};

export const UNDER_EVALUATION_FIELD = 'vulnerability.under_evaluation';

export const getUnderEvaluationFilterValue = (
  underEvaluationFilter: Filter,
): boolean | null => {
  if (underEvaluationFilter) {
    const value = underEvaluationFilter.meta?.params?.query as boolean;
    return underEvaluationFilter.meta?.negate ? !value : (value as boolean);
  }
  return null;
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
      label: i18n.translate(
        'wazuh.vulnerabilityDetection.evaluationFilter.evaluated',
        {
          defaultMessage: 'Evaluated',
        },
      ),
      className: 'keep-for-report',
    },
    {
      id: 'underEvaluation',
      label: i18n.translate(
        'wazuh.vulnerabilityDetection.evaluationFilter.underEvaluation',
        {
          defaultMessage: 'Under evaluation',
        },
      ),
      className: 'keep-for-report',
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
      legend={i18n.translate(
        'wazuh.vulnerabilityDetection.evaluationFilter.legend',
        {
          defaultMessage: 'Evaluated / Under evaluation',
        },
      )}
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
