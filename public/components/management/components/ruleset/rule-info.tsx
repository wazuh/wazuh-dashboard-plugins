import React, { useCallback, useEffect, useState } from 'react';
// Eui components
import {
  EuiAccordion,
  EuiBadge,
  EuiButtonEmpty,
  EuiButtonIcon,
  EuiFlexGrid,
  EuiFlexGroup,
  EuiFlexItem,
  EuiInMemoryTable,
  EuiLink,
  EuiLoadingSpinner,
  EuiPage,
  EuiPanel,
  EuiSpacer,
  EuiTitle,
  EuiToolTip,
} from '@elastic/eui';

import { connect } from 'react-redux';
import { compose } from 'redux';
import WzRequest from '../../../../react-services/wz-request';
import { useHistory } from 'react-router-dom';

import RulesetHandler from '../../utils/ruleset-handler';

import {
  cleanFileContent,
  cleanFilters,
  cleanInfo,
  updateFileContent,
  updateFilters,
} from '../../../../redux/actions/rulesetActions';

import WzTextWithTooltipTruncated from '../../../../components/common/wz-text-with-tooltip-if-truncated';

const mapStateToProps = (state) => {
  return {
    state: state.rulesetReducers,
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    updateFileContent: (content) => dispatch(updateFileContent(content)),
    cleanFileContent: () => dispatch(cleanFileContent()),
    updateFilters: (filters) => dispatch(updateFilters(filters)),
    cleanFilters: () => dispatch(cleanFilters()),
    cleanInfo: () => dispatch(cleanInfo()),
  };
};

export const WzRuleInfo = compose(
  connect(mapStateToProps, mapDispatchToProps
  )((props) => {
  const [complianceEquivalences, setComplianceEquivalences] = useState({
    pci: 'PCI DSS',
    gdpr: 'GDPR',
    gpg13: 'GPG 13',
    hipaa: 'HIPAA',
    'nist-800-53': 'NIST-800-53',
    tsc: 'TSC',
    mitreTactics: 'MITRE Tactics',
    mitreTechniques: 'MITRE Techniques',
    mitre: 'MITRE',
  });
  const [mitre, setMitre] = useState({
    mitreTactics: [],
    mitreLoading: false,
    mitreTechniques: [],
    mitreRuleId: '',
    mitreIds: [],
  });
  const rulesetHandler = RulesetHandler;
  const [currentRuleId, setCurrentRuleId] = useState(null);

  const [mitreRuleId, setMitreRuleId] = useState({} as any);
  const [mitreLoading, setMitreLoading] = useState(false);
  const [mitreTechniques, setMitreTechniques] = useState({} as any);
  const [mitreIds, setMitreIds] = useState({} as any);
  const [mitreTactics, setMitreTactics] = useState({} as any);
  const history = useHistory();
  const handleOnClickRedirect = useCallback((path) => history.push(path), [history]);

  useEffect(() => {
    document.body.scrollTop = 0; // For Safari
    document.documentElement.scrollTop = 0; // For Chrome, Firefox, IE and OperPa
  }, []);

  /**
   * Build an object with the compliance info about a rule
   * @param {Object} ruleInfo
   */
  const buildCompliance = (ruleInfo) => {
    const compliance = {};
    const complianceKeys = ['gdpr', 'gpg13', 'hipaa', 'nist-800-53', 'pci', 'tsc', 'mitre'];
    Object.keys(ruleInfo).forEach((key) => {
      if (complianceKeys.includes(key) && ruleInfo[key].length) compliance[key] = ruleInfo[key];
    });
    return compliance || {};
  };

  const buildComplianceBadges = (item) => {
    const badgeList = [];
    const fields = ['pci_dss', 'gpg13', 'hipaa', 'gdpr', 'nist_800_53', 'tsc', 'mitre'];
    const buildBadge = (field) => {
      const idGenerator = () => {
        return '_' + Math.random().toString(36).substr(2, 9);
      };

      return (
        <EuiToolTip content={item[field].join(', ')} key={idGenerator()} position="bottom">
          <EuiBadge
            onClick={(ev) => ev.stopPropagation()}
            onClickAriaLabel={field.toUpperCase()}
            color="hollow"
            style={{ margin: '1px 2px' }}
          >
            {field.toUpperCase()}
          </EuiBadge>
        </EuiToolTip>
      );
    };
    try {
      for (const field of fields) {
        if (item[field].length) {
          badgeList.push(buildBadge(field));
        }
      }
    } catch (error) {}

    return <div>{badgeList}</div>;
  };

  /**
   * Clean the existing filters and sets the new ones and back to the previous section
   */
  const setNewFiltersAndBack = (filters) => {
    window.location.href = window.location.href.replace(new RegExp('redirectRule=' + '[^&]*'), '');
    props.cleanFilters();
    props.updateFilters(filters);
    props.cleanInfo();
  };

  /**
   * Render the basic information in a list
   * @param {Number} id
   * @param {Number} level
   * @param {String} file
   * @param {String} path
   * @param groups
   */
  const renderInfo = (id, level, file, path, groups) => {
    return (
      <EuiFlexGrid columns={4}>
        <EuiFlexItem key="rule_ids" grow={1}>
          <b style={{ paddingBottom: 6 }}>ID</b>
          <span>
            <EuiToolTip position="top" content={`Filter by this rule ID: ${id}`}>
              <EuiLink
                onClick={async () => setNewFiltersAndBack([{ field: 'rule_ids', value: id }])}
              >
                {id}
              </EuiLink>
            </EuiToolTip>
          </span>
        </EuiFlexItem>
        <EuiFlexItem key="level" grow={1}>
          <b style={{ paddingBottom: 6 }}>Level</b>
          <span>
            <EuiToolTip position="top" content={`Filter by this level: ${level}`}>
              <EuiLink
                onClick={async () => setNewFiltersAndBack([{ field: 'level', value: level }])}
              >
                {level}
              </EuiLink>
            </EuiToolTip>
          </span>
        </EuiFlexItem>
        <EuiFlexItem key="file" grow={1}>
          <b style={{ paddingBottom: 6 }}>File</b>
          <span>
            <EuiToolTip position="top" content={`Filter by this file: ${file}`}>
              <EuiLink
                onClick={async () => setNewFiltersAndBack([{ field: 'filename', value: file }])}
              >
                {file}
              </EuiLink>
            </EuiToolTip>
          </span>
        </EuiFlexItem>
        <EuiFlexItem key="path" grow={1}>
          <b style={{ paddingBottom: 6 }}>Path</b>
          <span>
            <EuiToolTip position="top" content={`Filter by this path: ${path}`}>
              <EuiLink
                onClick={async () =>
                  setNewFiltersAndBack([{ field: 'relative_dirname', value: path }])
                }
              >
                {path}
              </EuiLink>
            </EuiToolTip>
          </span>
        </EuiFlexItem>
        <EuiFlexItem key="Groups" grow={1}>
          <b style={{ paddingBottom: 6 }}>Groups</b>
          {renderGroups(groups)}
        </EuiFlexItem>
        <EuiSpacer size="s" />
      </EuiFlexGrid>
    );
  };

  const getFormattedDetails = (value) => {
    if (Array.isArray(value) && value[0].type) {
      let link: string = '';
      let name = '';

      value.forEach((item) => {
        if (item.type === 'cve') name = item.name;
        if (item.type === 'link')
          link = (
            <a href={item.name} target="_blank">
              {item.name}
            </a>
          );
      });
      return (
        <span>
          {name}: {link}
        </span>
      );
    } else if (value && typeof value === 'object' && value.constructor === Object) {
      let list = [];
      Object.keys(value).forEach((key, idx) => {
        list.push(
          <span key={key}>
            {key}:&nbsp;
            {value[key]}
            {idx < Object.keys(value).length - 1 && ', '}
            <br />
          </span>
        );
      });
      return (
        <ul>
          <li>{list}</li>
        </ul>
      );
    } else {
      return <WzTextWithTooltipTruncated position="top">{value}</WzTextWithTooltipTruncated>;
    }
  };

  /**
   * Render a list with the details
   * @param {Array} details
   */
  const renderDetails = (details) => {
    const detailsToRender = [];
    const capitalize = (str) => str[0].toUpperCase() + str.slice(1);
    // Exclude group key of details
    Object.keys(details)
      .filter((key) => key !== 'group')
      .forEach((key) => {
        detailsToRender.push(
          <EuiFlexItem key={key} grow={1} style={{ maxWidth: 'calc(25% - 24px)' }}>
            <b style={{ paddingBottom: 6 }}>{capitalize(key)}</b>
            {details[key] === '' ? 'true' : getFormattedDetails(details[key])}
          </EuiFlexItem>
        );
      });
    return <EuiFlexGrid columns={4}>{detailsToRender}</EuiFlexGrid>;
  };

  /**
   * Render the groups
   * @param {Array} groups
   */
  const renderGroups = (groups) => {
    const listGroups = [];
    groups.forEach((group, index) => {
      listGroups.push(
        <span key={group}>
          <EuiLink onClick={async () => setNewFiltersAndBack([{ field: 'group', value: group }])}>
            <EuiToolTip position="top" content={`Filter by this group: ${group}`}>
              <span>{group}</span>
            </EuiToolTip>
          </EuiLink>
          {index < groups.length - 1 && ', '}
        </span>
      );
    });
    return (
      <ul>
        <li>{listGroups}</li>
      </ul>
    );
  };

  const addMitreInformation = async (compliance, currentRuleId) => {
    try {
      setMitreLoading(true);
      setMitreRuleId(currentRuleId);
      const mitreName = [];
      const mitreIds = [];
      const mitreTactics = await Promise.all(
        compliance.map(async (i) => {
          const data = await WzRequest.apiReq('GET', '/mitre', {
            params: {
              q: `id=${i}`,
            },
          });
          const formattedData = (((data || {}).data.data || {}).affected_items || [])[0] || {};
          const techniques = formattedData.phase_name || [];
          mitreName.push(formattedData.json.name);
          mitreIds.push(i);
          return techniques;
        })
      );
      if (mitreTactics.length) {
        let removeDuplicates = (arr) => arr.filter((v, i) => arr.indexOf(v) === i);
        const uniqueTactics = removeDuplicates(mitreTactics.flat());

        setMitreLoading(false);
        setMitreRuleId(currentRuleId);
        setMitreIds(mitreIds);
        setMitreTactics(uniqueTactics);
        setMitreTechniques(mitreName);
      }
    } catch (error) {
      setMitreLoading(false);
    }
  };

  /**
   * Render the compliance(HIPAA, NIST...)
   * @param {Array} compliance
   */
  const renderCompliance = (compliance) => {
    const newCurrentRuleId = currentRuleId ? currentRuleId : props.state.ruleInfo.current;
    if (compliance.mitre && compliance.mitre.length && newCurrentRuleId !== mitreRuleId) {
      addMitreInformation(compliance.mitre, newCurrentRuleId);
    } else if (newCurrentRuleId !== mitreRuleId) {
      setMitreLoading(false);
      setMitreRuleId(newCurrentRuleId);
      setMitreIds([]);
      setMitreTactics([]);
      setMitreTechniques([]);
    }
    const listCompliance = [];
    if (compliance.mitre) delete compliance.mitre;
    const keys = Object.keys(compliance);
    for (let i in Object.keys(keys)) {
      const key = keys[i];

      const values = compliance[key].map((element, index) => {
        return (
          <span key={index}>
            <EuiLink onClick={async () => setNewFiltersAndBack([{ field: key, value: element }])}>
              <EuiToolTip position="top" content="Filter by this compliance">
                <span>{element}</span>
              </EuiToolTip>
            </EuiLink>
            {index < compliance[key].length - 1 && ', '}
          </span>
        );
      });

      listCompliance.push(
        <EuiFlexItem key={key} grow={1} style={{ maxWidth: 'calc(25% - 24px)' }}>
          <b style={{ paddingBottom: 6 }}>{complianceEquivalences[key]}</b>
          <p>{values}</p>
          <EuiSpacer size="s" />
        </EuiFlexItem>
      );
    }

    if (mitreTechniques && mitreTechniques.length) {
      const values = mitreTechniques.map((element, index) => {
        return (
          <span key={index}>
            <EuiLink
              onClick={async () =>
                setNewFiltersAndBack([{ field: 'mitre', value: mitreIds[index] }])
              }
            >
              <EuiToolTip position="top" content="Filter by this compliance">
                <span>{element}</span>
              </EuiToolTip>
            </EuiLink>
            {index < mitreTechniques.length - 1 && ', '}
          </span>
        );
      });
      listCompliance.push(
        <EuiFlexItem key={listCompliance.length} grow={1} style={{ maxWidth: 'calc(25% - 24px)' }}>
          <b style={{ paddingBottom: 6 }}>{complianceEquivalences['mitreTechniques']}</b>
          {(mitreLoading && <EuiLoadingSpinner size="m" />) || <p>{values}</p>}
          <EuiSpacer size="s" />
        </EuiFlexItem>
      );
    }

    if (mitreTactics && mitreTactics.length) {
      listCompliance.push(
        <EuiFlexItem key={listCompliance.length} grow={1} style={{ maxWidth: 'calc(25% - 24px)' }}>
          <b style={{ paddingBottom: 6 }}>{complianceEquivalences['mitreTactics']}</b>
          <p>{mitreTactics.toString()}</p>
          <EuiSpacer size="s" />
        </EuiFlexItem>
      );
    }

    return <EuiFlexGrid columns={4}>{listCompliance}</EuiFlexGrid>;
  };

  /**
   * Changes between rules
   * @param {Number} ruleId
   */
  const changeBetweenRules = (ruleId) => {
    setCurrentRuleId(ruleId);
    handleOnClickRedirect(`/management/rules/${ruleId}`);
  };

  /**
   * Update style for title with elements $()
   * @param {string} value
   */
  const updateStyleTitle = (value) => {
    if (value === undefined) return '';
    const regex = /\$(.*?)\)/g;
    let result = value.match(regex);
    if (result !== null) {
      for (const oldValue of result) {
        let newValue = oldValue.replace('$(', `<span style="color:#006BB4">`);
        newValue = newValue.replace(')', ' </span>');
        value = value.replace(oldValue, newValue);
      }
    }
    return value;
  };

  const { ruleInfo, isLoading } = props.state;
  const newCurrentRuleId = currentRuleId ? currentRuleId : ruleInfo.current;
  const rules = ruleInfo.affected_items;
  const currentRuleArr = rules.filter((r) => {
    return r.id === newCurrentRuleId;
  });
  const currentRuleInfo = currentRuleArr[0];
  const { description, details, filename, relative_dirname, level, id, groups } = currentRuleInfo;
  const compliance = buildCompliance(currentRuleInfo);

  const onClickRow = (item) => {
    return {
      onClick: () => {
        changeBetweenRules(item.id);
      },
    };
  };

  const [columns, setColumns] = useState([
    {
      field: 'id',
      name: 'ID',
      align: 'left',
      sortable: true,
      width: '5%',
    },
    {
      field: 'description',
      name: 'Description',
      align: 'left',
      sortable: true,
      width: '30%',
      render: (value, item) => {
        if (value === undefined) return '';
        const regex = /\$(.*?)\)/g;
        let result = value.match(regex);
        if (result !== null) {
          for (const oldValue of result) {
            let newValue = oldValue.replace('$(', `<strong style="color:#006BB4">`);
            newValue = newValue.replace(')', ' </strong>');
            value = value.replace(oldValue, newValue);
          }
        }
        return (
          <div>
            <span dangerouslySetInnerHTML={{ __html: value }} />
          </div>
        );
      },
    },
    {
      field: 'groups',
      name: 'Groups',
      align: 'left',
      sortable: true,
      width: '10%',
    },
    {
      name: 'Compliance',
      render: buildComplianceBadges,
    },
    {
      field: 'level',
      name: 'Level',
      align: 'left',
      sortable: true,
      width: '5%',
    },
    {
      field: 'filename',
      name: 'File',
      align: 'left',
      sortable: true,
      width: '15%',
      render: (value, item) => {
        return (
          <EuiToolTip position="top" content={`Show ${value} content`}>
            <EuiLink
              onClick={async (event) => {
                event.stopPropagation();
                const noLocal = item.relative_dirname.startsWith('ruleset/');
                const result = await rulesetHandler.getRuleContent(value, noLocal);
                const file = {
                  name: value,
                  content: result,
                  path: item.relative_dirname,
                };
                props.updateFileContent(file);
              }}
            >
              {value}
            </EuiLink>
          </EuiToolTip>
        );
      },
    },
  ]);

  return (
    <EuiPage style={{ background: 'transparent' }}>
      <EuiFlexGroup>
        <EuiFlexItem>
          {/* Rule description name */}
          <EuiFlexGroup>
            <EuiFlexItem>
              <EuiTitle>
                <span style={{ fontSize: '22px' }}>
                  <EuiToolTip position="right" content="Back to rules">
                    <EuiButtonIcon
                      aria-label="Back"
                      color="primary"
                      iconSize="l"
                      iconType="arrowLeft"
                      onClick={() => {
                        handleOnClickRedirect(`/management/rules`);
                        props.cleanInfo();
                      }}
                    />
                  </EuiToolTip>
                  {<span dangerouslySetInnerHTML={{ __html: updateStyleTitle(description) }} />}
                </span>
              </EuiTitle>
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              <EuiButtonEmpty
                iconType="popout"
                aria-label="popout"
                href={`#/overview?tab=general&tabView=panels&addRuleFilter=${id}`}
                target="blank"
              >
                View alerts of this Rule
              </EuiButtonEmpty>
            </EuiFlexItem>
          </EuiFlexGroup>
          {/* Cards */}
          <EuiPanel style={{ margin: '16px 0', padding: '16px 16px 0px 16px' }}>
            <EuiFlexGroup>
              {/* General info */}
              <EuiFlexItem style={{ marginBottom: 16, marginTop: 8 }}>
                <EuiAccordion
                  id="Info"
                  buttonContent={
                    <EuiTitle size="s">
                      <h3>Information</h3>
                    </EuiTitle>
                  }
                  paddingSize="none"
                  initialIsOpen={true}
                >
                  <div className="flyout-row details-row">
                    {renderInfo(id, level, filename, relative_dirname, groups)}
                  </div>
                </EuiAccordion>
              </EuiFlexItem>
            </EuiFlexGroup>
            {/* Details */}
            <EuiFlexGroup>
              <EuiFlexItem style={{ marginTop: 8 }}>
                <EuiAccordion
                  id="Details"
                  buttonContent={
                    <EuiTitle size="s">
                      <h3>Details</h3>
                    </EuiTitle>
                  }
                  paddingSize="none"
                  initialIsOpen={true}
                >
                  <div className="flyout-row details-row">{renderDetails(details)}</div>
                </EuiAccordion>
              </EuiFlexItem>
            </EuiFlexGroup>
            {/* Compliance */}
            {Object.keys(compliance).length > 0 && (
              <EuiFlexGroup>
                <EuiFlexItem style={{ marginTop: 8 }}>
                  <EuiAccordion
                    id="Compliance"
                    buttonContent={
                      <EuiTitle size="s">
                        <h3>Compliance</h3>
                      </EuiTitle>
                    }
                    paddingSize="none"
                    initialIsOpen={true}
                  >
                    <div className="flyout-row details-row">{renderCompliance(compliance)}</div>
                  </EuiAccordion>
                </EuiFlexItem>
              </EuiFlexGroup>
            )}
            Table
            <EuiFlexGroup>
              <EuiFlexItem style={{ marginTop: 8 }}>
                <EuiAccordion
                  id="Related"
                  buttonContent={
                    <EuiTitle size="s">
                      <h3>Related rules</h3>
                    </EuiTitle>
                  }
                  paddingSize="none"
                  initialIsOpen={true}
                >
                  <div className="flyout-row related-rules-row">
                    <EuiFlexGroup>
                      <EuiFlexItem>
                        <EuiInMemoryTable
                          itemId="id"
                          items={rules}
                          rowProps={onClickRow}
                          columns={columns}
                          pagination={true}
                          loading={isLoading}
                          sorting={true}
                          message={false}
                        />
                      </EuiFlexItem>
                    </EuiFlexGroup>
                  </div>
                </EuiAccordion>
              </EuiFlexItem>
            </EuiFlexGroup>
          </EuiPanel>
        </EuiFlexItem>
      </EuiFlexGroup>
    </EuiPage>
  );
})
) as React.ElementType;

