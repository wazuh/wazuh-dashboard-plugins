import { getAngularModule } from '../../../../../../src/plugins/discover/public/kibana_services';
import { getServices } from '../../../../../../src/plugins/discover/public/kibana_services';
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
        const attr = field.getAttribute('data-attr-field');
        if (attr.startsWith('_')) {
          field.style.display = 'none';
        }
      });
    }
  }

  static hideCloseButtons = () => {
    this.activeNoImplicitsFilters()
  };

  static activeNoImplicitsFilters() {
    const { filterManager } = getServices();
    const implicitFilters = filterManager.filters.filter((x) => {
      return x.$state.isImplicit
    }
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
        const objKey = x.query && x.query.match ? Object.keys(x.query.match)[0] : x.meta.key;
        const key = `filter-key-${objKey}`;
        const value = x.query && x.query.match
          ? `filter-value-${x.query.match[objKey].query}`
          : `filter-value-${x.meta.value}`;
        const data = filters[i].attributes[3];
        if (data.value.includes(key) && data.value.includes(value)) {
          found = true;
        }
      });
      if (!found) {
        $(filters[i]).siblings('.euiBadge__iconButton').removeClass('hide-close-button');       
        $(filters[i]).off('click'); 
      } else {
        $(filters[i]).siblings('.euiBadge__iconButton').addClass('hide-close-button');
        $(filters[i]).on('click', ev => {
          ev.stopPropagation();
        });
      }
    }
  }
}
