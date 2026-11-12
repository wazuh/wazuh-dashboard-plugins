import React from 'react';
import { i18n } from '@osd/i18n';
import { connect } from 'react-redux';
import { useAsyncAction } from '../../hooks';
import { WzButton } from '../../../common/buttons';
import {
  ErrorFactory,
  ErrorHandler,
  HttpError,
} from '../../../../react-services/error-management';

const mapStateToProps = state => ({
  tableReportContext: state.reportingReducers.tableReportContext,
});

/**
 * Generate report button of the inventory tabs: downloads the full table of the active sub-tab.
 */
export const ButtonInventoryGenerateReport = connect(mapStateToProps)(
  ({ tableReportContext }) => {
    const totalResults = tableReportContext?.totalResults;
    const action = useAsyncAction(async () => {
      try {
        await tableReportContext?.generateReport();
      } catch (error) {
        ErrorHandler.handleError(
          ErrorFactory.create(HttpError, {
            error,
            message: i18n.translate('wazuh.common.generateReport.csvError', {
              defaultMessage: 'Error generating the report',
            }),
          }),
        );
      }
    }, [tableReportContext]);

    return (
      <WzButton
        buttonType='empty'
        iconType='document'
        isLoading={action.running}
        onClick={action.run}
        isDisabled={!totalResults}
        tooltip={
          totalResults === 0
            ? {
                position: 'top',
                content: i18n.translate(
                  'wazuh.common.generateReport.noResultsTooltip',
                  {
                    defaultMessage:
                      'No results match for this search criteria.',
                  },
                ),
              }
            : undefined
        }
      >
        {i18n.translate('wazuh.common.generateReport.button', {
          defaultMessage: 'Generate report',
        })}
      </WzButton>
    );
  },
);
