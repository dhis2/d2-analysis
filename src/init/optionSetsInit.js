import isObject from 'd2-utilizr/lib/isObject';

export var optionSetsInit;

optionSetsInit = function(refs) {
    var t = this;

    var { appManager, requestManager, indexedDbManager } = refs;

    var { Request } = refs.api;

    var apiPath = appManager.getApiPath(),
        displayPropertyUrl = appManager.getDisplayPropertyUrl();

    return {
        baseUrl: '.',
        type: 'ajax',
        dataType: 'text',
        disableCaching: false,
        success: function() {
            indexedDbManager.open().done(function() {

                // check if idb has any option sets
                indexedDbManager.getKeys('optionSets').done( function(keys) {
                    if (keys.length === 0) {
                        new Request(refs, {
                            baseUrl: appManager.getApiPath() + '/optionSets.json',
                            params: [
                                'fields=id,name,version,options[code,name]',
                                'paging=false'
                            ],
                            success: function(r) {
                                var optionSets = r.optionSets;

                                if (optionSets.length) {
                                    indexedDbManager.setAll('optionSets', optionSets).done(function() {
                                        requestManager.ok(t);
                                    });
                                }
                                else {
                                    requestManager.ok(t);
                                }
                            }
                        }).run();

                        //Ext.Ajax.request({
                            //url: appManager.getApiPath() + '/optionSets.json?fields=id,name,version,options[code,name]&paging=false',
                            //success: function(r) {
                                //var sets = Ext.decode(r.responseText).optionSets;

                                //if (sets.length) {
                                    //indexedDbManager.setAll('optionSets', sets).done(function() {
                                        //requestManager.ok(t);
                                    //});
                                //}
                                //else {
                                    //requestManager.ok(t);
                                //}
                            //}
                        //});
                    }
                    else {
                        new Request(refs, {
                            baseUrl: appManager.getApiPath() + '/optionSets.json',
                            params: [
                                'fields=id,version',
                                'paging=false'
                            ],
                            success: function(r) {

                        //Ext.Ajax.request({
                            //url: appManager.getApiPath() + '/optionSets.json?fields=id,version&paging=false',
                            //disableCaching: false,
                            //success: function(r) {
                                var optionSets = r.optionSets || [],
                                    ids = [],
                                    filters = [],
                                    callbacks = 0;

                                var updateStore = function() {
                                    if (++callbacks === optionSets.length) {
                                        if (!ids.length) {
                                            requestManager.ok(t);
                                            return;
                                        }

                                        for (var i = 0; i < ids.length; i++) {
                                            filters.push('filter=id:eq:' + ids[i]);
                                        }

                                        new Request(refs, {
                                            baseUrl: appManager.getApiPath() + '/optionSets.json',
                                            params: filters.concat([
                                                'fields=id,name,version,options[code,name]',
                                                'paging=false'
                                            ]),
                                            success: function(r) {
                                                var optionSets = r.optionSets;

                                                indexedDbManager.setAll('optionSets', optionSets).done(function() {
                                                    requestManager.ok(t);
                                                });
                                            }
                                        }).run();

                                        //Ext.Ajax.request({
                                            //url: appManager.getApiPath() + '/optionSets.json?fields=id,name,version,options[code,name]&paging=false' + url,
                                            //success: function(r) {
                                                //var sets = Ext.decode(r.responseText).optionSets;

                                                //indexedDbManager.setAll('optionSets', sets).done(function() {
                                                    //requestManager.ok(t);
                                                //});
                                            //}
                                        //});
                                    }
                                };

                                var registerOptionSet = function(optionSet) {
                                    indexedDbManager.get('optionSets', optionSet.id).done( function(obj) {
                                        if (!isObject(obj) || obj.version !== optionSet.version) {
                                            ids.push(optionSet.id);
                                        }

                                        updateStore();
                                    });
                                };

                                if (optionSets.length) {
                                    optionSets.forEach(optionSet => registerOptionSet(optionSet));
                                }
                                else {
                                    requestManager.ok(t);
                                }
                            }
                        }).run();
                    }
                });
            });
        }
    };
};
