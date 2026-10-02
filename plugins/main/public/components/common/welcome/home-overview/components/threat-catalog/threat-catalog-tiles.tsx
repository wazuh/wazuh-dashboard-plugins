import React from 'react';
import { FormattedMessage } from '@osd/i18n/react';
import { EuiText } from '@elastic/eui';
import { formatValueSafely } from '../common';
import { DataGroupResult } from '../../interfaces/data-group';

export interface ThreatCatalogTilesProps {
  iocs: DataGroupResult<number | undefined>;
}

/** Reference-only entity (a catalog, not detection content): no link. */
export const ThreatCatalogTiles: React.FC<ThreatCatalogTilesProps> = ({
  iocs,
}) => {
  const value = iocs.status === 'available' ? iocs.data : undefined;
  return (
    <EuiText size='s' data-test-subj='threat-catalog-tile-iocs'>
      <FormattedMessage
        id='wazuh.common.homeOverviewThreatCatalog.iocsCount'
        defaultMessage='{count} IOCs'
        values={{
          count: (
            <strong className='tab-num'>{formatValueSafely(value)}</strong>
          ),
        }}
      />
    </EuiText>
  );
};
