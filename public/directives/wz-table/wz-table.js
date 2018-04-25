/*
 * Wazuh app - Table directive
 * Copyright (C) 2018 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

import tableTemplate from './wz-table.html'
import * as modules  from 'ui/modules'

const app = modules.get('app/wazuh', []);

app.directive('wzTable',function(){
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
