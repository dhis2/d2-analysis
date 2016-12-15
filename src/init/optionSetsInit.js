export var optionSetsInit;

optionSetsInit = function(refs, store) {
    var t = this,
        appManager = refs.appManager,
        requestManager = refs.requestManager;

    var apiPath = appManager.getApiPath(),
        displayPropertyUrl = appManager.getDisplayPropertyUrl();

    return {
        baseUrl: '.',
        disableCaching: false,
        success: function() {
            store.open().done(function() {

                // check if idb has any option sets
                store.getKeys('optionSets').done( function(keys) {
                    if (keys.length === 0) {
                        Ext.Ajax.request({
                            url: appManager.getApiPath() + '/optionSets.json?fields=id,name,version,options[code,name]&paging=false',
                            success: function(r) {
                                var sets = Ext.decode(r.responseText).optionSets;

                                if (sets.length) {
                                    store.setAll('optionSets', sets).done(function() {
                                        requestManager.ok(t);
                                    });
                                }
                                else {
                                    requestManager.ok(t);;
                                }
                            }
                        });
                    }
                    else {
                        Ext.Ajax.request({
                            url: appManager.getApiPath() + '/optionSets.json?fields=id,version&paging=false',
                            disableCaching: false,
                            success: function(r) {
                                var optionSets = Ext.decode(r.responseText).optionSets || [],
                                    ids = [],
                                    url = '',
                                    callbacks = 0;

                                var updateStore = function() {
                                    if (++callbacks === optionSets.length) {
                                        if (!ids.length) {
                                            requestManager.ok(t);
                                            return;
                                        }

                                        for (var i = 0; i < ids.length; i++) {
                                            url += '&filter=id:eq:' + ids[i];
                                        }

                                        Ext.Ajax.request({
                                            url: appManager.getApiPath() + '/optionSets.json?fields=id,name,version,options[code,name]&paging=false' + url,
                                            success: function(r) {
                                                var sets = Ext.decode(r.responseText).optionSets;

                                                store.setAll('optionSets', sets).done(function() {
                                                    requestManager.ok(t);
                                                });
                                            }
                                        });
                                    }
                                };

                                var registerOptionSet = function(optionSet) {
                                    store.get('optionSets', optionSet.id).done( function(obj) {
                                        if (!Ext.isObject(obj) || obj.version !== optionSet.version) {
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
                        });
                    }
                });
            });
        }
    };
};
