import template from './wz-welcome-card.html';
import { uiModules } from 'ui/modules';

const app = uiModules.get('app/wazuh', []);

app.directive('wzWelcomeCard',function(){
    return {
        restrict: 'E',
        scope: {
            title:       '=title',
            description: '=description',
            logo:        '=logo',
            switchTab:   '&',
            currentTab:  '=currentTab'
        },
        replace: true,
        link: function(scope,elm,attrs){
            scope.callSwitchTab = () => scope.switchTab()(scope.currentTab);
        },
        template
    };
});