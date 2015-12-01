export var RequestManager;

RequestManager = function(config) {
    var t = this;

    config = isObject(config) ? config : {};

    // constructor
    t.requests = isArray(config.requests) ? config.requests : [];

    t.responses = [];

    t.fn = isFunction(config.fn) ? config.fn : function() { console.log("Request manager is done"); };
};

RequestManager.prototype.add = function(param) {
    var t = this,
        requests = arrayFrom(param);

    requests.forEach(function(request) {
        request.setManager(t);
    });

    this.requests = [].concat(this.requests, requests);
};

RequestManager.prototype.set = function(fn) {
    this.fn = fn;
};

RequestManager.prototype.ok = function(xhr, suppress) {
    this.responses.push(xhr);

    if (!suppress) {
        this.resolve();
    }
};

RequestManager.prototype.run = function() {
    this.requests.forEach(function(request) {
        request.run();
    });
};

RequestManager.prototype.resolve = function() {
    if (this.responses.length === this.requests.length) {
        this.fn();
    }
};
