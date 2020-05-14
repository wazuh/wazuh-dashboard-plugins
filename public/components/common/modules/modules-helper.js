import { getAngularModule } from 'plugins/kibana/discover/kibana_services';
import { getServices } from 'plugins/kibana/discover/kibana_services';
import chrome from 'ui/chrome';

export class ModulesHelper {
  static async getDiscoverScope() {
    const $injector = await chrome.dangerouslyGetActiveInjector();
    const location = $injector.get('$location');
    const initialTab = location.search().tab;
    return new Promise(resolve => {
      const checkExist = setInterval(() => {
        const app = getAngularModule('app/wazuh');
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
      `.dscFieldChooser .dscFieldList--unpopular li`
    );
    if (fields.length) {
      fields.forEach(field => {
        const attr = field.getAttribute('attr-field');
        if (attr.startsWith('_')) {
          field.style.display = 'none';
        }
      });
    }
  }

  static hideCloseButtons = () => {
    const closeButtons = $(`.globalFilterItem .euiBadge__iconButton`);
    const optionsButtons = $(`.globalFilterItem .euiBadge__childButton`);
    for (let i = 0; i < closeButtons.length; i++) {
      $(closeButtons[i]).addClass('hide-close-button');
      $(optionsButtons[i]).off('click');
    }
  };

  static activeNoImplicitsFilters() {
    const { filterManager } = getServices();
    const implicitFilters = filterManager.filters.filter(
      x => x.$state.isImplicit
    );
    if (!(implicitFilters || []).length) {
      setTimeout(() => {
        this.activeNoImplicitsFilters();
      }, 100);
    }
    const filters = $(`.globalFilterItem .euiBadge__childButton`);
    for (let i = 0; i < filters.length; i++) {
      let found = false;
      (implicitFilters || []).forEach(x => {
        const objKey = x.query ? Object.keys(x.query.match)[0] : x.meta.key;
        const key = `filter-key-${objKey}`;
        const value = x.query
          ? `filter-value-${x.query.match[objKey].query}`
          : `filter-value-${x.meta.value}`;
        const data = filters[i].attributes[3];
        if (data.value.includes(key) && data.value.includes(value)) {
          found = true;
        }
      });
      if (!found) {
        const closeButton = $(`.globalFilterItem .euiBadge__iconButton`)[i];
        $(closeButton).removeClass('hide-close-button');
      } else {
        const optionsButton = $(`.globalFilterItem .euiBadge__childButton`)[i];
        $(optionsButton).on('click', ev => {
          ev.stopPropagation();
        });
      }
    }
  }
}
