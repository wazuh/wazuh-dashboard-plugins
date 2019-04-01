import _ from 'lodash';
import templateBar from '../templates/kibana-template/kibana-filterbar-template.html';
import templatePill from '../templates/kibana-template/kibana-filterpill-template.html';
import 'ui/directives/json_input';
import 'ui/filter_editor';
import 'ui/filter_bar/filter_pill/filter_pill';
import { filterAppliedAndUnwrap } from 'ui/filter_bar/lib/filter_applied_and_unwrap';
import { FilterBarLibMapAndFlattenFiltersProvider } from 'ui/filter_bar/lib/map_and_flatten_filters';
import { FilterBarLibMapFlattenAndWrapFiltersProvider } from 'ui/filter_bar/lib/map_flatten_and_wrap_filters';
import { FilterBarLibExtractTimeFilterProvider } from 'ui/filter_bar/lib/extract_time_filter';
import { FilterBarLibFilterOutTimeBasedFilterProvider } from 'ui/filter_bar/lib/filter_out_time_based_filter';
import { changeTimeFilter } from 'ui/filter_bar/lib/change_time_filter';
import { FilterBarQueryFilterProvider } from 'ui/filter_bar/query_filter';
import { compareFilters } from 'ui/filter_bar/lib/compare_filters';
import { uiModules } from 'ui/modules';

export {
  disableFilter,
  enableFilter,
  toggleFilterDisabled
} from 'ui/filter_bar/lib/disable_filter';

const module = uiModules.get('kibana');

module
  .directive('filterBarW', function(Private, Promise, getAppState, i18n) {
    const mapAndFlattenFilters = Private(
      FilterBarLibMapAndFlattenFiltersProvider
    );
    const mapFlattenAndWrapFilters = Private(
      FilterBarLibMapFlattenAndWrapFiltersProvider
    );
    const extractTimeFilter = Private(FilterBarLibExtractTimeFilterProvider);
    const filterOutTimeBasedFilter = Private(
      FilterBarLibFilterOutTimeBasedFilterProvider
    );
    const queryFilter = Private(FilterBarQueryFilterProvider);

    return {
      template: templateBar,
      restrict: 'E',
      scope: {
        indexPatterns: '=',
        tooltipContent: '='
      },
      link: function($scope, $elem) {
        // bind query filter actions to the scope
        [
          'addFilters',
          'toggleFilter',
          'toggleAll',
          'pinFilter',
          'pinAll',
          'invertFilter',
          'invertAll',
          'removeFilter',
          'removeAll'
        ].forEach(function(method) {
          $scope[method] = queryFilter[method];
        });

        $scope.state = getAppState();

        $scope.showCollapseLink = () => {
          const pill = $elem.find('filter-pill-w');
          return pill[pill.length - 1].offsetTop > 10;
        };

        const collapseFilterTooltip = i18n(
          'common.ui.filterBar.collapseFilterTooltip',
          {
            defaultMessage: 'Collapse filter bar \n to show less'
          }
        );
        const expandFilterTooltip = i18n(
          'common.ui.filterBar.expandFilterTooltip',
          { defaultMessage: 'Expand filter bar \n to show more' }
        );

        $scope.filterNavToggle = {
          isOpen: true,
          tooltipContent: collapseFilterTooltip
        };

        $scope.toggleFilterShown = () => {
          const collapser = $elem.find('.filter-nav-link__collapser');
          const filterPanelPill = $elem.find('.filter-panel__pill');
          if ($scope.filterNavToggle.isOpen) {
            $scope.filterNavToggle.tooltipContent = expandFilterTooltip;
            collapser.attr('aria-expanded', 'false');
            filterPanelPill.attr('style', 'width: calc(100% - 80px)');
          } else {
            $scope.filterNavToggle.tooltipContent = collapseFilterTooltip;
            collapser.attr('aria-expanded', 'true');
            filterPanelPill.attr('style', 'width: auto');
          }

          $scope.filterNavToggle.isOpen = !$scope.filterNavToggle.isOpen;
        };

        $scope.applyFilters = function(filters) {
          addAndInvertFilters(filterAppliedAndUnwrap(filters));
          $scope.newFilters = [];

          // change time filter
          if (
            $scope.changeTimeFilter &&
            $scope.changeTimeFilter.meta &&
            $scope.changeTimeFilter.meta.apply
          ) {
            changeTimeFilter($scope.changeTimeFilter);
          }
        };

        $scope.addFilter = () => {
          $scope.editingFilter = {
            meta: { isNew: true }
          };
        };

        $scope.deleteFilter = filter => {
          $scope.removeFilter(filter);
          if (filter === $scope.editingFilter) $scope.cancelEdit();
        };

        $scope.editFilter = filter => {
          $scope.editingFilter = filter;
        };

        $scope.cancelEdit = () => {
          delete $scope.editingFilter;
        };

        $scope.saveEdit = (filter, newFilter, isPinned) => {
          if (!filter.meta.isNew) $scope.removeFilter(filter);
          delete $scope.editingFilter;
          $scope.addFilters([newFilter], isPinned);
        };

        $scope.clearFilterBar = function() {
          $scope.newFilters = [];
          $scope.changeTimeFilter = null;
        };

        // update the scope filter list on filter changes
        $scope.$listen(queryFilter, 'update', function() {
          updateFilters();
        });

        // when appState changes, update scope's state
        $scope.$watch(getAppState, function(appState) {
          $scope.state = appState;
        });

        $scope.$watch('state.$newFilters', function(filters) {
          if (!filters) return;

          // If filters is not undefined and the length is greater than
          // one we need to set the newFilters attribute and allow the
          // users to decide what they want to apply.
          if (filters.length > 1) {
            return mapFlattenAndWrapFilters(filters)
              .then(function(results) {
                extractTimeFilter(results).then(function(filter) {
                  $scope.changeTimeFilter = filter;
                });
                return results;
              })
              .then(filterOutTimeBasedFilter)
              .then(function(results) {
                $scope.newFilters = results;
              });
          }

          // Just add single filters to the state.
          if (filters.length === 1) {
            Promise.resolve(filters)
              .then(function(filters) {
                extractTimeFilter(filters).then(function(timeFilter) {
                  if (timeFilter) changeTimeFilter(timeFilter);
                });
                return filters;
              })
              .then(filterOutTimeBasedFilter)
              .then(addAndInvertFilters);
          }
        });

        function addAndInvertFilters(filters) {
          const existingFilters = queryFilter.getFilters();
          const inversionFilters = _.filter(existingFilters, existingFilter => {
            const newMatchingFilter = _.find(
              filters,
              _.partial(compareFilters, existingFilter)
            );
            return (
              newMatchingFilter &&
              newMatchingFilter.meta &&
              existingFilter.meta &&
              existingFilter.meta.negate !== newMatchingFilter.meta.negate
            );
          });
          const newFilters = _.reject(filters, filter => {
            return _.find(inversionFilters, _.partial(compareFilters, filter));
          });

          _.forEach(inversionFilters, $scope.invertFilter);
          $scope.addFilters(newFilters);
        }

        function updateFilters() {
          let filters = queryFilter.getFilters();

          // Kibana filter pills should not alter their order when switching between Dashboard and Discover sub-tabs
          // https://github.com/wazuh/wazuh-kibana-app/issues/1051
          if (filters && Array.isArray(filters)) {
            const nonRemovable = filters.filter(
              item =>
                item &&
                item.meta &&
                typeof item.meta.removable !== 'undefined' &&
                !item.meta.removable
            );
            const globalState = filters.filter(
              item => item && item.$state && item.$state.store === 'globalState'
            );
            const other = filters.filter(
              item =>
                item &&
                !(
                  item.meta &&
                  typeof item.meta.removable !== 'undefined' &&
                  !item.meta.removable
                ) &&
                !(item.$state && item.$state.store === 'globalState')
            );
            const newFilters = [];
            if (nonRemovable.length) newFilters.push(...nonRemovable);
            if (globalState.length) newFilters.push(...globalState);
            if (other.length) newFilters.push(...other);
            filters = newFilters;
          }

          mapAndFlattenFilters(filters).then(function(results) {
            // used to display the current filters in the state
            $scope.filters = _.sortBy(results, function(filter) {
              return !filter.meta.pinned;
            });
            $scope.$emit('filterbar:updated');
          });
        }

        updateFilters();
      }
    };
  })
  .directive('filterPillW', function() {
    return {
      template: templatePill,
      restrict: 'E',
      scope: {
        filter: '=',
        onToggleFilter: '=',
        onPinFilter: '=',
        onInvertFilter: '=',
        onDeleteFilter: '=',
        onEditFilter: '='
      },
      bindToController: true,
      controllerAs: 'pill',
      controller: function filterPillController() {
        this.activateActions = () => {
          this.areActionsActivated = true;
        };

        this.deactivateActions = () => {
          this.areActionsActivated = false;
        };

        this.isControlledByPanel = () => {
          return _.has(this.filter, 'meta.controlledBy');
        };
      }
    };
  });
