import arrayFrom from 'd2-utilizr/lib/arrayFrom';

export var IndexedDbManager;

IndexedDbManager = function() {
    var t = this;

    // constants
    var _db = 'dhis2';
    var _objectStores = ['optionSets'];

    Object.assign(t, new dhis2.storage.Store({
        name: _db,
        objectStores: _objectStores,
        adapters: [dhis2.storage.IndexedDBAdapter, dhis2.storage.DomSessionStorageAdapter, dhis2.storage.InMemoryAdapter]
    }));

    // cache
    t.cachedOptionSets = {};
};

IndexedDbManager.prototype.getCachedOptionSet = function(id) {
    return this.cachedOptionSets[id];
};

IndexedDbManager.prototype.setCachedOptionSet = function(optionSet) {
    this.cachedOptionSets[optionSet.id] = optionSet;
};

IndexedDbManager.prototype.hasCachedOptionSet = function(id) {
    return (id in this.cachedOptionSets);
};

// dep 1

IndexedDbManager.prototype.getOptionSets = function(ids, callbackFn) {
    ids = arrayFrom(ids);

    var t = this;
    var callbacks = 0;
    var requestIds = [];
    var optionSets = [];

    var fn = function() {
        if (!requestIds.length || requestIds.length === ++callbacks) {
            callbackFn(optionSets);
        }
    };

    // cached option sets
    ids.forEach(id => {
        var cachedOptionSet = t.getCachedOptionSet(id);

        if (cachedOptionSet) {
            optionSets.push(cachedOptionSet);
        }
        else {
            requestIds.push(id);
        }
    });

    // requested option sets
    if (requestIds.length) {
        requestIds.forEach(id => {
            t.get('optionSets', id).done(function(requestedOptionSet) {
                t.setCachedOptionSet(requestedOptionSet);
                optionSets.push(requestedOptionSet);

                fn();
            });
        });
    }
    else {
        fn();
    }
};

// dep 2

IndexedDbManager.prototype.getCachedOption = function(code, optionSetId) {
    return this.getCachedOptionSet(optionSetId).options.find(option => option.code === code);
};

// dep 3

IndexedDbManager.prototype.getCachedOptionName = function(code, optionSetId) {
    return this.getCachedOption(code, optionSetId).name;
};
