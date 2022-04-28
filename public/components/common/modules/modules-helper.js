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
    const { filterManager } = getDataPlugin().query;
    const implicitFilters = filterManager.getFilters().filter((x) => {
      return x.$state.isImplicit
    }
    );
    if (!(implicitFilters || []).length) {
      setTimeout(() => {
        this.activeNoImplicitsFilters();
      }, 100);
    }
    // With the filter classes decide if they are from the module view or not
    const allFilters = $(`.globalFilterItem .euiBadge__childButton`);
    for (let i = 0; i < allFilters.length; i++) {
      const data = allFilters[i].attributes['data-test-subj'];
      let found = false;
      (implicitFilters || []).forEach(mooduleFilter => {
        // Checks if the filter is already in use
        // Check which of the filters are from the module view and which are not pinned filters
        if(!mooduleFilter.used){
          const objKey = mooduleFilter.query?.match ? Object.keys(mooduleFilter.query.match)[0] : mooduleFilter.meta.key;
          const objValue = mooduleFilter.query?.match ? mooduleFilter.query.match[objKey].query : mooduleFilter.meta.value;
          const key = `filter-key-${objKey}`;
          const value = `filter-value-${objValue}`;

          const noExcludedValues = !data.value.includes('filter-pinned') && !data.value.includes('filter-negated') 
          const acceptedValues = data.value.includes(key) && data.value.includes(value)

          if ( acceptedValues && noExcludedValues) {
            found = true;
            mooduleFilter.used = true;
          }
        }
      });
      if (!found) {
        $(allFilters[i]).siblings('.euiBadge__iconButton').removeClass('hide-close-button');       
        $(allFilters[i]).off('click'); 
      } else {
        $(allFilters[i]).siblings('.euiBadge__iconButton').addClass('hide-close-button');
        $(allFilters[i]).on('click', ev => {
          ev.stopPropagation();
        });
      }
    }
  }
}
