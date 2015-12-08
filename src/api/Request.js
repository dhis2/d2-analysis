import {isString, isObject, isFunction, arrayFrom, arrayContains} from 'd2-utilizr';

export var Request;

Request = function(config) {
    var t = this;

    config = isObject(config) ? config : {};

    // constructor
    t.baseUrl = isString(config.baseUrl) ? config.baseUrl : '';
    t.params = arrayFrom(config.params);
    t.manager = config.manager || null;
    t.type = isString(config.type) ? config.type : 'json';
    t.success = isFunction(config.success) ? config.success : function() { t.defaultSuccess(); };
    t.error = isFunction(config.error) ? config.error : function() { t.defaultError(); };
    t.complete = isFunction(config.complete) ? config.complete : function() { t.defaultComplete(); };

    // defaults
    t.defaultSuccess = function() {
        var t = this;

        if (t.manager) {
            t.manager.ok(t);
        }
    };

    t.defaultError = function() {};
    t.defaultComplete = function() {};
};

Request.prototype.log = function(text, noError) {
    if (!noError) {
        console.log(text, this);
    }
};

Request.prototype.alert = function(text, noError) {
    if (!noError) {
        alert(text);
    }
};

Request.prototype.handle = function(statusCode, noError) {
    var url = this.url(),
        text;

    if (arrayContains([413, 414], statusCode)) {
        if (isIE()) {
            text = 'Too many items selected (url has ' + url.length + ' characters). Internet Explorer accepts maximum 2048 characters.';
        }
        else {
            var len = url.length > 8000 ? '8000' : (url.length > 4000 ? '4000' : '2000');
            text = 'Too many items selected (url has ' + url.length + ' characters). Please reduce to less than ' + len + ' characters.';
        }
    }

    if (text) {
        text += '\n\n' + 'Hint: A good way to reduce the number of items is to use relative periods and level/group organisation unit selection modes.';

        this.alert(text);
    }
};

Request.prototype.add = function(param) {
    var t = this;

    if (isString(param)) {
        t.params.push(param);
    }
    else if (isArray(param)) {
        param.forEach(function(item) {
            if (isString(item)) {
                t.params.push(item);
            }
        });
    }
    else if (isObject(param)) {
        for (var key in param) {
            if (param.hasOwnProperty(key)) {
                t.params.push(key + '=' + param[key]);
            }
        }
    }

    return this;
};

Request.prototype.setBaseUrl = function(baseUrl) {
    if (isString(baseUrl)) {
        this.baseUrl = baseUrl;
    }
};

Request.prototype.setType = function(type) {
    if (isString(type)) {
        this.type = type;
    }
};

Request.prototype.setManager = function(manager) {
    this.manager = manager;
};

Request.prototype.setSuccess = function(fn) {
    if (isFunction(fn)) {
        this.success = fn;
    }
};

Request.prototype.setError = function(fn) {
    if (isFunction(fn)) {
        this.error = fn;
    }
};

Request.prototype.setComplete = function(fn) {
    if (isFunction(fn)) {
        this.complete = fn;
    }
};

Request.prototype.url = function(extraParams) {
    extraParams = arrayFrom(extraParams);

    return this.baseUrl + '?' + ([].concat(this.params, arrayFrom(extraParams))).join('&');
};

// dep 1

Request.prototype.run = function(config) {
    var t = this;

    config = isObject(config) ? config : {};

    if (this.type === 'ajax') {
        return $.ajax({
            url: this.url(),
            success: config.success || t.success,
            error: config.error || t.error,
            complete: config.complete || t.complete
        });
    }
    else {
        return $.getJSON(this.url(), config.success || t.success).error(config.error || t.error).complete(config.complete || t.complete);
    }
};
