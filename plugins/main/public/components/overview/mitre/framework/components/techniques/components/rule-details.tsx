import React, { useMemo } from 'react';
import {
  EuiAccordion,
  EuiFlexGroup,
  EuiFlexItem,
  EuiIcon,
  EuiLink,
  EuiTitle,
  EuiFlexGrid,
  EuiToolTip,
  EuiBadge,
} from '@elastic/eui';
import WzTextWithTooltipTruncated from '../../../../../../common/wz-text-with-tooltip-if-truncated';
import { RedirectAppLinks } from '../../../../../../../../../../src/plugins/opensearch_dashboards_react/public';
import { getCore } from '../../../../../../../kibana-services';
import { rules } from '../../../../../../../utils/applications';

type Props = {
  data: any;
  onClick: (value: any) => void;
};

const complianceEquivalences = {
  pci: 'PCI DSS',
  gdpr: 'GDPR',
  gpg13: 'GPG 13',
  hipaa: 'HIPAA',
  mitre: 'MITRE',
  'nist-800-53': 'NIST-800-53',
};

const getValueAsString = value => {
  if (value && typeof value === 'object' && value.constructor === Object) {
    let list: any[] = [];
    Object.keys(value).forEach((key, idx) => {
      list.push(
        <span key={key}>
          {key}:&nbsp;
          {value[key]}
          {idx < Object.keys(value).length - 1 && ', '}
          <br />
        </span>,
      );
    });
    return (
      <ul>
        <li>{list}</li>
      </ul>
    );
  } else {
    return value.toString();
  }
};

/**
 * Build an object with the compliance info about a rule
 * @param {Object} ruleInfo
 */
const buildCompliance = ruleInfo => {
  if (!ruleInfo) return {};
  const compliance = {};
  const complianceKeys = [
    'gdpr',
    'gpg13',
    'hipaa',
    'nist-800-53',
    'pci',
    'mitre',
  ];
  Object.keys(ruleInfo).forEach(key => {
    if (complianceKeys.includes(key) && ruleInfo[key].length)
      compliance[key] = ruleInfo[key];
  });
  return compliance || {};
};

const getFormattedDetails = value => {
  if (Array.isArray(value) && value[0].type) {
    let link = '';
    let name = '';

    value.forEach(item => {
      if (item.type === 'cve') {
        name = item.name;
      }
      if (item.type === 'link') {
        link = (
          <EuiLink href={item.name} target='_blank' rel='noopener noreferrer'>
            {item.name}
          </EuiLink>
        );
      }
    });
    return (
      <span>
        {name}: {link}
      </span>
    );
  } else {
    const _value = typeof value === 'string' ? value : getValueAsString(value);
    return (
      <WzTextWithTooltipTruncated position='top'>
        {_value}
      </WzTextWithTooltipTruncated>
    );
  }
};

const getComplianceKey = key => {
  if (key === 'pci') {
    return 'rule.pci_dss';
  }
  if (key === 'gdpr') {
    return 'rule.gdpr';
  }
  if (key === 'gpg13') {
    return 'rule.gpg13';
  }
  if (key === 'hipaa') {
    return 'rule.hipaa';
  }
  if (key === 'nist-800-53') {
    return 'rule.nist_800_53';
  }
  if (key === 'mitre') {
    return 'rule.mitre.id';
  }

  return '';
};

const RuleDetails = (props: Props) => {
  const { data: ruleData, onClick } = props;
  const { level, file, path, groups, details } = ruleData;
  const compliance = useMemo(() => buildCompliance(ruleData), [ruleData]);
  const id = ruleData.id;

  const addFilter = value => {
    onClick && onClick(value);
  };

  const renderCompliance = compliance => {
    if (!compliance || Object.keys(compliance).length === 0) {
      return <div>No compliance information available</div>;
    }

    const styleTitle = { fontSize: '14px', fontWeight: 500 };
    return (
      <EuiFlexGrid columns={4}>
        {Object.keys(compliance)
          .sort()
          .map((complianceCategory, index) => {
            return (
              <EuiFlexItem
                key={`rule-compliance-${complianceCategory}-${index}`}
              >
                <div style={styleTitle}>
                  {complianceEquivalences[complianceCategory]}
                </div>
                <div>
                  {compliance[complianceCategory]
                    .map(comp => {
                      const filter = {
                        [getComplianceKey(complianceCategory)]: comp,
                      };
                      return (
                        <EuiToolTip
                          key={`rule-compliance-tooltip-${complianceCategory}-${
                            Math.random() * (index - 0) + index
                          }`}
                          position='top'
                          content={`Filter by this compliance`}
                        >
                          <EuiBadge
                            color='hollow'
                            onClick={() => addFilter(filter)}
                            onClickAriaLabel={comp}
                            title={null}
                          >
                            {comp}
                          </EuiBadge>
                        </EuiToolTip>
                      );
                    })
                    .reduce((prev, cur) => [prev, ' ', cur])}
                </div>
              </EuiFlexItem>
            );
          })}
      </EuiFlexGrid>
    );
  };
  const renderDetails = details => {
    if (!details) return null;

    const detailsToRender: any = [];
    const capitalize = str => str[0].toUpperCase() + str.slice(1);
    // Exclude group key of details
    Object.keys(details)
      .filter(key => key !== 'group')
      .forEach(key => {
        const detail = details[key];
        const detailValue =
          typeof detail === 'object' ? JSON.stringify(detail) : detail;
        detailsToRender.push(
          <EuiFlexItem
            key={key}
            grow={1}
            style={{ maxWidth: 'calc(25% - 24px)', maxHeight: 45 }}
          >
            <b style={{ paddingBottom: 6 }}>{capitalize(key)}</b>
            {detailValue === '' ? 'true' : getFormattedDetails(detailValue)}
          </EuiFlexItem>,
        );
      });
    return <EuiFlexGrid columns={4}>{detailsToRender}</EuiFlexGrid>;
  };

  const renderGroups = groups => {
    if (!groups) return null;
    const listGroups: any = [];
    groups.forEach((group, index) => {
      const groupValue =
        typeof group === 'object' ? JSON.stringify(group) : group;
      listGroups.push(
        <span key={groupValue}>
          <EuiLink onClick={() => addFilter({ 'rule.groups': groupValue })}>
            <EuiToolTip
              position='top'
              content={`Filter by this group: ${groupValue}`}
            >
              <span>{groupValue}</span>
            </EuiToolTip>
          </EuiLink>
          {index < groups.length - 1 && ', '}
        </span>,
      );
    });
    return (
      <ul>
        <li>{listGroups}</li>
      </ul>
    );
  };

  const renderInfo = (id, level, file, path, groups) => {
    return (
      <EuiFlexGrid columns={4}>
        <EuiFlexItem key='id' grow={1}>
          <b style={{ paddingBottom: 6 }}>ID</b>
          <EuiToolTip position='top' content={`Filter by this rule ID: ${id}`}>
            <EuiLink onClick={() => addFilter({ 'rule.id': id })}>{id}</EuiLink>
          </EuiToolTip>
        </EuiFlexItem>
        <EuiFlexItem key='level' grow={1}>
          <b style={{ paddingBottom: 6 }}>Level</b>
          <EuiToolTip position='top' content={`Filter by this level: ${level}`}>
            <EuiLink onClick={async () => addFilter({ 'rule.level': level })}>
              {level}
            </EuiLink>
          </EuiToolTip>
        </EuiFlexItem>
        <EuiFlexItem key='file' grow={1}>
          <b style={{ paddingBottom: 6 }}>File</b>
          {file}
        </EuiFlexItem>
        <EuiFlexItem key='path' grow={1}>
          <b style={{ paddingBottom: 6 }}>Path</b>
          {path}
        </EuiFlexItem>
        <EuiFlexItem key='Groups' grow={1}>
          <b style={{ paddingBottom: 6 }}>Groups</b>
          {renderGroups(groups)}
        </EuiFlexItem>
      </EuiFlexGrid>
    );
  };

  return (
    <EuiFlexGroup direction='column' gutterSize='none'>
      <EuiFlexItem style={{ marginTop: 8 }}>
        <EuiAccordion
          id='Info'
          buttonContent={
            <EuiTitle size='s'>
              <h3>Information</h3>
            </EuiTitle>
          }
          extraAction={
            <RedirectAppLinks application={getCore().application}>
              <EuiLink
                target='_blank'
                style={{ paddingTop: 5 }}
                rel='noopener noreferrer'
                href={`${rules.id}#/manager/?tab=rules&redirectRule=${id}`}
              >
                <EuiIcon type='popout' color='primary' />
                &nbsp; View in Rules
              </EuiLink>
            </RedirectAppLinks>
          }
          initialIsOpen={true}
        >
          <div className='flyout-row details-row'>
            {renderInfo(id, level, file, path, groups)}
          </div>
        </EuiAccordion>
      </EuiFlexItem>
      <EuiFlexItem style={{ marginTop: 8 }}>
        <EuiAccordion
          id='Details'
          buttonContent={
            <EuiTitle size='s'>
              <h3>Details</h3>
            </EuiTitle>
          }
          initialIsOpen={true}
        >
          <div className='flyout-row details-row'>{renderDetails(details)}</div>
        </EuiAccordion>
      </EuiFlexItem>
      <EuiFlexItem style={{ marginTop: 8 }}>
        <EuiAccordion
          id='Compliance'
          buttonContent={
            <EuiTitle size='s'>
              <h3>Compliance</h3>
            </EuiTitle>
          }
          initialIsOpen={true}
        >
          <div className='flyout-row details-row'>
            {renderCompliance(compliance)}
          </div>
        </EuiAccordion>
      </EuiFlexItem>
    </EuiFlexGroup>
  );
};

export default RuleDetails;
