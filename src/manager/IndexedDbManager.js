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
};

IndexedDbManager.prototype.get = function(session) {
    //if (!this.supportHandler()) {
        //return;
    //}

    //var db = JSON.parse(sessionStorage.getItem(this.db)) || {};

    //return db[session];
};
