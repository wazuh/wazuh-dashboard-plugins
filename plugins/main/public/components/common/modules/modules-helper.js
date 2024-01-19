import { getAngularModule, getDataPlugin } from '../../../kibana-services';

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

  static activeNoImplicitsFilters() {
    const { filterManager } = getDataPlugin().query;
    const implicitFilters = filterManager
      .getFilters()
      .filter(x => x.$state.isImplicit);

    if (implicitFilters.length === 0) {
      setTimeout(() => this.activeNoImplicitsFilters(), 100);
      return;
    }

    this.processFilters(implicitFilters);
  }

  static processFilters(implicitFilters) {
    const allFilters = $(`.globalFilterItem .euiBadge__childButton`);

    allFilters.each((_index, filter) => {
      const data = filter.attributes['data-test-subj'];

      const found = this.checkFilterAgainstImplicitFilters(
        data,
        implicitFilters,
      );

      this.updateFilterState(found, filter);
    });
  }

  static checkFilterAgainstImplicitFilters(data, implicitFilters) {
    for (const moduleFilter of implicitFilters) {
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

  static updateFilterState(found, filter) {
    const closeButton = $(filter).siblings('.euiBadge__iconButton');
    if (!found) {
      closeButton.removeClass('hide-close-button');
      $(filter).off('click');
    } else {
      closeButton.addClass('hide-close-button');
      $(filter).on('click', ev => ev.stopPropagation());
    }
  }
}
