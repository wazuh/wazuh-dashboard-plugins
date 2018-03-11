import tableTemplate from './wz-table.html'

const app = require('ui/modules').get('app/wazuh', []);

app.directive('wzTable',function(){
    return {
        restrict: 'E',
        scope: {
            data      : '=data',
            keys      : '=keys',
            func      : '&',
            noscroll  : '=noscroll',
            nopointer : '=nopointer',
            full      : '=full',
            noheight  : '=noheight',
            isruleset : '=isruleset',
            isdecoders: '=isdecoders',
            activeitem: '=activeitem'
        },
        link: function(scope,ele,attrs){
            scope.clickAction = index => {
                const obj = {};
                if(scope.full){
                    obj[scope.full] = index;
                } else {
                    obj.index = index;
                }
    
                scope.func(obj);
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
