/*
 * Wazuh app - Mitre alerts components
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
import React, { useState, useEffect, useMemo } from 'react';
import { EuiPanel, EuiFlexGroup, EuiFlexItem } from '@elastic/eui';
//@ts-ignore
import { ComplianceRequirements } from './components/requirements';
import { ComplianceSubrequirements } from './components';
import { pciRequirementsFile } from '../../../../common/compliance-requirements/pci-requirements';
import {
  gdprRequirementsAliases,
  gdprRequirementsFile,
} from '../../../../common/compliance-requirements/gdpr-requirements';
import {
  hipaaRequirementsAliases,
  hipaaRequirementsFile,
} from '../../../../common/compliance-requirements/hipaa-requirements';
import { nistRequirementsFile } from '../../../../common/compliance-requirements/nist-requirements';
import { nist171RequirementsFile } from '../../../../common/compliance-requirements/nist-171-requirements';
import { tscRequirementsFile } from '../../../../common/compliance-requirements/tsc-requirements';
import { iso27001RequirementsFile } from '../../../../common/compliance-requirements/iso27001-requirements';
import {
  cmmcRequirementsAliases,
  cmmcRequirementsFile,
} from '../../../../common/compliance-requirements/cmmc-requirements';
import { fedrampRequirementsFile } from '../../../../common/compliance-requirements/fedramp-requirements';
import { nis2RequirementsFile } from '../../../../common/compliance-requirements/nis2-requirements';
import { ComplianceRequirement } from '../../../../common/compliance-requirements/types';
import {
  deriveDottedParent,
  deriveGdprArticle,
  deriveHipaaCitation,
  indexRequirementCodes,
  RequirementResolver,
} from '../../../../common/compliance-requirements/requirement-codes';
import {
  DATA_SOURCE_FILTER_CONTROLLED_REGULATORY_COMPLIANCE_REQUIREMENT,
  DATA_SOURCE_FILTER_CONTROLLED_REGULATORY_COMPLIANCE_OTHER_REQUIREMENT,
  UI_LOGGER_LEVELS,
  WAZUH_MODULES_ID,
} from '../../../../common/constants';
import { UI_ERROR_SEVERITIES } from '../../../react-services/error-orchestrator/types';
import { getErrorOrchestrator } from '../../../react-services/common-services';
import {
  withAgentSupportModule,
  withDataSourceInitiated,
  withDataSourceLoading,
  withDataSourceSearchBar,
} from '../../common/hocs';
import {
  FindingsDataSourceRepository,
  PatternDataSourceFilterManager,
  FILTER_OPERATOR,
  tFilter,
} from '../../common/data-source';
import { LoadingSearchbarProgress } from '../../common/loading-searchbar-progress/loading-searchbar-progress';
import { i18n } from '@osd/i18n';
import { I18nProvider } from '@osd/i18n/react';
import { useAsyncAction } from '../../common/hooks';
import { WzSearchBar } from '../../common/search-bar';
import { compose } from 'redux';

// Generous headroom above every framework's known-catalog size, so the
// terms aggregation realistically returns every distinct value (known and
// unknown) instead of silently truncating at the top N by count.
const COMPLIANCE_REQUIREMENTS_AGGREGATION_SIZE = 1000;

// HIPAA identifiers name a standard and, under it, its implementation
// specifications: 164.312(a)(1) is the "Access control" standard and
// 164.312(a)(2)(i-iv) are its specifications. The standard is the unit a
// compliance state is assessed against, so every specification groups under it.
const HIPAA_STANDARD = /^(\d+\.\d+\([a-z]\))/;

function getHipaaStandard(requirement: string) {
  return HIPAA_STANDARD.exec(requirement)?.[1] || requirement;
}

// GDPR is not written as a control framework: its hierarchy is chapter,
// article, paragraph and point, and the article is the unit a compliance state
// is cited and assessed against. The chapter is the only grouping the
// Regulation itself defines, and the article number determines it.
const GDPR_CHAPTERS: Array<{ chapter: string; upTo: number }> = [
  { chapter: 'I', upTo: 4 },
  { chapter: 'II', upTo: 11 },
  { chapter: 'III', upTo: 23 },
  { chapter: 'IV', upTo: 43 },
  { chapter: 'V', upTo: 50 },
  { chapter: 'VI', upTo: 59 },
  { chapter: 'VII', upTo: 76 },
  { chapter: 'VIII', upTo: 84 },
  { chapter: 'IX', upTo: 91 },
  { chapter: 'X', upTo: 93 },
  { chapter: 'XI', upTo: 99 },
];

function getGdprChapter(requirement: string) {
  const article = Number(requirement.replace(/\D/g, ''));
  const chapter = GDPR_CHAPTERS.find(({ upTo }) => article <= upTo);

  return chapter && article ? chapter.chapter : requirement;
}

// A NIS2 requirement is an article of the Directive, or one of the points of
// Article 21(2), which is the article the cybersecurity risk-management
// measures live in. A point is assessed as part of its article.
function getNis2Group(requirement: string) {
  return requirement.split('.')[0];
}

function buildComplianceRequirements(
  requirements: Record<string, ComplianceRequirement>,
  entriesBySeparator: number = 1,
  separator: string = '.',
  getGroup?: (requirement: string) => string,
) {
  const complianceRequirements = {};
  const selectedRequirements = {};

  Object.keys(requirements).forEach(item => {
    const _splitItem = item.split(separator);
    const currentRequirement = getGroup
      ? getGroup(item)
      : _splitItem.slice(0, entriesBySeparator).join(separator);

    if (complianceRequirements[currentRequirement]) {
      complianceRequirements[currentRequirement].push(item);
    } else {
      selectedRequirements[currentRequirement] = true;
      complianceRequirements[currentRequirement] = [];
      complianceRequirements[currentRequirement].push(item);
    }
  });

  return {
    descriptions: requirements,
    selectedRequirements,
    complianceRequirements,
  };
}

// Findings whose compliance value is not one of the framework's documented
// requirements. A finding tagged with more than one unknown value is counted
// once per value, as the tooltip of the tile says.
export function computeOthersCount(
  unknownBuckets: Array<{ key: string; doc_count: number }>,
) {
  return unknownBuckets.reduce((sum, bucket) => sum + bucket.doc_count, 0);
}

interface RequirementsData {
  // Buckets of the terms aggregation over the compliance field.
  buckets: Array<{ key: string; doc_count: number }>;
  // Buckets whose code no requirement of the framework claims.
  unknownBuckets: Array<{ key: string; doc_count: number }>;
  // Codes each requirement is written with in the findings searched.
  codesByRequirement: Record<string, string[]>;
  // Findings of each requirement, counted over all of its codes.
  counts: Record<string, number>;
}

const EMPTY_REQUIREMENTS_DATA: RequirementsData = {
  buckets: [],
  unknownBuckets: [],
  codesByRequirement: {},
  counts: {},
};

interface FrameworkDefinition {
  requirements: Record<string, ComplianceRequirement>;
  // Grouping of the left panel: the number of segments of the identifier that
  // name the group and their separator, or the rule that derives it.
  entriesBySeparator?: number;
  separator?: string;
  getGroup?: (requirement: string) => string;
  resolver: RequirementResolver;
}

// How each framework names its requirements, groups them, and resolves the
// compliance tag values the Wazuh ruleset writes for them.
const FRAMEWORKS: Record<string, FrameworkDefinition> = {
  [WAZUH_MODULES_ID.PCI_DSS]: {
    requirements: pciRequirementsFile,
    entriesBySeparator: 1,
    separator: '.',
    resolver: {},
  },
  [WAZUH_MODULES_ID.GDPR]: {
    requirements: gdprRequirementsFile,
    getGroup: getGdprChapter,
    resolver: {
      aliases: gdprRequirementsAliases,
      derive: deriveGdprArticle,
    },
  },
  [WAZUH_MODULES_ID.HIPAA]: {
    requirements: hipaaRequirementsFile,
    getGroup: getHipaaStandard,
    resolver: {
      aliases: hipaaRequirementsAliases,
      derive: deriveHipaaCitation(hipaaRequirementsFile),
    },
  },
  [WAZUH_MODULES_ID.NIST_800_53]: {
    requirements: nistRequirementsFile,
    entriesBySeparator: 1,
    separator: '-',
    resolver: {},
  },
  [WAZUH_MODULES_ID.NIST_800_171]: {
    requirements: nist171RequirementsFile,
    entriesBySeparator: 2,
    separator: '.',
    resolver: {},
  },
  [WAZUH_MODULES_ID.TSC]: {
    requirements: tscRequirementsFile,
    entriesBySeparator: 1,
    separator: '.',
    resolver: {},
  },
  [WAZUH_MODULES_ID.ISO_27001]: {
    requirements: iso27001RequirementsFile,
    entriesBySeparator: 2,
    separator: '.',
    resolver: {},
  },
  [WAZUH_MODULES_ID.CMMC]: {
    requirements: cmmcRequirementsFile,
    entriesBySeparator: 1,
    separator: '.',
    resolver: { aliases: cmmcRequirementsAliases },
  },
  [WAZUH_MODULES_ID.NIS2]: {
    requirements: nis2RequirementsFile,
    getGroup: getNis2Group,
    // The ruleset cites paragraphs and points of an article the Directive
    // does not number as requirements of their own.
    resolver: { derive: deriveDottedParent(nis2RequirementsFile) },
  },
  [WAZUH_MODULES_ID.FEDRAMP]: {
    requirements: fedrampRequirementsFile,
    // A FedRAMP identifier is a NIST 800-53 one, so it groups by family.
    entriesBySeparator: 1,
    separator: '-',
    resolver: {},
  },
};

export function getFrameworkDefinition(section: string) {
  return FRAMEWORKS[section];
}

export function buildComplianceObject({ section }) {
  const empty = {
    complianceObject: {},
    selectedRequirements: {},
    descriptions: {},
    resolver: {} as RequirementResolver,
  };

  try {
    const definition = getFrameworkDefinition(section);

    if (!definition) {
      return empty;
    }

    const { complianceRequirements, descriptions, selectedRequirements } =
      buildComplianceRequirements(
        definition.requirements,
        definition.entriesBySeparator,
        definition.separator,
        definition.getGroup,
      );

    return {
      complianceObject: complianceRequirements,
      selectedRequirements,
      descriptions,
      resolver: definition.resolver,
    };
  } catch (error) {
    const options = {
      context: 'buildComplianceObject',
      level: UI_LOGGER_LEVELS.ERROR,
      severity: UI_ERROR_SEVERITIES.BUSINESS,
      store: true,
      display: true,
      error: {
        error: error,
        message: error.message || error,
        title: i18n.translate(
          'wazuh.complianceTable.errors.buildComplianceTitle',
          {
            defaultMessage: 'Compliance ({section}) data could not be fetched',
            values: { section },
          },
        ),
      },
    };
    getErrorOrchestrator().handleError(options);

    // The caller destructures the result, so an empty compliance object is
    // returned instead of nothing when the build fails.
    return empty;
  }
}

export const ComplianceTable = compose(
  withAgentSupportModule,
  withDataSourceSearchBar({
    DataSourceFromNameProp: 'DataSource',
    DataSourceRepositoryCreator: FindingsDataSourceRepository,
  }),
  withDataSourceLoading({
    isLoadingNameProp: 'dataSource.isLoading',
    LoadingComponent: LoadingSearchbarProgress,
  }),
  withDataSourceInitiated({
    dataSourceNameProp: 'dataSource.dataSource',
    isLoadingNameProp: 'dataSource.isLoading',
    dataSourceErrorNameProp: 'dataSource.error',
  }),
)(props => {
  const { dataSource } = props;

  const { searchBarProps, fingerprint, autoRefreshFingerprint } = dataSource;

  const { dateRangeFrom, dateRangeTo } = searchBarProps;
  const [complianceData, setComplianceData] = useState({
    descriptions: {},
    complianceObject: {},
    selectedRequirements: {},
    resolver: {},
  });

  const getRequirementsCount = async ({
    section,
    query,
    fetchData,
    dateRange,
  }) => {
    try {
      const mapFieldAgg = {
        [WAZUH_MODULES_ID.CMMC]: 'wazuh.rule.compliance.cmmc',
        [WAZUH_MODULES_ID.FEDRAMP]: 'wazuh.rule.compliance.fedramp',
        [WAZUH_MODULES_ID.GDPR]: 'wazuh.rule.compliance.gdpr',
        [WAZUH_MODULES_ID.HIPAA]: 'wazuh.rule.compliance.hipaa',
        [WAZUH_MODULES_ID.ISO_27001]: 'wazuh.rule.compliance.iso_27001',
        [WAZUH_MODULES_ID.NIS2]: 'wazuh.rule.compliance.nis2',
        [WAZUH_MODULES_ID.NIST_800_53]: 'wazuh.rule.compliance.nist_800_53',
        [WAZUH_MODULES_ID.NIST_800_171]: 'wazuh.rule.compliance.nist_800_171',
        [WAZUH_MODULES_ID.PCI_DSS]: 'wazuh.rule.compliance.pci_dss',
        [WAZUH_MODULES_ID.TSC]: 'wazuh.rule.compliance.tsc',
      };
      const field = mapFieldAgg[section];
      const { requirements, resolver } = {
        requirements: getFrameworkDefinition(section)?.requirements || {},
        resolver: getFrameworkDefinition(section)?.resolver || {},
      };

      const data = await fetchData({
        aggs: {
          tactics: {
            terms: {
              field,
              size: COMPLIANCE_REQUIREMENTS_AGGREGATION_SIZE,
            },
          },
        },
        query,
        dateRange: dateRange,
      });

      const buckets = data?.aggregations?.tactics?.buckets || [];
      const { codesByRequirement, unknownBuckets } = indexRequirementCodes(
        buckets,
        requirements,
        resolver,
      );

      // A finding carries every code of the requirement it meets, and a terms
      // aggregation puts it in one bucket per code, so the buckets of a
      // requirement written in more than one notation cannot be added up
      // without counting that finding once per code. Those requirements are
      // counted again, one filter each, which counts every finding once.
      const counts = {};
      const ambiguous = [...codesByRequirement.entries()].filter(
        ([, codes]) => codes.length > 1,
      );

      for (const [requirement, codes] of codesByRequirement.entries()) {
        counts[requirement] = buckets.find(
          bucket => bucket.key === codes[0],
        )?.doc_count;
      }

      if (ambiguous.length) {
        const exact = await fetchData({
          aggs: {
            requirements: {
              filters: {
                filters: Object.fromEntries(
                  ambiguous.map(([requirement, codes]) => [
                    requirement,
                    { terms: { [field]: codes } },
                  ]),
                ),
              },
            },
          },
          query,
          dateRange: dateRange,
        });

        for (const [requirement, bucket] of Object.entries(
          exact?.aggregations?.requirements?.buckets || {},
        )) {
          counts[requirement] = (bucket as { doc_count: number }).doc_count;
        }
      }

      return {
        buckets,
        unknownBuckets,
        codesByRequirement: Object.fromEntries(codesByRequirement),
        counts,
      };
    } catch (error) {
      const options = {
        context: 'buildComplianceObject',
        level: UI_LOGGER_LEVELS.ERROR,
        severity: UI_ERROR_SEVERITIES.BUSINESS,
        store: true,
        display: true,
        error: {
          error: error,
          message: error.message || error,
          title: i18n.translate(
            'wazuh.complianceTable.errors.fetchAlertsTitle',
            {
              defaultMessage: 'Alerts could not be fetched:',
            },
          ),
        },
      };
      getErrorOrchestrator().handleError(options);

      // The result is read by the panels, so a failed search gives them an
      // empty one instead of nothing.
      return EMPTY_REQUIREMENTS_DATA;
    }
  };

  const action = useAsyncAction(getRequirementsCount, [
    props.section,
    dataSource.dataSource,
    searchBarProps.query,
    { from: dateRangeFrom, to: dateRangeTo },
  ]);

  // useAsyncAction types its data as null, so the search result is named here.
  const requirementsData: RequirementsData =
    (action.data as RequirementsData | null) || EMPTY_REQUIREMENTS_DATA;

  const getRegulatoryComplianceRequirementFilter = (
    key: string,
    value: string,
  ) => {
    if (!value) return [];

    // A finding can name the requirement in the standard's notation or in the
    // ruleset's, so the filter has to accept every code of the requirement.
    const codes = requirementsData.codesByRequirement[value] || [value];

    if (codes.length > 1) {
      return [
        PatternDataSourceFilterManager.createFilter(
          FILTER_OPERATOR.IS_ONE_OF,
          key,
          codes,
          dataSource.dataSource?.indexPattern.id,
          DATA_SOURCE_FILTER_CONTROLLED_REGULATORY_COMPLIANCE_REQUIREMENT,
        ),
      ] as tFilter[];
    }

    return [
      {
        meta: {
          index: dataSource.dataSource?.indexPattern.id,
          negate: false,
          disabled: false,
          alias: null,
          type: 'phrase',
          key: key,
          value: value,
          params: {
            query: value,
            type: 'phrase',
          },
          controlledBy:
            DATA_SOURCE_FILTER_CONTROLLED_REGULATORY_COMPLIANCE_REQUIREMENT,
        },
        query: {
          match: {
            [key]: {
              query: value,
              type: 'phrase',
            },
          },
        },
        $state: {
          store: 'appState',
        },
      } as tFilter,
    ];
  };

  // Findings whose compliance requirement value includes at least one code
  // that isn't part of the known, documented list for this framework. Built
  // from the exact same aggregation buckets that drive `othersCount` below
  // (see getOthersBuckets), rather than excluding every known code, so a
  // document holding both a known and an unknown code (e.g.
  // ["1.1", "some-unknown-code"]) is matched here exactly when it also
  // contributes to `othersCount` - keeping the flyout table and the tile's
  // badge count consistent.
  const getRegulatoryComplianceOtherRequirementsFilter = (key: string) => {
    const unknownValues = requirementsData.unknownBuckets.map(
      bucket => bucket.key,
    );
    if (!unknownValues.length) {
      return [];
    }
    const indexPatternId = dataSource.dataSource?.indexPattern.id;
    return [
      PatternDataSourceFilterManager.createFilter(
        FILTER_OPERATOR.IS_ONE_OF,
        key,
        unknownValues,
        indexPatternId,
        DATA_SOURCE_FILTER_CONTROLLED_REGULATORY_COMPLIANCE_OTHER_REQUIREMENT,
      ),
    ] as tFilter[];
  };

  const othersCount = useMemo(
    () => computeOthersCount(requirementsData.unknownBuckets),
    [requirementsData],
  );

  const othersBuckets = useMemo(
    () => requirementsData.unknownBuckets,
    [requirementsData],
  );

  useEffect(() => {
    const { descriptions, complianceObject, selectedRequirements, resolver } =
      buildComplianceObject({
        section: props.section,
      });
    setComplianceData({
      descriptions,
      complianceObject,
      selectedRequirements,
      resolver,
    });
  }, []);

  useEffect(() => {
    action.run({
      section: props.section,
      fetchData: dataSource.fetchData,
      query: searchBarProps.query,
      dateRange: { from: dateRangeFrom, to: dateRangeTo },
    });
  }, [
    JSON.stringify(searchBarProps.query),
    JSON.stringify(dataSource.fetchFilters),
    dateRangeFrom,
    dateRangeTo,
    fingerprint,
    autoRefreshFingerprint,
  ]);

  return (
    <I18nProvider>
      <>
        <EuiPanel
          paddingSize='none'
          hasShadow={false}
          hasBorder={false}
          color='transparent'
        >
          <WzSearchBar
            appName='compliance-controls'
            {...searchBarProps}
            fixedFilters={dataSource.fixedFilters}
            showDatePicker={true}
            showQueryInput={true}
            showQueryBar={true}
            showSaveQuery={true}
          />
        </EuiPanel>
        <EuiPanel
          paddingSize='s'
          hasShadow={false}
          hasBorder={false}
          color='transparent'
        >
          <EuiPanel paddingSize='none'>
            <EuiFlexGroup paddingSize='none'>
              <EuiFlexItem style={{ width: 'calc(100% - 24px)' }}>
                {!!Object.keys(complianceData.complianceObject).length && (
                  <EuiFlexGroup>
                    <EuiFlexItem
                      grow={false}
                      style={{
                        width: '15%',
                        minWidth: 145,
                        maxHeight: 'calc(100vh - 320px)',
                        overflowX: 'hidden',
                        overflowY: 'auto',
                        backgroundColor: '#80808014',
                      }}
                    >
                      <ComplianceRequirements
                        section={props.section}
                        onChangeSelectedRequirements={selectedRequirements =>
                          setComplianceData(state => ({
                            ...state,
                            selectedRequirements,
                          }))
                        }
                        requirementCounts={requirementsData.counts}
                        loadingAlerts={action.running}
                        {...complianceData}
                      />
                    </EuiFlexItem>
                    <EuiFlexItem style={{ width: '15%' }}>
                      <ComplianceSubrequirements
                        section={props.section}
                        requirementCounts={requirementsData.counts}
                        requirementCodes={requirementsData.codesByRequirement}
                        loadingAlerts={action.running}
                        fetchFilters={dataSource.fetchFilters}
                        getRegulatoryComplianceRequirementFilter={
                          getRegulatoryComplianceRequirementFilter
                        }
                        othersCount={othersCount}
                        othersBuckets={othersBuckets}
                        indexPatternId={dataSource.dataSource?.indexPattern.id}
                        getRegulatoryComplianceOtherRequirementsFilter={
                          getRegulatoryComplianceOtherRequirementsFilter
                        }
                        {...complianceData}
                        filters={dataSource.filters}
                        setFilters={dataSource.setFilters}
                      />
                    </EuiFlexItem>
                  </EuiFlexGroup>
                )}
              </EuiFlexItem>
            </EuiFlexGroup>
          </EuiPanel>
        </EuiPanel>
      </>
    </I18nProvider>
  );
});
