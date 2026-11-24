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
 * Download CSV button of the inventory tabs: downloads the full table of the active sub-tab as a
 * CSV file. Its name states the format, unlike Generate report, which produces a PDF.
 */
export const ButtonInventoryDownloadCsv = connect(mapStateToProps)(
  ({ tableReportContext }) => {
    const totalResults = tableReportContext?.totalResults;
    const action = useAsyncAction(async () => {
      try {
        await tableReportContext?.generateReport();
      } catch (error) {
        ErrorHandler.handleError(
          ErrorFactory.create(HttpError, {
            error,
            message: i18n.translate('wazuh.common.inventoryDownloadCsv.error', {
              defaultMessage: 'Error downloading the CSV file',
            }),
          }),
        );
      }
    }, [tableReportContext]);

    return (
      <WzButton
        buttonType='empty'
        iconType='importAction'
        isLoading={action.running}
        onClick={action.run}
        isDisabled={!totalResults}
        tooltip={
          totalResults === 0
            ? {
                position: 'top',
                content: i18n.translate(
                  'wazuh.common.inventoryDownloadCsv.noResultsTooltip',
                  {
                    defaultMessage:
                      'No results match for this search criteria.',
                  },
                ),
              }
            : undefined
        }
      >
        {i18n.translate('wazuh.common.inventoryDownloadCsv.button', {
          defaultMessage: 'Download CSV',
        })}
      </WzButton>
    );
  },
);
