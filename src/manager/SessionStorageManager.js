export var SessionStorageManager;

SessionStorageManager = function() {
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

SessionStorageManager.prototype.has = function(session) {
    if (!this.supportHandler()) {
        return;
    }

    return (JSON.parse(sessionStorage.getItem(this.db)) && JSON.parse(sessionStorage.getItem(this.db))[session]);
};

SessionStorageManager.prototype.set = function(layout, session, url) {
    if (!this.supportHandler()) {
        return;
    }

    var dhis2 = JSON.parse(sessionStorage.getItem(this.db)) || {};
    dhis2[session] = layout;
    sessionStorage.setItem(this.db, JSON.stringify(dhis2));

    if (url) {
        window.location.href = url;
    }
};
