import { getAngularModule, getDataPlugin } from '../../../kibana-services';
import { AppState } from '../../../react-services/app-state';
import { FilterHandler } from '../../../utils/filter-handler';
import { VULNERABILITY_IMPLICIT_CLUSTER_MODE_FILTER } from '../../../../common/constants';

export class ModulesHelper {
  static async getDiscoverScope() {
    const $injector = getAngularModule().$injector;
    const location = $injector.get('$location');
    const initialTab = location.search().tab;
    return new Promise(resolve => {
      const checkExist = setInterval(() => {
        const app = getAngularModule();
        if (app.discoverScope) {
          clearInterval(checkExist);
          resolve(app.discoverScope);
        }
        const currentTab = location.search().tab;
        if (initialTab !== currentTab) {
          clearInterval(checkExist);
        }
      }, 250);
    });
  }

  static async cleanAvailableFields() {
    const fields = document.querySelectorAll(
      `.dscFieldChooser .dscFieldList--unpopular li`,
    );
    if (fields.length) {
      fields.forEach(field => {
        const attr = field.getAttribute('data-attr-field');
        if (attr.startsWith('_')) {
          field.style.display = 'none';
        }
      });
    }
  }

  static hideCloseButtons = () => {
    this.activeNoImplicitsFilters();
  };

  static async activeNoImplicitsFilters(generatedImplicitFilters) {
    const { filterManager } = getDataPlugin().query;
    const filters = filterManager.getFilters();
    const implicitFilters = generatedImplicitFilters
      ? generatedImplicitFilters
      : filters.filter(filter => filter.$state.isImplicit);

    /*
    Since the OSD filter definition does not include the "isImplicit" attribute that Wazuh adds, there may be cases where the "isImplicit" attribute is lost, since any action regarding filters that is done with the filterManager ( addFilters, setFilters, setGlobalFilters, setAppFilters) does a mapAndFlattenFilters mapping to the filters that removes any attributes that are not part of the filter definition.
If this case happens, the implicit filters are regenerated and the function is called again with the generated implicit filters.
 */
    if (implicitFilters.length === 0) {
      const generatedImplicitFilters = ModulesHelper.getImplicitFilter();
      setTimeout(() => {
        this.activeNoImplicitsFilters(generatedImplicitFilters);
      }, 100);
      return;
    }

    this.processFilters(implicitFilters);
  }

  static processFilters(filters) {
    const allFilters = $(`.globalFilterItem .euiBadge__childButton`);

    allFilters.each((_index, filter) => {
      const data = filter.attributes['data-test-subj'];

      /* With the filter classes decide if they are from the module view or not */
      const isImplicitFilter = this.checkFilterValues(data, filters);

      this.updateFilterState(isImplicitFilter, filter);
    });
  }

  static checkFilterValues(data, filters) {
    /*
    Checks if the filter is already in use
    Check which of the filters are from the module view and which are not pinned filters
     */
    for (const moduleFilter of filters) {
      if (!moduleFilter.used) {
        const { objKey, objValue } = this.extractKeyAndValue(moduleFilter);

        const noExcludedValues =
          !data.value.includes('filter-pinned') &&
          !data.value.includes('filter-negated');
        const acceptedValues =
          data.value.includes(`filter-key-${objKey}`) &&
          data.value.includes(`filter-value-${objValue}`);

        if (acceptedValues && noExcludedValues) {
          moduleFilter.used = true;
          return true;
        }
      }
    }
    return false;
  }

  static extractKeyAndValue(moduleFilter) {
    const objKey = moduleFilter.query?.match
      ? Object.keys(moduleFilter.query.match)[0]
      : moduleFilter.meta.key;
    const objValue = moduleFilter.query?.match
      ? moduleFilter.query.match[objKey].query
      : moduleFilter.meta.value;

    return { objKey, objValue };
  }

  static updateFilterState(isImplicitFilter, filter) {
    const closeButton = $(filter).siblings('.euiBadge__iconButton');
    if (!isImplicitFilter) {
      closeButton.removeClass('hide-close-button');
      $(filter).off('click');
    } else {
      closeButton.addClass('hide-close-button');
      $(filter).on('click', ev => ev.stopPropagation());
    }
  }

  static getImplicitFilter() {
    const tabFilters = {
      general: { group: '' },
      welcome: { group: '' },
      fim: { group: 'syscheck' },
      pm: { group: 'rootcheck' },
      vuls: { group: 'vulnerability-detector' },
      oscap: { group: 'oscap' },
      ciscat: { group: 'ciscat' },
      audit: { group: 'audit' },
      pci: { group: 'pci_dss' },
      gdpr: { group: 'gdpr' },
      hipaa: { group: 'hipaa' },
      nist: { group: 'nist' },
      tsc: { group: 'tsc' },
      aws: { group: 'amazon' },
      gcp: { group: 'gcp' },
      office: { group: 'office365' },
      virustotal: { group: 'virustotal' },
      osquery: { group: 'osquery' },
      sca: { group: 'sca' },
      docker: { group: 'docker' },
      github: { group: 'github' },
    };
    const filterHandler = new FilterHandler(AppState.getCurrentPattern());
    const filters = [];
    const isCluster = AppState.getClusterInfo().status == 'enabled';
    filters.push(
      filterHandler.managerQuery(
        isCluster
          ? AppState.getClusterInfo().cluster
          : AppState.getClusterInfo().manager,
        isCluster,
      ),
    );
    /* Add vulnerability cluster implicit filter*/
    filters.push(
      filterHandler.managerQuery(
        isCluster
          ? AppState.getClusterInfo().cluster
          : AppState.getClusterInfo().manager,
        isCluster,
        VULNERABILITY_IMPLICIT_CLUSTER_MODE_FILTER,
      ),
    );
    filters.push(filterHandler.pciQuery());
    filters.push(filterHandler.gdprQuery());
    filters.push(filterHandler.hipaaQuery());
    filters.push(filterHandler.nistQuery());
    filters.push(filterHandler.tscQuery());
    filters.push(filterHandler.mitreQuery());
    Object.keys(tabFilters).forEach(tab => {
      filters.push(filterHandler.ruleGroupQuery(tabFilters[tab].group));
    });

    return filters;
  }
}
