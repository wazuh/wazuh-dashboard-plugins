import { EuiButtonIcon, EuiDescriptionList, EuiHealth } from '@elastic/eui';
import React, { Component } from 'react';
import { MODULE_SCA_CHECK_RESULT_LABEL } from '../../../../../common/constants';
import { TableWzAPI } from '../../../common/tables';
import { ComplianceText, RuleText } from '../components';
import { getFilterValues } from './lib';

type Props = {
  agent: { [key: string]: any };
  lookingPolicy: { [key: string]: any };
  filters: any[];
};

type State = {
  agent: { [key: string]: any };
  lookingPolicy: { [key: string]: any };
  itemIdToExpandedRowMap: {};
  filters: any[];
  pageTableChecks: { pageIndex: 0 };
};

const searchBarWQLFieldSuggestions = [
  { label: 'condition', description: 'filter by check condition' },
  { label: 'description', description: 'filter by check description' },
  { label: 'file', description: 'filter by check file' },
  { label: 'rationale', description: 'filter by check rationale' },
  { label: 'reason', description: 'filter by check reason' },
  { label: 'registry', description: 'filter by check registry' },
  { label: 'remediation', description: 'filter by check remediation' },
  { label: 'result', description: 'filter by check result' },
  { label: 'title', description: 'filter by check title' },
];

const searchBarWQLOptions = {
  searchTermFields: [
    'command',
    'compliance.key',
    'compliance.value',
    'description',
    'directory',
    'file',
    'id',
    'title',
    'process',
    'registry',
    'rationale',
    'reason',
    'references',
    'remediation',
    'result',
    'rules.type',
    'rules.rule',
  ],
};

export class InventoryPolicyChecksTable extends Component<Props, State> {
  _isMount = false;
  columnsChecks: any;
  constructor(props) {
    super(props);
    const { agent, lookingPolicy, filters } = this.props;
    this.state = {
      agent,
      lookingPolicy,
      itemIdToExpandedRowMap: {},
      filters: filters || '',
      pageTableChecks: { pageIndex: 0 },
    };
    this.columnsChecks = [
      {
        field: 'id',
        name: 'ID',
        sortable: true,
        width: '100px',
      },
      {
        field: 'title',
        name: 'Title',
        sortable: true,
        truncateText: true,
      },
      {
        name: 'Target',
        truncateText: true,
        render: item => (
          <div>
            {item.file ? (
              <span>
                <b>File:</b> {item.file}
              </span>
            ) : item.directory ? (
              <span>
                <b>Directory:</b> {item.directory}
              </span>
            ) : item.process ? (
              <span>
                <b>Process: </b> {item.process}
              </span>
            ) : item.command ? (
              <span>
                <b>Command: </b> {item.command}
              </span>
            ) : item.registry ? (
              <span>
                <b>Registry: </b> {item.registry}
              </span>
            ) : (
              '-'
            )}
          </div>
        ),
      },
      {
        field: 'result',
        name: 'Result',
        truncateText: true,
        sortable: true,
        width: '150px',
        render: this.addHealthResultRender,
      },
      {
        align: 'right',
        width: '40px',
        isExpander: true,
        render: item => (
          <EuiButtonIcon
            onClick={() => this.toggleDetails(item)}
            aria-label={
              this.state.itemIdToExpandedRowMap[item.id] ? 'Collapse' : 'Expand'
            }
            iconType={
              this.state.itemIdToExpandedRowMap[item.id]
                ? 'arrowUp'
                : 'arrowDown'
            }
          />
        ),
      },
    ];
  }

  async componentDidUpdate(prevProps) {
    const { filters } = this.props;
    if (filters !== prevProps.filters) {
      this.setState({ filters: filters });
    }
  }

  componentWillUnmount() {
    this._isMount = false;
  }

  /**
   *
   * @param item
   */
  toggleDetails = item => {
    const itemIdToExpandedRowMap = { ...this.state.itemIdToExpandedRowMap };

    if (itemIdToExpandedRowMap[item.id]) {
      delete itemIdToExpandedRowMap[item.id];
    } else {
      let checks = '';
      checks += (item.rules || []).length > 1 ? 'Checks' : 'Check';
      checks += item.condition ? ` (Condition: ${item.condition})` : '';
      const complianceText =
        item.compliance && item.compliance.length
          ? item.compliance.map(el => `${el.key}: ${el.value}`).join('\n')
          : '';
      const listItems = [
        {
          title: 'Check not applicable due to:',
          description: item.reason,
        },
        {
          title: 'Rationale',
          description: item.rationale || '-',
        },
        {
          title: 'Remediation',
          description: item.remediation || '-',
        },
        {
          title: 'Description',
          description: item.description || '-',
        },
        {
          title: (item.directory || '').includes(',') ? 'Paths' : 'Path',
          description: item.directory,
        },
        {
          title: checks,
          description: <RuleText rules={item.rules.length ? item.rules : []} />,
        },
        {
          title: 'Compliance',
          description: <ComplianceText complianceText={complianceText} />,
        },
      ];
      const itemsToShow = listItems.filter(x => {
        return x.description;
      });
      itemIdToExpandedRowMap[item.id] = (
        <EuiDescriptionList listItems={itemsToShow} />
      );
    }
    this.setState({ itemIdToExpandedRowMap });
  };

  /**
   *
   * @param result
   * @returns
   */
  addHealthResultRender(result: keyof typeof MODULE_SCA_CHECK_RESULT_LABEL) {
    const color = (result: keyof typeof MODULE_SCA_CHECK_RESULT_LABEL) => {
      if (result.toLowerCase() === 'passed') {
        return 'success';
      } else if (result.toLowerCase() === 'failed') {
        return 'danger';
      } else {
        return 'subdued';
      }
    };

    return (
      <EuiHealth color={color(result)}>
        {MODULE_SCA_CHECK_RESULT_LABEL[result]}
      </EuiHealth>
    );
  }

  render() {
    /**
     *
     * @param item
     * @param idx
     * @returns
     */
    const getChecksRowProps = (item, idx) => {
      return {
        'data-test-subj': `sca-check-row-${idx}`,
        className: 'customRowClass',
        onClick: () => this.toggleDetails(item),
      };
    };

    const { filters } = this.state;
    const agentID = this.props?.agent?.id;
    const scaPolicyID = this.props?.lookingPolicy?.policy_id;

    return (
      <TableWzAPI
        title='Checks'
        endpoint={`/sca/${this.props.agent.id}/checks/${scaPolicyID}`}
        tableColumns={this.columnsChecks}
        tableInitialSortingField='id'
        tablePageSizeOptions={[10, 25, 50, 100]}
        rowProps={getChecksRowProps}
        tableProps={{
          isExpandable: true,
          itemIdToExpandedRowMap: this.state.itemIdToExpandedRowMap,
          itemId: 'id',
        }}
        downloadCsv
        showReload
        filters={filters}
        searchTable
        searchBarWQL={{
          options: searchBarWQLOptions,
          suggestions: {
            field(currentValue) {
              return searchBarWQLFieldSuggestions;
            },
            value: async (currentValue, { field }) => {
              try {
                return await getFilterValues(
                  field,
                  agentID,
                  scaPolicyID,
                  {
                    ...(currentValue ? { q: `${field}~${currentValue}` } : {}),
                  },
                  item => ({ label: item }),
                );
              } catch (error) {
                return [];
              }
            },
          },
        }}
      />
    );
  }
}
