require('ui/modules').get('app/wazuh', [])
    .service('tabProvider', function () {
        var _tabs = [];

        return {
            register: function (pageId) {
                if (!_tabs[pageId]) {
                    _tabs[pageId] = [];
                }
            },
            setTab: function (pageId, tab, tabset) {
                if (!tabset) {
                    tabset = 0;
                }
                if (!_tabs[pageId]) {
                    return false;
                }
                _tabs[pageId][tabset] = tab;
                return true;
            },
            isSetTab: function (pageId, tab, tabset) {
                if (!tabset) {
                    tabset = 0;
                }
                if (!_tabs[pageId]) {
                    return false;
                }
                if (!_tabs[pageId][tabset]) {
                    return (tab == 1);
                }
                return (_tabs[pageId][tabset] == tab);
            },
            clean: function (pageId) {
                if (_tabs[pageId]) {
                    _tabs[pageId].length = 0;
                }
            }

        };
    });