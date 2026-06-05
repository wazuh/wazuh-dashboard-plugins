/*
 * Wazuh app - Component for the module generate reports
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

import React from 'react';
import { useAsyncAction } from '../../hooks';
import { ReportingService } from '../../../../react-services';
import { WzButton } from '../../../common/buttons';
import { connect } from 'react-redux';

const mapStateToProps = state => ({
  dataSourceSearchContext: state.reportingReducers.dataSourceSearchContext,
});

export const ButtonModuleGenerateReport = connect(mapStateToProps)(
  ({ agent, moduleID, dataSourceSearchContext }) => {
    const disabledReport = ![
      !dataSourceSearchContext?.isSearching,
      dataSourceSearchContext?.totalResults,
      dataSourceSearchContext?.indexPattern,
    ].every(Boolean);
    const totalResults = dataSourceSearchContext?.totalResults;
    const action = useAsyncAction(async () => {
      await new ReportingService()?.generateInContextPDFReport();
    }, [agent]);

    return (
      <WzButton
        buttonType='empty'
        iconType='document'
        isLoading={action.running}
        onClick={action.run}
        isDisabled={disabledReport}
        tooltip={
          disabledReport && totalResults === 0
            ? {
                position: 'top',
                content: 'No results match for this search criteria.',
              }
            : undefined
        }
      >
        Generate report
      </WzButton>
    );
  },
);
