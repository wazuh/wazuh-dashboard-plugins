import React from 'react';
import {
    EuiAccordion,
    EuiFlexGroup,
    EuiFlexItem,
    EuiIcon,
    EuiLink,
    EuiSpacer,
    EuiTitle,
    EuiFlexGrid,
    EuiToolTip,
    EuiBadge
} from '@elastic/eui';

type Props = {
    item: any;
}

/**
 * Build an object with the compliance info about a rule
 * @param {Object} ruleInfo
 */
const buildCompliance = (ruleInfo) => {
    const compliance = {};
    const complianceKeys = ['gdpr', 'gpg13', 'hipaa', 'nist-800-53', 'pci', 'mitre'];
    Object.keys(ruleInfo).forEach(key => {
        if (complianceKeys.includes(key) && ruleInfo[key].length) compliance[key] = ruleInfo[key]
    });
    return compliance || {};
}

const getFormattedDetails = (details) => {
    if (Array.isArray(details)) {
        return details.join(', ');
    }
    return details;
}

const getComplianceKey = (key) => {
    if (key === 'pci') {
        return 'rule.pci_dss'
    }
    if (key === 'gdpr') {
        return 'rule.gdpr'
    }
    if (key === 'gpg13') {
        return 'rule.gpg13'
    }
    if (key === 'hipaa') {
        return 'rule.hipaa'
    }
    if (key === 'nist-800-53') {
        return 'rule.nist_800_53'
    }
    if (key === 'mitre') {
        return 'rule.mitre.id'
    }

    return "";
}

const RuleDetails = (props: Props) => {
    const { id, level, file, path, groups, details } = props.item.rule;
    const compliance = buildCompliance(props.item);

    const renderCompliance = (compliance) => {
        const styleTitle = { fontSize: "14px", fontWeight: 500 };
        return (
            <EuiFlexGrid columns={4}>
                {Object.keys(compliance).sort().map((complianceCategory, index) => {
                    return (
                        <EuiFlexItem key={`rule-compliance-${complianceCategory}-${index}`}>
                            <div style={styleTitle}>{this.complianceEquivalences[complianceCategory]}</div>
                            <div>
                                {compliance[complianceCategory].map(comp => {
                                    const filter = {
                                        [getComplianceKey(complianceCategory)]: comp
                                    };
                                    return (
                                        <EuiToolTip
                                            key={`rule-compliance-tooltip-${complianceCategory}-${(Math.random() * (index - 0)) + index}`}
                                            position="top"
                                            content={`Filter by this compliance`}>
                                            <EuiBadge
                                                color="hollow"
                                                //onClick={() => this.props.addFilter(filter)}
                                                onClickAriaLabel={comp}
                                                title={null}
                                            >
                                                {comp}
                                            </EuiBadge>
                                        </EuiToolTip>
                                    )
                                }).reduce((prev, cur) => [prev, ' ', cur])}
                            </div>
                        </EuiFlexItem>
                    )
                })}
            </EuiFlexGrid>
        );
    }
    const renderDetails = (details) => {
        const detailsToRender: any = [];
        const capitalize = str => str[0].toUpperCase() + str.slice(1);
        // Exclude group key of details
        Object.keys(details).filter(key => key !== 'group').forEach((key) => {
            detailsToRender.push(
                <EuiFlexItem key={key} grow={1} style={{ maxWidth: 'calc(25% - 24px)', maxHeight: 41 }}>
                    <b style={{ paddingBottom: 6 }}>{capitalize(key)}</b>{details[key] === '' ? 'true' : getFormattedDetails(details[key])}
                </EuiFlexItem>
            );
        });
        return (
            <EuiFlexGrid columns={4}>
                {detailsToRender}
            </EuiFlexGrid>
        )
    }


    const renderGroups = (groups) => {
        const listGroups: any = [];
        groups.forEach((group, index) => {
            listGroups.push(
                <span key={group}>
                    <EuiLink
                    //onClick={async () => this.props.addFilter({ 'rule.groups': group })}
                    >
                        <EuiToolTip
                            position="top"
                            content={`Filter by this group: ${group}`}
                        >
                            <span>{group}</span>
                        </EuiToolTip>
                    </EuiLink>
                    {index < groups.length - 1 && ', '}
                </span>
            );
        });
        return (
            <ul>
                <li>
                    {listGroups}
                </li>
            </ul>
        );
    }

    const renderInfo = (id, level, file, path, groups) => {
        return (
            <EuiFlexGrid columns={4}>
                <EuiFlexItem key="id" grow={1}>
                    <b style={{ paddingBottom: 6 }}>ID</b>
                    <EuiToolTip position="top" content={`Filter by this rule ID: ${id}`}>
                        <EuiLink
                        //onClick={async () => this.props.addFilter({ 'rule.id': id })}
                        >
                            {id}
                        </EuiLink>
                    </EuiToolTip>
                </EuiFlexItem>
                <EuiFlexItem key="level" grow={1}>
                    <b style={{ paddingBottom: 6 }}>Level</b>
                    <EuiToolTip position="top" content={`Filter by this level: ${level}`}>
                        <EuiLink
                        //onClick={async () => this.props.addFilter({ "rule.level": level })}
                        >
                            {level}
                        </EuiLink>
                    </EuiToolTip>
                </EuiFlexItem>
                <EuiFlexItem key="file" grow={1}>
                    <b style={{ paddingBottom: 6 }}>File</b>{file}
                </EuiFlexItem>
                <EuiFlexItem key="path" grow={1}>
                    <b style={{ paddingBottom: 6 }}>Path</b>{path}
                </EuiFlexItem>
                <EuiFlexItem key="Groups" grow={1}><b style={{ paddingBottom: 6 }}>Groups</b>
                    {renderGroups(groups)}
                </EuiFlexItem>
                <EuiSpacer size="s" />
            </EuiFlexGrid>
        );
    }

    return (
        <div className="rule_reset_display_anchor">
            <EuiSpacer size='s' />
            <EuiFlexGroup justifyContent='spaceAround'>
                <EuiFlexItem style={{ marginBottom: '8' }}>
                    <EuiAccordion
                        id="Info"
                        buttonContent={
                            <EuiTitle size="s" style={{ fontWeight: 400 }}>
                                <h3>Information</h3>
                            </EuiTitle>
                        }
                        extraAction={
                            <EuiLink
                                href={`#/manager/rules?tab=rules&redirectRule=${id}`}
                                target="_blank" style={{ paddingTop: 5 }}
                                rel="noopener noreferrer"
                            >
                                <EuiIcon type="popout" color='primary' />&nbsp;
                                View in Rules
                            </EuiLink>
                        }
                        paddingSize="none"
                        initialIsOpen={true}>
                        <div className='flyout-row details-row'>
                            {renderInfo(id, level, file, path, groups)}
                        </div>
                    </EuiAccordion>
                </EuiFlexItem>
            </EuiFlexGroup>
            <EuiSpacer size='m' />
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
                        initialIsOpen={true}>
                        <div className='flyout-row details-row'>
                            {renderDetails(details)}
                        </div>
                    </EuiAccordion>
                </EuiFlexItem>
            </EuiFlexGroup>
            <EuiSpacer size='m' />
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
                        initialIsOpen={true}>
                        <div className='flyout-row details-row'>
                            {this.renderCompliance(compliance)}
                        </div>
                    </EuiAccordion>
                </EuiFlexItem>
            </EuiFlexGroup>
            <EuiSpacer size='s' />
        </div>
    )
}

export default RuleDetails;