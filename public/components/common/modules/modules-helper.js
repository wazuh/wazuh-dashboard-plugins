import { getAngularModule } from 'plugins/kibana/discover/kibana_services';
import { getServices } from 'plugins/kibana/discover/kibana_services';

export class ModulesHelper {

    static async getDiscoverScope() {
        return new Promise((resolve) => {
            const checkExist = setInterval(() => {
                const app = getAngularModule('app/wazuh');
                if (app.discoverScope) {
                    clearInterval(checkExist);
                    resolve(app.discoverScope);
                }
            }, 250);
        })
    }

    static async cleanAvailableFields() {
        const fields = document.querySelectorAll(`.dscFieldChooser .dscFieldList--unpopular li`);
        if (fields.length) {
            fields.forEach(field => {
                const attr = field.getAttribute('attr-field');
                if (attr.startsWith("_")) {
                    field.style.display = "none";
                }
            });
        }
    }

    static hideCloseImplicitsFilters() {
        const { filterManager } = getServices();
        const implicitFilters = filterManager.filters.filter(x => x.$state.isImplicit);
        if (!implicitFilters) return;
        const closeButtons = document.querySelectorAll('.globalFilterItem .euiBadge__iconButton');
        const optionsButtons = document.querySelectorAll('.globalFilterItem .euiBadge__childButton');
        for (let i = 0; i < closeButtons.length; i++) {
            $(closeButtons[i]).addClass('hide-close-button');
            $(optionsButtons[i]).off("click");
        }
        const filters = $(`.globalFilterItem .euiBadge__childButton`);
        for (let i = 0; i < filters.length; i++) {
            let found = false;
            (implicitFilters || []).forEach(x => {
                const objKey = x.query ? Object.keys(x.query.match)[0] : x.meta.key;
                const key = `filter-key-${objKey}`;
                const value = x.query ? `filter-value-${x.query.match[objKey].query}` : `filter-value-${x.meta.value}`;
                const data = filters[i].attributes[3];
                if (data.value.includes(key) && data.value.includes(value)) {
                    found = true;
                }
            });
            if (!found) {
                const closeButton = document.querySelectorAll('.globalFilterItem .euiBadge__iconButton')[i];
                $(closeButton).removeClass('hide-close-button');
            } else {
                const optionsButton = document.querySelectorAll('.globalFilterItem .euiBadge__childButton')[i];
                $(optionsButton).on("click", (ev) => { ev.stopPropagation(); });
            }
        }
    }
}
