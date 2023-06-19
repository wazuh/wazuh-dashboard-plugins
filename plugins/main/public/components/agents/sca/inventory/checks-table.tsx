import { EuiButtonIcon, EuiDescriptionList, EuiHealth } from '@elastic/eui';
import React, { Component } from 'react';
import { MODULE_SCA_CHECK_RESULT_LABEL } from '../../../../../common/constants';
import { TableWzAPI } from '../../../common/tables';
import { IWzSuggestItem } from '../../../wz-search-bar';
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

export class InventoryPolicyChecksTable extends Component<Props, State> {
  _isMount = false;
  suggestions: IWzSuggestItem[] = [];
  columnsChecks: any;
  constructor(props) {
    super(props);
    const { agent, lookingPolicy, filters } = this.props;
    this.state = {
      agent,
      lookingPolicy,
      itemIdToExpandedRowMap: {},
      filters: filters || [],
      pageTableChecks: { pageIndex: 0 },
    };
    this.suggestions = [
      {
        type: 'params',
        label: 'condition',
        description: 'Filter by check condition',
        operators: ['=', '!='],
        values: (value) =>
          getFilterValues(
            'condition',
            value,
            this.props.agent.id,
            this.props.lookingPolicy.policy_id
          ),
      },
      {
        type: 'params',
        label: 'description',
        description: 'Filter by check description',
        operators: ['=', '!='],
        values: (value) =>
          getFilterValues(
            'description',
            value,
            this.props.agent.id,
            this.props.lookingPolicy.policy_id
          ),
      },
      {
        type: 'params',
        label: 'file',
        description: 'Filter by check file',
        operators: ['=', '!='],
        values: (value) =>
          getFilterValues('file', value, this.props.agent.id, this.props.lookingPolicy.policy_id),
      },
      {
        type: 'params',
        label: 'registry',
        description: 'Filter by check registry',
        operators: ['=', '!='],
        values: (value) =>
          getFilterValues(
            'registry',
            value,
            this.props.agent.id,
            this.props.lookingPolicy.policy_id
          ),
      },
      {
        type: 'params',
        label: 'rationale',
        description: 'Filter by check rationale',
        operators: ['=', '!='],
        values: (value) =>
          getFilterValues(
            'rationale',
            value,
            this.props.agent.id,
            this.props.lookingPolicy.policy_id
          ),
      },
      {
        type: 'params',
        label: 'reason',
        description: 'Filter by check reason',
        operators: ['=', '!='],
        values: (value) =>
          getFilterValues('reason', value, this.props.agent.id, this.props.lookingPolicy.policy_id),
      },
      {
        type: 'params',
        label: 'remediation',
        description: 'Filter by check remediation',
        operators: ['=', '!='],
        values: (value) =>
          getFilterValues(
            'remediation',
            value,
            this.props.agent.id,
            this.props.lookingPolicy.policy_id
          ),
      },
      {
        type: 'params',
        label: 'result',
        description: 'Filter by check result',
        operators: ['=', '!='],
        values: (value) =>
          getFilterValues('result', value, this.props.agent.id, this.props.lookingPolicy.policy_id),
      },
      {
        type: 'params',
        label: 'title',
        description: 'Filter by check title',
        operators: ['=', '!='],
        values: (value) =>
          getFilterValues('title', value, this.props.agent.id, this.props.lookingPolicy.policy_id),
      },
    ];
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
        render: (item) => (
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
        render: (item) => (
          <EuiButtonIcon
            onClick={() => this.toggleDetails(item)}
            aria-label={this.state.itemIdToExpandedRowMap[item.id] ? 'Collapse' : 'Expand'}
            iconType={this.state.itemIdToExpandedRowMap[item.id] ? 'arrowUp' : 'arrowDown'}
          />
        ),
      },
    ];
  }

  async componentDidMount() {}

  async componentDidUpdate(prevProps) {
    const { filters } =  this.props
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
  toggleDetails = (item) => {
    const itemIdToExpandedRowMap = { ...this.state.itemIdToExpandedRowMap };

    if (itemIdToExpandedRowMap[item.id]) {
      delete itemIdToExpandedRowMap[item.id];
    } else {
      let checks = '';
      checks += (item.rules || []).length > 1 ? 'Checks' : 'Check';
      checks += item.condition ? ` (Condition: ${item.condition})` : '';
      const complianceText =
        item.compliance && item.compliance.length
          ? item.compliance.map((el) => `${el.key}: ${el.value}`).join('\n')
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
      const itemsToShow = listItems.filter((x) => {
        return x.description;
      });
      itemIdToExpandedRowMap[item.id] = <EuiDescriptionList listItems={itemsToShow} />;
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

    return (
      <>
        <TableWzAPI
          title="Checks"
          tableColumns={this.columnsChecks}
          tableInitialSortingField="id"
          searchTable={true}
          searchBarSuggestions={this.suggestions}
          endpoint={`/sca/${this.props.agent.id}/checks/${this.state.lookingPolicy.policy_id}`}
          rowProps={getChecksRowProps}
          tableProps={{
            isExpandable: true,
            itemIdToExpandedRowMap: this.state.itemIdToExpandedRowMap,
            itemId: 'id',
          }}
          downloadCsv
          showReload
          filters={this.state.filters}
          onFiltersChange={(filters) => this.setState({ filters })}
          tablePageSizeOptions={[10, 25, 50, 100]}
        />
      </>
    );
  }
}
