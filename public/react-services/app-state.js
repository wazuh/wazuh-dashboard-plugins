/*
 * Wazuh app - APP state service
 * Copyright (C) 2015-2019 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */


import Cookies from '../utils/js-cookie';

export class AppState {
    
    /**
     * Returns if the extension 'id' is enabled
     * @param {id} id 
     */
    static getExtensions(id) {
        const current = Cookies.get('extensions') ? JSON.parse(Cookies.get('extensions')) : false;
        return current ? current[id] : {};
    }

    /**
     *  Sets a new value for the cookie 'extensions' object
     * @param {*} id 
     * @param {*} extensions 
     */
    static setExtensions(id, extensions) {
        const current = Cookies.get('extensions') ? JSON.parse(Cookies.get('extensions')) : {};
        current[id] = extensions;
        const exp = new Date();
        exp.setDate(exp.getDate() + 365);
        if (extensions) {
            Cookies.set('extensions', current, { expires: exp });
        }
    }


    /**
     * Cluster setters and getters
     **/
    static getClusterInfo() {
        return Cookies.get('_clusterInfo') ? JSON.parse(Cookies.get('_clusterInfo')) : {};
    }

    /**
     * Sets a new value to the cookie '_clusterInfo' object
     * @param {*} cluster_info 
     */
    static setClusterInfo(cluster_info) {
        const exp = new Date();
        exp.setDate(exp.getDate() + 365);
        if (cluster_info) {
            Cookies.set('_clusterInfo', cluster_info, { expires: exp });
        }
    }

    /**
     * Set a new value to the '_createdAt' cookie
     * @param {*} date 
     */
    static setCreatedAt(date) {
        const exp = new Date();
        exp.setDate(exp.getDate() + 365);
        Cookies.set('_createdAt', date, { expires: exp });
    }

    /**
     * Get '_createdAt' value   
     */
    static getCreatedAt() {
        const createdAt = Cookies.get('_createdAt') ? Cookies.get('_createdAt') : false;
        return createdAt;
    }

    
    /**
     * Get 'API' value   
     */
    static getCurrentAPI() {
        const currentAPI = Cookies.get('API');// ? Cookies.get('API') : {};
        if (currentAPI && currentAPI.charAt(0) === '"' && currentAPI.charAt(currentAPI.length -1) === '"')
        {
            return currentAPI.substr(1,currentAPI.length -2);
        }
        return currentAPI || undefined;
    }

    /**
     * Remove 'API' cookie
     */
    static removeCurrentAPI() {
        return Cookies.remove('API');
    }

    /**
     * Set a new value to the 'API' cookie
     * @param {*} date 
     */
    static setCurrentAPI(API) {
        const exp = new Date();
        exp.setDate(exp.getDate() + 365);
        if (API) {
            Cookies.set('API', API, { expires: exp });
        }
    }


    /**
     * Get 'patternSelector' value   
     */
    static getPatternSelector() {
        return Cookies.get('patternSelector');
    }

    /**
     * Set a new value to the 'patternSelector' cookie
     * @param {*} date 
     */
    static setPatternSelector(value) {
        Cookies.set('patternSelector', value);
    }



    /**
     * Set a new value to the '_currentPattern' cookie
     * @param {*} date 
     */
    static setCurrentPattern(newPattern) {
        const exp = new Date();
        exp.setDate(exp.getDate() + 365);
        if (newPattern) {
            Cookies.set('_currentPattern', newPattern, { expires: exp });
        }
    }

    /**
     * Get '_currentPattern' value   
     */
    static getCurrentPattern() {
        const currentPattern = Cookies.get('_currentPattern');
        if (currentPattern && currentPattern.charAt(0) === '"' && currentPattern.charAt(currentPattern.length -1) === '"')
        {
            return currentPattern.substr(1,currentPattern.length -2);
        }
        return currentPattern || "";
       
    }


    /**
     * Set a new value to the 'currentDevTools' cookie
     * @param {*} date 
     **/
    static setCurrentDevTools(current) {
        window.localStorage.setItem('currentDevTools', current);
    }

    /**
     * Get 'currentDevTools' value   
     **/
    static getCurrentDevTools() {
        return window.localStorage.getItem('currentDevTools');
    }
    
    /**
     * Add/Edit an item in the session storage
     * @param {*} key 
     * @param {*} value 
     */
    static setSessionStorageItem(key, value) {
        window.sessionStorage.setItem(key, value);
    }

    /**
     * Returns session storage item
     * @param {*} key 
     */
    static getSessionStorageItem(key) {
        return window.sessionStorage.getItem(key);
    }

    /**
     * Remove an item from the session storage
     * @param {*} key 
     */
    static removeSessionStorageItem(key) {
        window.sessionStorage.removeItem(key);
    }


    static setNavigation(params) {
            const navigateStr = Cookies.get('navigate');
            var navigate = navigateStr ? JSON.parse(navigateStr) : {};
            for (var key in params) {
                navigate[key] = params[key];
            }
            Cookies.set('navigate',navigate);

    }
    
    static getNavigation() {
            const navigateStr = Cookies.get('navigate');
            const navigateObj = navigateStr ? JSON.parse(navigateStr) : false;
            return navigateObj;
    }
    /**
     * 
    setWzMenu() {
        this.$rootScope.$emit('loadWazuhMenu', {});
      }

      */

}