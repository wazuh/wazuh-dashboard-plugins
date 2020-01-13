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
        try{
            const extensions = Cookies.get('extensions') ? decodeURI(Cookies.get('extensions')) : false;
            const parsedExtensions = extensions ? JSON.parse(extensions) : false;
            return parsedExtensions ? parsedExtensions[id] : false; 
        }catch(err){
            console.log("Error get extensions");
            console.log(err);
            throw err;
        }
    }

    /**
     *  Sets a new value for the cookie 'extensions' object
     * @param {*} id 
     * @param {*} extensions 
     */
    static setExtensions(id, extensions) {
        try{
            const decodedExtensions = Cookies.get('extensions') ? decodeURI(Cookies.get('extensions')) : false;
            const current = decodedExtensions ? JSON.parse(decodedExtensions) : {};
            current[id] = extensions;
            const exp = new Date();
            exp.setDate(exp.getDate() + 365);
            if (extensions) {
                const encodedExtensions = encodeURI(JSON.stringify(current));
                Cookies.set('extensions', encodedExtensions, { expires: exp, path: '/app'});
            }
        }catch(err){
            console.log("Error set extensions");
            console.log(err);
            throw err;
        }
    }


    /**
     * Cluster setters and getters
     **/
    static getClusterInfo() {
        try{
            const clusterInfo = Cookies.get('_clusterInfo') ? decodeURI(Cookies.get('_clusterInfo')) : false;
            return clusterInfo ?  JSON.parse(clusterInfo) : {};
        }catch(err){
            console.log("Error get cluster info");
            console.log(err);
            throw err;
        }
    }

    /**
     * Sets a new value to the cookie '_clusterInfo' object
     * @param {*} cluster_info 
     */
    static setClusterInfo(cluster_info) {
        try{
            const encodedClusterInfo = encodeURI(JSON.stringify(cluster_info));
            const exp = new Date();
            exp.setDate(exp.getDate() + 365);
            if (cluster_info) {
                Cookies.set('_clusterInfo', encodedClusterInfo, { expires: exp, path: '/app'  });
            }
        }catch(err){
            console.log("Error set cluster info");
            console.log(err);
            throw err;
        }
    }

    /**
     * Set a new value to the '_createdAt' cookie
     * @param {*} date 
     */
    static setCreatedAt(date) {
        try{
            const createdAt = encodeURI(date);
            const exp = new Date();
            exp.setDate(exp.getDate() + 365);
            Cookies.set('_createdAt', createdAt, { expires: exp, path: '/app' });
        }catch(err){
            console.log("Error set createdAt date");
            console.log(err);
            throw err;
        }
       }

    /**
     * Get '_createdAt' value   
     */
    static getCreatedAt() {
        try{
            const createdAt = Cookies.get('_createdAt') ? decodeURI(Cookies.get('_createdAt')) : false;
            return createdAt ? createdAt : false;
        }catch(err){
            console.log("Error get createdAt date");
            console.log(err);
            throw err;
        }
    }


    /**
     * Get 'API' value   
     */
    static getCurrentAPI() {
        try{
            const currentAPI = Cookies.get('API');
            return currentAPI ? decodeURI(currentAPI) : false;
        }catch(err){
            console.log("Error get current Api");
            console.log(err);
            throw err;
        }
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
        try{
            const encodedApi = encodeURI(API);
            const exp = new Date();
            exp.setDate(exp.getDate() + 365);
            if (API) {
                Cookies.set('API', encodedApi, { expires: exp, path: '/app' });
            }
        }catch(err){
            console.log("Error set current API");
            console.log(err);
            throw err;
        }
    }


    /**
     * Get 'patternSelector' value   
     */
    static getPatternSelector() {
        return Cookies.get('patternSelector') ? decodeURI(Cookies.get('patternSelector')) : false;
    }

    /**
     * Set a new value to the 'patternSelector' cookie
     * @param {*} value 
     */
    static setPatternSelector(value) {
        const encodedPattern = encodeURI(value);
        Cookies.set('patternSelector', encodedPattern, { path: '/app'});
    }



    /**
     * Set a new value to the '_currentPattern' cookie
     * @param {*} newPattern 
     */
    static setCurrentPattern(newPattern) {
        const encodedPattern = encodeURI(newPattern);
        const exp = new Date();
        exp.setDate(exp.getDate() + 365);
        if (newPattern) {
            Cookies.set('_currentPattern', encodedPattern, { expires: exp, path: '/app' });
        }
    }

    /**
     * Get '_currentPattern' value   
     */
    static getCurrentPattern() {
        return Cookies.get('_currentPattern') ? decodeURI(Cookies.get('_currentPattern')) : "";
    }


    /**
     * Set a new value to the 'currentDevTools' cookie
     * @param {*} current 
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
        const decodedNavigation = Cookies.get('navigate') ? decodeURI(Cookies.get('navigate')) : false;
        var navigate = decodedNavigation ? JSON.parse(decodedNavigation) : {};
        for (var key in params) {
            navigate[key] = params[key];
        }
        if(navigate){
            const encodedURI = encodeURI(JSON.stringify(navigate));
            Cookies.set('navigate', encodedURI);
        }
    }

    static getNavigation() {
        const decodedNavigation = Cookies.get('navigate') ? decodeURI(Cookies.get('navigate')) : false;
        const navigation = decodedNavigation ? JSON.parse(decodedNavigation) : {};
        return navigation;
    }
    /**
     * 
    setWzMenu() {
        this.$rootScope.$emit('loadWazuhMenu', {});
      }
      */

} 