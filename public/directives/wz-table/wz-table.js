import tableTemplate from './wz-table.html'
import * as modules  from 'ui/modules'

const app = modules.get('app/wazuh', []);

const colors = [
    '#3F6833', '#967302', '#2F575E', '#99440A', '#58140C', '#052B51', '#511749', '#3F2B5B', //6
    '#508642', '#CCA300', '#447EBC', '#C15C17', '#890F02', '#0A437C', '#6D1F62', '#584477', //2
    '#629E51', '#E5AC0E', '#64B0C8', '#E0752D', '#BF1B00', '#0A50A1', '#962D82', '#614D93', //4
    '#7EB26D', '#EAB839', '#6ED0E0', '#EF843C', '#E24D42', '#1F78C1', '#BA43A9', '#705DA0', // Normal
    '#9AC48A', '#F2C96D', '#65C5DB', '#F9934E', '#EA6460', '#5195CE', '#D683CE', '#806EB7', //5
    '#B7DBAB', '#F4D598', '#70DBED', '#F9BA8F', '#F29191', '#82B5D8', '#E5A8E2', '#AEA2E0', //3
    '#E0F9D7', '#FCEACA', '#CFFAFF', '#F9E2D2', '#FCE2DE', '#BADFF4', '#F9D9F9', '#DEDAF7' //7
];

app.directive('wzTable',function($sce){
    return {
        restrict: 'E',
        scope: {
            data        : '=data',
            keys        : '=keys',
            func        : '&',
            noscroll    : '=noscroll',
            nopointer   : '=nopointer',
            full        : '=full',
            noheight    : '=noheight',
            isruleset   : '=isruleset',
            isdecoders  : '=isdecoders',
            activeitem  : '=activeitem',
            isagents    : '=isagents',
            specialfunc : '&'
        },
        link: function(scope,ele,attrs){
            // Only used by decoders
            scope.colorOrder = order => {
                order = order.toString();
                let valuesArray   = order.split(',');
                let coloredString = order;
                for (let i = 0, len = valuesArray.length; i < len; i++) {
                    coloredString = coloredString.replace(valuesArray[i], '<span style="color: ' + colors[i] + ' ">' + valuesArray[i] + '</span>');
                }
                return $sce.trustAsHtml(coloredString);
            }

            // Only used by decoders
            scope.colorRegex = regex => {
                regex = regex.toString();
                let valuesArray   = regex.match(/\(((?!<\/span>).)*?\)(?!<\/span>)/gmi);
                let coloredString = regex;
                for (let i = 0, len = valuesArray.length; i < len; i++) {
                    coloredString = coloredString.replace(/\(((?!<\/span>).)*?\)(?!<\/span>)/mi, '<span style="color: ' + colors[i] + ' ">' + valuesArray[i] + '</span>');
                }
                return $sce.trustAsHtml(coloredString);
            }

            scope.clickAction = (index,special) => {
                const obj = {};
                if(scope.full){
                    obj[scope.full] = index;
                } else {
                    obj.index = index;
                }

                if(scope.isagents && special && special.col && special.col === 'group') scope.specialfunc(obj)
                else scope.func(obj);
            }

            scope.parseItem = (item,key) => {
                if(scope.isruleset && key.col === 'level' && item.level === 0) return '0';
                let tmp = key;
                if(key.col) {
                    tmp = key.col;
                }
                if(tmp && tmp.includes('.')){
                    return item[tmp.split('.')[0]] ? item[tmp.split('.')[0]][tmp.split('.')[1]] : '---';
                }
                if(Array.isArray(item[tmp])){
                    return item[tmp].length ? (item[tmp].join(', ')) : '';
                }
                return item[tmp];
            }
        },
        template: tableTemplate
    }
});
