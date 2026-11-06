import React, { useEffect, useState } from 'react';
import { i18n } from '@osd/i18n';
import {
  EuiBadge,
  EuiBasicTable,
  EuiBasicTableColumn,
  EuiButtonGroup,
  EuiFieldSearch,
  EuiFlexGroup,
  EuiFlexItem,
  EuiFormRow,
  EuiLink,
  EuiPanel,
  EuiSpacer,
  EuiText,
  EuiTitle,
  Criteria,
} from '@elastic/eui';
import {
  CTI_DEFAULT_PAGE_SIZE,
  CTI_MAX_RESULT_WINDOW,
  CTI_RECORD_ID_MAX_LENGTH,
  CveSeverityFilter,
  VulnerabilityRecordType,
} from '../../../../common/cti-explorer/constants';
import {
  getCveMetadata,
  getCveScores,
  getHighestCveScore,
  getTranslationRule,
} from '../../../../common/cti-explorer/cve-record';
import type {
  VulnerabilityListItem,
  VulnerabilitySummaryResponse,
} from '../../../../common/cti-explorer/types';
import { CtiRequestState, useCtiRequest } from '../hooks/use-cti-request';
import { searchVulnerabilities } from '../services/cti-explorer-api';
import type { CsvColumn } from '../services/export-csv';
import { formatDate, formatNumber } from '../utils/labels';
import { NORMAL_FONT_WEIGHT } from '../utils/styles';
import { ExportCsvButton } from './export-csv-button';
import { RequestErrorCallout } from './request-error-callout';
import { getSeverityLabel, SeverityBadge } from './severity-badge';
import { SeverityFilter } from './severity-filter';

/** The full `_id` of a record: the index cannot match a part of it. */
export const RECORD_ID_PATTERN = /^(CVE-\d{4}-\d{4,}|TID-\d+)$/i;

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];
const ALL_TYPES = 'all';

/** A listed record, with the values the table sorts on. */
type VulnerabilityRow = VulnerabilityListItem & {
  rowKey: string;
  published: string | null;
};

const PUBLISHED_SORT_FIELD = 'document.cveMetadata.datePublished';

const highestScore = (item: VulnerabilityListItem) =>
  item.type === 'CVE' ? getHighestCveScore(getCveScores(item.document)) : null;
const cveMetadata = (item: VulnerabilityListItem) =>
  item.type === 'CVE' ? getCveMetadata(item.document) : null;
const translationRule = (item: VulnerabilityListItem) =>
  item.type === 'TID' ? getTranslationRule(item.document) : null;

/** Columns of the exported file: dates as stored, in UTC. */
const CSV_COLUMNS: Array<CsvColumn<VulnerabilityListItem>> = [
  {
    field: 'id',
    title: i18n.translate('wazuh.ctiExplorer.vulnerabilities.csv.record', {
      defaultMessage: 'Record',
    }),
    value: item => item.id,
  },
  {
    field: 'type',
    title: i18n.translate('wazuh.ctiExplorer.vulnerabilities.csv.type', {
      defaultMessage: 'Type',
    }),
    value: item => item.type,
  },
  {
    field: 'score',
    title: i18n.translate('wazuh.ctiExplorer.vulnerabilities.csv.score', {
      defaultMessage: 'Highest CVSS score',
    }),
    value: item => highestScore(item)?.score.toFixed(1),
  },
  {
    field: 'severity',
    title: i18n.translate('wazuh.ctiExplorer.vulnerabilities.csv.severity', {
      defaultMessage: 'Severity',
    }),
    value: item => {
      const score = highestScore(item);
      return score ? getSeverityLabel(score.severity) : null;
    },
  },
  {
    field: 'cvssVersion',
    title: i18n.translate('wazuh.ctiExplorer.vulnerabilities.csv.cvssVersion', {
      defaultMessage: 'CVSS version',
    }),
    value: item => highestScore(item)?.version,
  },
  {
    field: 'published',
    title: i18n.translate('wazuh.ctiExplorer.vulnerabilities.csv.published', {
      defaultMessage: 'Published',
    }),
    value: item => cveMetadata(item)?.published,
  },
  {
    field: 'updated',
    title: i18n.translate('wazuh.ctiExplorer.vulnerabilities.csv.updated', {
      defaultMessage: 'Updated',
    }),
    value: item => cveMetadata(item)?.updated,
  },
  {
    field: 'assigner',
    title: i18n.translate('wazuh.ctiExplorer.vulnerabilities.csv.assigner', {
      defaultMessage: 'Assigner',
    }),
    value: item => cveMetadata(item)?.assigner,
  },
  {
    field: 'state',
    title: i18n.translate('wazuh.ctiExplorer.vulnerabilities.csv.state', {
      defaultMessage: 'State',
    }),
    value: item => cveMetadata(item)?.state,
  },
  {
    field: 'actions',
    title: i18n.translate('wazuh.ctiExplorer.vulnerabilities.csv.actions', {
      defaultMessage: 'Translation actions',
    }),
    value: item => translationRule(item)?.actions.join(', '),
  },
  {
    field: 'targets',
    title: i18n.translate('wazuh.ctiExplorer.vulnerabilities.csv.targets', {
      defaultMessage: 'Translation targets',
    }),
    value: item => translationRule(item)?.targets.join(', '),
  },
];

interface VulnerabilitiesTabProps {
  summary: CtiRequestState<VulnerabilitySummaryResponse>;
  type: VulnerabilityRecordType | undefined;
  onTypeChange: (type: VulnerabilityRecordType | undefined) => void;
  onOpenVulnerability: (id: string) => void;
}

export const VulnerabilitiesTab = ({
  summary,
  type,
  onTypeChange,
  onOpenVulnerability,
}: VulnerabilitiesTabProps) => {
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(CTI_DEFAULT_PAGE_SIZE);
  const [idInput, setIdInput] = useState('');
  const [idInvalid, setIdInvalid] = useState(false);
  const [severities, setSeverities] = useState<CveSeverityFilter[]>([]);
  /** Order by publication date; newest delivered first while unset. */
  const [publishedSort, setPublishedSort] = useState<'asc' | 'desc' | null>(
    null,
  );

  // Translation rules have no scores nor publication date: the severity filter
  // and the sort apply to CVE records only.
  const isTid = type === 'TID';
  const appliedSeverities = isTid ? [] : severities;
  const severitiesKey = appliedSeverities.join(',');
  const appliedSort = isTid ? null : publishedSort;
  const sortParams = appliedSort
    ? { sortField: PUBLISHED_SORT_FIELD, sortDirection: appliedSort }
    : {};

  useEffect(() => setPage(0), [type, severitiesKey, appliedSort]);

  const result = useCtiRequest(
    () =>
      searchVulnerabilities({
        type,
        severities: appliedSeverities,
        ...sortParams,
        page,
        pageSize,
      }),
    // `severitiesKey` stands for `appliedSeverities`.
    [type, severitiesKey, appliedSort, page, pageSize],
  );
  const total = result.data?.total ?? 0;
  // Rows are keyed by position: while two indices match the pattern, as during
  // a reindex, a record is listed twice and its id is not unique.
  const rows: VulnerabilityRow[] = (result.data?.items ?? []).map(
    (item, position) => ({
      ...item,
      rowKey: `${position}-${item.id}`,
      published: cveMetadata(item)?.published ?? null,
    }),
  );

  const countOf = (recordType: string) =>
    summary.data?.byType.find(bucket => bucket.key === recordType)?.count;
  const withCount = (label: string, count: number | undefined) =>
    count === undefined
      ? label
      : i18n.translate('wazuh.ctiExplorer.vulnerabilities.typeWithCount', {
          defaultMessage: '{label} ({count})',
          values: { label, count: formatNumber(count) },
        });

  const openById = (value: string) => {
    const id = value.trim();
    if (!id) {
      setIdInvalid(false);
      return;
    }
    if (!RECORD_ID_PATTERN.test(id)) {
      setIdInvalid(true);
      return;
    }
    setIdInvalid(false);
    onOpenVulnerability(id.toUpperCase());
  };

  const onTableChange = ({
    page: tablePage,
    sort,
  }: Criteria<VulnerabilityRow>) => {
    if (tablePage) {
      setPage(tablePage.size === pageSize ? tablePage.index : 0);
      setPageSize(tablePage.size);
    }
    if (sort?.field === 'published') {
      setPublishedSort(sort.direction);
    }
  };

  const columns: Array<EuiBasicTableColumn<VulnerabilityRow>> = [
    {
      field: 'id',
      name: i18n.translate('wazuh.ctiExplorer.vulnerabilities.columns.record', {
        defaultMessage: 'Record',
      }),
      render: (id: string) => (
        <EuiLink
          onClick={(event: React.MouseEvent) => {
            event.stopPropagation();
            onOpenVulnerability(id);
          }}
          style={NORMAL_FONT_WEIGHT}
          data-test-subj='ctiExplorerVulnerabilityId'
        >
          {id}
        </EuiLink>
      ),
    },
    {
      field: 'type',
      name: i18n.translate('wazuh.ctiExplorer.vulnerabilities.columns.type', {
        defaultMessage: 'Type',
      }),
    },
    {
      name: i18n.translate(
        'wazuh.ctiExplorer.vulnerabilities.columns.severity',
        { defaultMessage: 'Highest CVSS' },
      ),
      render: (item: VulnerabilityListItem) =>
        item.type === 'CVE' ? (
          <SeverityBadge
            score={getHighestCveScore(getCveScores(item.document))}
          />
        ) : (
          '-'
        ),
    },
    {
      field: 'published',
      name: i18n.translate(
        'wazuh.ctiExplorer.vulnerabilities.columns.published',
        { defaultMessage: 'Published' },
      ),
      sortable: !isTid,
      render: (published: string | null) => formatDate(published),
    },
    {
      name: i18n.translate(
        'wazuh.ctiExplorer.vulnerabilities.columns.details',
        {
          defaultMessage: 'Details',
        },
      ),
      render: (item: VulnerabilityListItem) => {
        if (item.type === 'TID') {
          const rule = getTranslationRule(item.document);
          return i18n.translate(
            'wazuh.ctiExplorer.vulnerabilities.tidDetails',
            {
              defaultMessage: '{actions} on {targets}',
              values: {
                actions: rule.actions.join(', ') || '-',
                targets: rule.targets.join(', ') || '-',
              },
            },
          );
        }
        const metadata = getCveMetadata(item.document);
        return (
          <EuiFlexGroup gutterSize='s' alignItems='center' responsive={false}>
            <EuiFlexItem grow={false}>
              {i18n.translate('wazuh.ctiExplorer.vulnerabilities.assigner', {
                defaultMessage: 'Assigner: {assigner}',
                values: { assigner: metadata.assigner ?? '-' },
              })}
            </EuiFlexItem>
            {metadata.state && metadata.state !== 'PUBLISHED' ? (
              <EuiFlexItem grow={false}>
                <EuiBadge color='warning'>{metadata.state}</EuiBadge>
              </EuiFlexItem>
            ) : null}
          </EuiFlexGroup>
        );
      },
    },
  ];

  return (
    <>
      {summary.error ? (
        <>
          <RequestErrorCallout error={summary.error} onRetry={summary.reload} />
          <EuiSpacer size='m' />
        </>
      ) : null}
      <EuiPanel paddingSize='m' data-test-subj='ctiExplorerVulnerabilityList'>
        <EuiFlexGroup
          justifyContent='spaceBetween'
          alignItems='flexStart'
          responsive={false}
        >
          <EuiFlexItem>
            <EuiTitle size='xs'>
              <h2>
                {i18n.translate('wazuh.ctiExplorer.vulnerabilities.title', {
                  defaultMessage: 'Vulnerability records',
                })}
              </h2>
            </EuiTitle>
            <EuiText size='xs' color='subdued'>
              <p>
                {i18n.translate('wazuh.ctiExplorer.vulnerabilities.caption', {
                  defaultMessage:
                    'Newest first, unless sorted by publication date. The records are stored without being indexed, except the CVSS scores of their CNA: they can be listed, filtered by severity and opened by their full id, but their content cannot be searched.',
                })}
              </p>
            </EuiText>
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <ExportCsvButton<VulnerabilityListItem>
              total={total}
              isDisabled={result.loading || Boolean(result.error)}
              fetchPage={(exportPage, exportPageSize) =>
                searchVulnerabilities({
                  type,
                  severities: appliedSeverities,
                  ...sortParams,
                  page: exportPage,
                  pageSize: exportPageSize,
                })
              }
              columns={CSV_COLUMNS}
              filename='cti-vulnerabilities'
              data-test-subj='ctiExplorerVulnerabilityExport'
            />
          </EuiFlexItem>
        </EuiFlexGroup>
        <EuiSpacer size='m' />
        <EuiFlexGroup gutterSize='m' wrap alignItems='flexStart'>
          <EuiFlexItem grow={false}>
            <EuiButtonGroup
              legend={i18n.translate(
                'wazuh.ctiExplorer.vulnerabilities.typeLegend',
                { defaultMessage: 'Record type' },
              )}
              buttonSize='compressed'
              idSelected={type ?? ALL_TYPES}
              onChange={id =>
                onTypeChange(
                  id === ALL_TYPES
                    ? undefined
                    : (id as VulnerabilityRecordType),
                )
              }
              options={[
                {
                  id: ALL_TYPES,
                  label: i18n.translate(
                    'wazuh.ctiExplorer.vulnerabilities.allTypes',
                    { defaultMessage: 'All' },
                  ),
                },
                {
                  id: 'CVE',
                  label: withCount(
                    i18n.translate('wazuh.ctiExplorer.vulnerabilities.cve', {
                      defaultMessage: 'CVE',
                    }),
                    countOf('CVE'),
                  ),
                },
                {
                  id: 'TID',
                  label: withCount(
                    i18n.translate('wazuh.ctiExplorer.vulnerabilities.tid', {
                      defaultMessage: 'Translation rules (TID)',
                    }),
                    countOf('TID'),
                  ),
                },
              ]}
              data-test-subj='ctiExplorerVulnerabilityType'
            />
          </EuiFlexItem>
          <EuiFlexItem grow={false} style={{ minWidth: 220 }}>
            <SeverityFilter
              selected={severities}
              onChange={setSeverities}
              isDisabled={type === 'TID'}
            />
          </EuiFlexItem>
          <EuiFlexItem style={{ minWidth: 260 }}>
            <EuiFormRow
              fullWidth
              isInvalid={idInvalid}
              error={i18n.translate(
                'wazuh.ctiExplorer.vulnerabilities.idInvalid',
                {
                  defaultMessage:
                    'Enter a full record id, such as CVE-2024-6387 or TID-0048.',
                },
              )}
            >
              <EuiFieldSearch
                compressed
                fullWidth
                value={idInput}
                maxLength={CTI_RECORD_ID_MAX_LENGTH}
                isInvalid={idInvalid}
                incremental={false}
                onChange={event => setIdInput(event.target.value)}
                onSearch={openById}
                placeholder={i18n.translate(
                  'wazuh.ctiExplorer.vulnerabilities.idPlaceholder',
                  { defaultMessage: 'Open a record by its full id' },
                )}
                aria-label={i18n.translate(
                  'wazuh.ctiExplorer.vulnerabilities.idAriaLabel',
                  {
                    defaultMessage:
                      'Open a vulnerability record by its full CVE or TID id',
                  },
                )}
                data-test-subj='ctiExplorerVulnerabilityIdInput'
              />
            </EuiFormRow>
          </EuiFlexItem>
        </EuiFlexGroup>
        <EuiFlexGroup
          gutterSize='s'
          alignItems='center'
          justifyContent='flexEnd'
          responsive={false}
          wrap
        >
          <EuiFlexItem grow={false}>
            <EuiText
              size='xs'
              color='subdued'
              data-test-subj='ctiExplorerVulnerabilityCount'
            >
              {result.data
                ? total > CTI_MAX_RESULT_WINDOW
                  ? i18n.translate(
                      'wazuh.ctiExplorer.vulnerabilities.countCapped',
                      {
                        defaultMessage:
                          '{total} records. The newest {max} can be paged through; open any other one by its id.',
                        values: {
                          total: formatNumber(total),
                          max: formatNumber(CTI_MAX_RESULT_WINDOW),
                        },
                      },
                    )
                  : i18n.translate('wazuh.ctiExplorer.vulnerabilities.count', {
                      defaultMessage:
                        '{total, plural, one {# record} other {# records}}',
                      values: { total },
                    })
                : null}
            </EuiText>
          </EuiFlexItem>
        </EuiFlexGroup>
        <EuiSpacer size='s' />
        {result.error ? (
          <RequestErrorCallout error={result.error} onRetry={result.reload} />
        ) : (
          <EuiBasicTable<VulnerabilityRow>
            items={rows}
            itemId='rowKey'
            columns={columns}
            loading={result.loading}
            tableLayout='auto'
            noItemsMessage={
              result.loading
                ? i18n.translate('wazuh.ctiExplorer.vulnerabilities.loading', {
                    defaultMessage: 'Loading records…',
                  })
                : i18n.translate('wazuh.ctiExplorer.vulnerabilities.noItems', {
                    defaultMessage: 'No records',
                  })
            }
            pagination={{
              pageIndex: page,
              pageSize,
              totalItemCount: Math.min(total, CTI_MAX_RESULT_WINDOW),
              pageSizeOptions: PAGE_SIZE_OPTIONS,
            }}
            sorting={{
              sort: appliedSort
                ? { field: 'published', direction: appliedSort }
                : undefined,
            }}
            onChange={onTableChange}
            rowProps={(item: VulnerabilityRow) => ({
              onClick: () => onOpenVulnerability(item.id),
              style: { cursor: 'pointer' },
            })}
            data-test-subj='ctiExplorerVulnerabilityTable'
          />
        )}
      </EuiPanel>
    </>
  );
};
