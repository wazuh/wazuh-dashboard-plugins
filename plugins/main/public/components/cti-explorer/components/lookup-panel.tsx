import React, { useRef, useState } from 'react';
import { i18n } from '@osd/i18n';
import {
  EuiBadge,
  EuiBasicTable,
  EuiButton,
  EuiButtonEmpty,
  EuiCallOut,
  EuiCode,
  EuiFieldSearch,
  EuiFlexGroup,
  EuiFlexItem,
  EuiIconTip,
  EuiPanel,
  EuiSpacer,
  EuiText,
} from '@elastic/eui';
import type {
  IocRecord,
  LookupResponse,
  VulnerabilityListItem,
} from '../../../../common/cti-explorer/types';
import {
  CtiRequestError,
  lookupValue,
  toCtiRequestError,
} from '../services/cti-explorer-api';
import { getIocTypeLabel, getProviderName } from '../utils/labels';
import { getCtiCveUrl, getThreatHuntingIocUrl } from '../utils/navigation';
import { RequestErrorCallout } from './request-error-callout';
import {
  VulnerabilityRow,
  getCveColumns,
  getTidColumns,
  toVulnerabilityRows,
} from './vulnerability-columns';

/**
 * Examples to try, picked from the feed for a rich result: a C2 address with several
 * frameworks, a domain several providers report and a critical CVE with references.
 * The feed rotates its indicators: replace a value once it stops matching.
 */
const EXAMPLES = ['192.169.176.54', 'ackeamann.xyz', 'CVE-2026-76312'];

type LookupState =
  | { status: 'idle' }
  | { status: 'loading'; value: string }
  | { status: 'done'; value: string; result: LookupResponse }
  | { status: 'error'; value: string; error: CtiRequestError };

interface ValueGroup {
  name: string;
  type: string;
  records: IocRecord[];
}

/** One row per value: a value can come from several providers, or twice from one. */
const groupByValue = (records: IocRecord[]): ValueGroup[] => {
  const groups = new Map<string, ValueGroup>();
  records.forEach(record => {
    const key = `${record.type}\u0000${record.name}`;
    const group = groups.get(key) ?? {
      name: record.name,
      type: record.type,
      records: [],
    };
    group.records.push(record);
    groups.set(key, group);
  });
  return [...groups.values()];
};

const uniqueProviders = (records: IocRecord[]) => [
  ...new Set(records.map(record => getProviderName(record.provider))),
];

interface LookupPanelProps {
  onOpenIoc: (id: string) => void;
  onOpenVulnerability: (id: string) => void;
}

const OPEN_RECORD = i18n.translate('wazuh.ctiExplorer.lookup.openRecord', {
  defaultMessage: 'Open the record',
});

const ACTIONS_COLUMN_NAME = i18n.translate(
  'wazuh.ctiExplorer.lookup.columns.actions',
  { defaultMessage: 'Actions' },
);

/** A looked-up id that the index returned without its fields. */
const recordOf = (
  result: Extract<LookupResponse, { kind: 'vulnerability' }>,
): VulnerabilityListItem =>
  result.record ?? {
    id: result.id,
    type: result.id.startsWith('TID-') ? 'TID' : 'CVE',
    offset: null,
    document: null,
  };

/** A CVE record or translation rule, with the columns of its type. */
const VulnerabilityMatch = ({
  record,
  onOpenVulnerability,
}: {
  record: VulnerabilityListItem;
  onOpenVulnerability: (id: string) => void;
}) => (
  <EuiBasicTable<VulnerabilityRow>
    items={toVulnerabilityRows([record])}
    itemId='rowKey'
    tableLayout='auto'
    columns={[
      {
        field: 'id',
        name: i18n.translate('wazuh.ctiExplorer.lookup.columns.record', {
          defaultMessage: 'Record',
        }),
        render: (id: string) => <span className='eui-textNoWrap'>{id}</span>,
      },
      ...(record.type === 'TID'
        ? getTidColumns()
        : getCveColumns({ publishedSortable: false })),
      {
        name: ACTIONS_COLUMN_NAME,
        render: (row: VulnerabilityRow) => (
          <EuiFlexGroup gutterSize='none' responsive={false} wrap>
            <EuiFlexItem grow={false}>
              <EuiButtonEmpty
                size='xs'
                iconType='inspect'
                onClick={() => onOpenVulnerability(row.id)}
                data-test-subj='ctiExplorerLookupOpenVulnerability'
              >
                {OPEN_RECORD}
              </EuiButtonEmpty>
            </EuiFlexItem>
            {record.type === 'CVE' ? (
              <EuiFlexItem grow={false}>
                <EuiButtonEmpty
                  size='xs'
                  iconType='popout'
                  iconSide='right'
                  href={getCtiCveUrl(row.id)}
                  target='_blank'
                  rel='noopener noreferrer'
                  data-test-subj='ctiExplorerLookupOpenInCti'
                >
                  {i18n.translate('wazuh.ctiExplorer.lookup.openInCti', {
                    defaultMessage: 'Full advisory on cti.wazuh.com',
                  })}
                </EuiButtonEmpty>
              </EuiFlexItem>
            ) : null}
          </EuiFlexGroup>
        ),
      },
    ]}
    data-test-subj='ctiExplorerLookupRecordFound'
  />
);

/** The IOC records of the value, one row per value and type. */
const IocMatch = ({
  records,
  onOpenIoc,
}: {
  records: IocRecord[];
  onOpenIoc: (id: string) => void;
}) => (
  <div data-test-subj='ctiExplorerLookupListed'>
    <EuiBasicTable<ValueGroup>
      items={groupByValue(records)}
      tableLayout='auto'
      columns={[
        {
          field: 'name',
          name: i18n.translate('wazuh.ctiExplorer.lookup.columns.value', {
            defaultMessage: 'Value',
          }),
          render: (name: string) => (
            <EuiCode transparentBackground>{name}</EuiCode>
          ),
        },
        {
          field: 'type',
          name: i18n.translate('wazuh.ctiExplorer.lookup.columns.type', {
            defaultMessage: 'Type',
          }),
          render: (type: string) => getIocTypeLabel(type),
        },
        {
          field: 'records',
          name: i18n.translate('wazuh.ctiExplorer.lookup.columns.providers', {
            defaultMessage: 'Providers',
          }),
          render: (groupRecords: IocRecord[]) =>
            uniqueProviders(groupRecords).join(', '),
        },
        {
          field: 'records',
          name: i18n.translate('wazuh.ctiExplorer.lookup.columns.confidence', {
            defaultMessage: 'Confidence',
          }),
          render: (groupRecords: IocRecord[]) =>
            Math.max(...groupRecords.map(record => record.confidence ?? 0)),
        },
        {
          name: ACTIONS_COLUMN_NAME,
          render: (group: ValueGroup) => (
            <EuiFlexGroup gutterSize='none' responsive={false} wrap>
              <EuiFlexItem grow={false}>
                <EuiButtonEmpty
                  size='xs'
                  iconType='inspect'
                  onClick={() => onOpenIoc(group.records[0].id)}
                  data-test-subj='ctiExplorerLookupOpenIoc'
                >
                  {OPEN_RECORD}
                </EuiButtonEmpty>
              </EuiFlexItem>
              <EuiFlexItem grow={false}>
                <EuiButtonEmpty
                  size='xs'
                  iconType='search'
                  href={getThreatHuntingIocUrl(group.name)}
                  data-test-subj='ctiExplorerLookupHunt'
                >
                  {i18n.translate('wazuh.ctiExplorer.huntInThreatHunting', {
                    defaultMessage: 'Hunt in Threat Hunting',
                  })}
                </EuiButtonEmpty>
              </EuiFlexItem>
            </EuiFlexGroup>
          ),
        },
      ]}
    />
    <EuiSpacer size='s' />
    <EuiText size='xs' color='subdued'>
      <p>
        {i18n.translate('wazuh.ctiExplorer.lookup.listedText', {
          defaultMessage:
            'A match is feed knowledge, not evidence that the value was seen on your agents. Hunt for it to find the events that matched it.',
        })}
      </p>
    </EuiText>
  </div>
);

const LookupResult = ({
  value,
  result,
  onOpenIoc,
  onOpenVulnerability,
}: {
  value: string;
  result: LookupResponse;
} & LookupPanelProps) => {
  if (result.kind === 'vulnerability') {
    return result.found ? (
      <VulnerabilityMatch
        record={recordOf(result)}
        onOpenVulnerability={onOpenVulnerability}
      />
    ) : (
      <EuiCallOut
        size='s'
        color='warning'
        iconType='help'
        title={i18n.translate('wazuh.ctiExplorer.lookup.recordNotFound', {
          defaultMessage: '{id} is not in the vulnerabilities catalog',
          values: { id: result.id },
        })}
        data-test-subj='ctiExplorerLookupRecordNotFound'
      >
        <p>
          {i18n.translate('wazuh.ctiExplorer.lookup.recordNotFoundText', {
            defaultMessage:
              'The id may be mistyped, or the feed may not have delivered the record yet.',
          })}
        </p>
      </EuiCallOut>
    );
  }

  if (!result.records.length) {
    return (
      <EuiCallOut
        size='s'
        iconType='iInCircle'
        title={i18n.translate('wazuh.ctiExplorer.lookup.notListed', {
          defaultMessage: '{value} is not in the IOC catalog',
          values: { value },
        })}
        data-test-subj='ctiExplorerLookupNotListed'
      >
        <p>
          {i18n.translate('wazuh.ctiExplorer.lookup.notListedText', {
            defaultMessage:
              'This is not a verdict that the value is safe: the catalog only holds what its providers reported.',
          })}
        </p>
      </EuiCallOut>
    );
  }

  return <IocMatch records={result.records} onOpenIoc={onOpenIoc} />;
};

export const LookupPanel = ({
  onOpenIoc,
  onOpenVulnerability,
}: LookupPanelProps) => {
  const [value, setValue] = useState('');
  const [state, setState] = useState<LookupState>({ status: 'idle' });
  const latest = useRef(0);

  const check = async (raw: string) => {
    const trimmed = raw.trim();
    if (!trimmed) {
      return;
    }
    const request = ++latest.current;
    setValue(raw);
    setState({ status: 'loading', value: trimmed });
    try {
      const result = await lookupValue(trimmed);
      if (request === latest.current) {
        setState({ status: 'done', value: trimmed, result });
      }
    } catch (error) {
      if (request === latest.current) {
        setState({
          status: 'error',
          value: trimmed,
          error: toCtiRequestError(error),
        });
      }
    }
  };

  const clear = () => {
    latest.current++;
    setValue('');
    setState({ status: 'idle' });
  };

  return (
    <EuiPanel paddingSize='m' data-test-subj='ctiExplorerLookup'>
      <EuiFlexGroup gutterSize='s' responsive={false}>
        <EuiFlexItem>
          <EuiFieldSearch
            fullWidth
            value={value}
            onChange={event => setValue(event.target.value)}
            onSearch={search => (search ? check(search) : clear())}
            isClearable
            incremental={false}
            isLoading={state.status === 'loading'}
            placeholder={i18n.translate(
              'wazuh.ctiExplorer.lookup.placeholder',
              {
                defaultMessage:
                  'Check a domain, URL, IP address, host:port, file hash or CVE id',
              },
            )}
            aria-label={i18n.translate('wazuh.ctiExplorer.lookup.ariaLabel', {
              defaultMessage: 'Check a value against the IOC and CVE catalogs',
            })}
            data-test-subj='ctiExplorerLookupInput'
          />
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <EuiButton
            fill
            onClick={() => check(value)}
            isDisabled={!value.trim()}
            isLoading={state.status === 'loading'}
            data-test-subj='ctiExplorerLookupButton'
          >
            {i18n.translate('wazuh.ctiExplorer.lookup.button', {
              defaultMessage: 'Check',
            })}
          </EuiButton>
        </EuiFlexItem>
      </EuiFlexGroup>
      <EuiSpacer size='s' />
      <EuiFlexGroup gutterSize='s' alignItems='center' responsive={false} wrap>
        <EuiFlexItem grow={false}>
          <EuiText size='xs' color='subdued'>
            {i18n.translate('wazuh.ctiExplorer.lookup.examples', {
              defaultMessage: 'Try',
            })}
          </EuiText>
        </EuiFlexItem>
        {EXAMPLES.map(example => (
          <EuiFlexItem grow={false} key={example}>
            <EuiBadge
              color='hollow'
              onClick={() => check(example)}
              onClickAriaLabel={i18n.translate(
                'wazuh.ctiExplorer.lookup.exampleAriaLabel',
                {
                  defaultMessage: 'Check {value}',
                  values: { value: example },
                },
              )}
              data-test-subj={`ctiExplorerLookupExample-${example}`}
            >
              {example}
            </EuiBadge>
          </EuiFlexItem>
        ))}
        <EuiFlexItem />
        <EuiFlexItem grow={false}>
          <EuiText size='xs' color='subdued'>
            {i18n.translate('wazuh.ctiExplorer.lookup.howMatching', {
              defaultMessage: 'How matching works',
            })}{' '}
            <EuiIconTip
              type='questionInCircle'
              color='subdued'
              size='s'
              content={i18n.translate(
                'wazuh.ctiExplorer.lookup.howMatchingTooltip',
                {
                  defaultMessage:
                    'The value must match a catalog value exactly, ignoring case. An IP address also finds its host:port records, and a URL also finds the domain of its host. Defanged values such as hxxp:// or example[.]com are accepted. CVE and TID ids open the vulnerability record with that id.',
                },
              )}
            />
          </EuiText>
        </EuiFlexItem>
      </EuiFlexGroup>
      {state.status === 'done' || state.status === 'error' ? (
        <>
          <EuiSpacer size='m' />
          {state.status === 'error' ? (
            <RequestErrorCallout
              error={state.error}
              onRetry={() => check(state.value)}
            />
          ) : (
            <LookupResult
              value={state.value}
              result={state.result}
              onOpenIoc={onOpenIoc}
              onOpenVulnerability={onOpenVulnerability}
            />
          )}
        </>
      ) : null}
    </EuiPanel>
  );
};
