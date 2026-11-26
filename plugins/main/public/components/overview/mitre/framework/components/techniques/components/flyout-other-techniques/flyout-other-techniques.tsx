import React, { useMemo, useState } from 'react';
import { i18n } from '@osd/i18n';
import {
  EuiAccordion,
  EuiBadge,
  EuiFlexGroup,
  EuiFlexItem,
  EuiFlyoutBody,
  EuiFlyoutHeader,
  EuiLink,
  EuiSpacer,
  EuiText,
  EuiTitle,
  EuiToolTip,
} from '@elastic/eui';
import { getUiSettings } from '../../../../../../../../kibana-services';
import {
  FilterManager,
  IndexPattern,
} from '../../../../../../../../../../../src/plugins/data/public/';
import { buildPhraseFilter } from '../../../../../../../../../../../src/plugins/data/common';
import { DATA_SOURCE_FILTER_CONTROLLED_MITRE_OTHER_TECHNIQUE_VALUE } from '../../../../../../../../../common/constants';
import { WzFlyout } from '../../../../../../../../components/common/flyouts';
import {
  FILTER_OPERATOR,
  PatternDataSource,
  PatternDataSourceFilterManager,
  tFilter,
} from '../../../../../../../../components/common/data-source';
import { WazuhFlyoutDiscover } from '../../../../../../../common/wazuh-discover/wz-flyout-discover';
import { wzDiscoverRenderColumns } from '../../../../../../../common/wazuh-discover/render-columns';
import { setFilters } from '../../../../../../../common/search-bar/set-filters';
import store from '../../../../../../../../redux/store';
import {
  agentTechniquesColumns,
  techniquesColumns,
} from '../flyout-technique/flyout-technique-columns';
import TechniqueRowDetails from '../flyout-technique/technique-row-details';
import { tDataGridColumn } from '../../../../../../../common/data-grid';
import { TECHNIQUE_FIELD } from '../../lib/other-technique';

type tRowProps = Pick<
  React.ComponentProps<typeof TechniqueRowDetails>,
  'doc' | 'item' | 'indexPattern'
>;

type tFlyoutOtherTechniquesProps = {
  onChangeFlyout: (value: boolean) => void;
  openDiscover: (e: React.MouseEvent) => void;
  indexPatternId: string;
  /** Technique IDs of the "Other" findings, with their finding count */
  techniqueBuckets: { key: string; doc_count: number }[];
  /** Filters of the findings searched, including the one of "Other" */
  fetchFilters: tFilter[];
};

const addRenderColumn = (columns: tDataGridColumn[]) =>
  columns.map(column => {
    const renderColumn = wzDiscoverRenderColumns.find(
      columnRender => columnRender.id === column.id,
    );
    return renderColumn ? { ...column, render: renderColumn.render } : column;
  });

export const FlyoutOtherTechniques = (props: tFlyoutOtherTechniquesProps) => {
  const {
    onChangeFlyout,
    openDiscover,
    indexPatternId,
    techniqueBuckets,
    fetchFilters,
  } = props;
  const filterManager = useMemo(() => new FilterManager(getUiSettings()), []);
  const [selectedValues, setSelectedValues] = useState<string[]>([]);

  const onValueClick = (value: string) => {
    const newSelected = selectedValues.includes(value)
      ? selectedValues.filter(item => item !== value)
      : [...selectedValues, value];
    // removeFilter() compares by deep equality, which fails once the filter went
    // through mapFilter(); the own filter is told apart by its controlledBy tag
    const remainingFilters = filterManager
      .getFilters()
      .filter(
        filter =>
          filter.meta?.controlledBy !==
          DATA_SOURCE_FILTER_CONTROLLED_MITRE_OTHER_TECHNIQUE_VALUE,
      );
    const newFilter = newSelected.length
      ? PatternDataSourceFilterManager.createFilter(
          FILTER_OPERATOR.IS_ONE_OF,
          TECHNIQUE_FIELD,
          newSelected,
          indexPatternId,
          DATA_SOURCE_FILTER_CONTROLLED_MITRE_OTHER_TECHNIQUE_VALUE,
        )
      : null;
    filterManager.setFilters(
      newFilter ? [...remainingFilters, newFilter] : remainingFilters,
    );
    setSelectedValues(newSelected);
  };

  const onRuleItemClick = (
    value: Record<string, string | string[]>,
    indexPattern: IndexPattern,
  ) => {
    const key = Object.keys(value)[0];
    const values = Array.isArray(value[key]) ? value[key] : [value[key]];
    filterManager.addFilters(
      values
        .map(item =>
          buildPhraseFilter({ name: key, type: 'string' }, item, indexPattern),
        )
        .filter(Boolean),
    );
  };

  const agentId = store.getState().appStateReducers?.currentAgentData?.id;
  const columns = addRenderColumn(
    agentId ? agentTechniquesColumns : techniquesColumns,
  );
  const sortedBuckets = [...techniqueBuckets].sort(
    (a, b) => b.doc_count - a.doc_count,
  );

  return (
    <WzFlyout
      onClose={() => onChangeFlyout(false)}
      flyoutProps={{
        size: 'l',
        className: 'flyout-no-overlap wz-inventory wzApp wz-technique-flyout',
        'aria-labelledby': 'flyoutOtherTechniquesTitle',
      }}
    >
      <EuiFlyoutHeader hasBorder style={{ padding: '12px 16px' }}>
        <EuiTitle size='m'>
          <h2 id='flyoutOtherTechniquesTitle'>
            {i18n.translate('wazuh.mitreAttack.techniques.otherFlyout.title', {
              defaultMessage: 'Other techniques',
            })}
          </h2>
        </EuiTitle>
      </EuiFlyoutHeader>
      <EuiFlyoutBody>
        <div style={{ padding: '16px 16px 0' }}>
          <EuiText size='s'>
            <p>
              {i18n.translate(
                'wazuh.mitreAttack.techniques.otherFlyout.description',
                {
                  defaultMessage:
                    'Findings of the selected tactics that have none of the listed techniques.',
                },
              )}
            </p>
            {sortedBuckets.length > 0 && (
              <p style={{ fontWeight: 500, marginBottom: 2 }}>
                {i18n.translate(
                  'wazuh.mitreAttack.techniques.otherFlyout.techniqueIdsTitle',
                  {
                    defaultMessage: 'Technique IDs of these findings',
                  },
                )}
              </p>
            )}
          </EuiText>
          <EuiSpacer size='xs' />
          <EuiFlexGroup wrap responsive={false} gutterSize='xs'>
            {sortedBuckets.map(bucket => {
              const isSelected = selectedValues.includes(bucket.key);
              const label = isSelected
                ? i18n.translate(
                    'wazuh.mitreAttack.techniques.otherFlyout.removeFilterTooltip',
                    {
                      defaultMessage: 'Remove filter by {value}',
                      values: { value: bucket.key },
                    },
                  )
                : i18n.translate(
                    'wazuh.mitreAttack.techniques.otherFlyout.filterByTooltip',
                    {
                      defaultMessage: 'Filter by {value}',
                      values: { value: bucket.key },
                    },
                  );
              return (
                <EuiFlexItem key={bucket.key} grow={false}>
                  <EuiToolTip position='top' content={label}>
                    <EuiBadge
                      title={undefined}
                      color={isSelected ? 'primary' : 'hollow'}
                      onClick={() => onValueClick(bucket.key)}
                      onClickAriaLabel={label}
                      data-test-subj={`otherTechniqueValue-${bucket.key}`}
                    >
                      {bucket.key} ({bucket.doc_count})
                    </EuiBadge>
                  </EuiToolTip>
                </EuiFlexItem>
              );
            })}
          </EuiFlexGroup>
          <EuiSpacer size='l' />
          <EuiAccordion
            id='recent_events'
            className='events-accordion'
            buttonContent={
              <EuiTitle size='s'>
                <h3>
                  {i18n.translate(
                    'wazuh.mitreAttack.techniques.otherFlyout.recentFindings',
                    {
                      defaultMessage: 'Recent findings',
                    },
                  )}
                </h3>
              </EuiTitle>
            }
            extraAction={
              <EuiText size='s'>
                <EuiLink onClick={(e: React.MouseEvent) => openDiscover(e)}>
                  {i18n.translate(
                    'wazuh.mitreAttack.techniques.otherFlyout.openInFindings',
                    {
                      defaultMessage: 'Open in Findings',
                    },
                  )}
                </EuiLink>
              </EuiText>
            }
            paddingSize='none'
            initialIsOpen={true}
          >
            <WazuhFlyoutDiscover
              DataSource={PatternDataSource}
              tableColumns={columns}
              filterManager={filterManager}
              initialFetchFilters={fetchFilters}
              expandedRowComponent={(rowProps: tRowProps) => (
                <TechniqueRowDetails
                  {...rowProps}
                  onRuleItemClick={onRuleItemClick}
                  filters={[]}
                  setFilters={setFilters(filterManager)}
                />
              )}
            />
          </EuiAccordion>
        </div>
      </EuiFlyoutBody>
    </WzFlyout>
  );
};
