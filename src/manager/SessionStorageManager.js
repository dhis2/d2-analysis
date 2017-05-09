export var SessionStorageManager;

SessionStorageManager = function(refs) {
    var t = this;

    // constants
    t.db = 'dhis2';
    t.supported = ('sessionStorage' in window && window['sessionStorage'] !== null);

    // fn
    t.supportHandler = function() {
        if (!this.supported) {
            alert("Your browser is outdated and does not support local storage. Please upgrade your browser.");
            return;
        }

        return true;
    };
};

SessionStorageManager.prototype.get = function(session) {
    if (!this.supportHandler()) {
        return;
    }

    var db = JSON.parse(sessionStorage.getItem(this.db)) || {};

    return db[session];
};

SessionStorageManager.prototype.set = function(layout, session, redirectUrl) {
    if (!this.supportHandler()) {
        return;
    }

    var db = JSON.parse(sessionStorage.getItem(this.db)) || {};
    db[session] = layout;
    sessionStorage.setItem(this.db, JSON.stringify(db));

    if (redirectUrl) {
        window.location.href = redirectUrl;
    }
};
