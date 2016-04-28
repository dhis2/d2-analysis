import isString from 'd2-utilizr/lib/isString';
import isArray from 'd2-utilizr/lib/isArray';
import isObject from 'd2-utilizr/lib/isObject';
import isFunction from 'd2-utilizr/lib/isFunction';
import isEmpty from 'd2-utilizr/lib/isEmpty';
import arrayFrom from 'd2-utilizr/lib/arrayFrom';
import arrayContains from 'd2-utilizr/lib/arrayContains';

export var Request;

Request = function(config) {
    var t = this;
    t.klass = Request;

    config = isObject(config) ? config : {};

    // constructor
    t.method = isString(config.method) ? config.method : 'GET';
    t.headers = isObject(config.headers) ? config.headers : null;
    t.dataType = isString(config.dataType) ? config.dataType : null;
    t.contentType = isString(config.contentType) ? config.contentType : null;
    t.success = isFunction(config.success) ? config.success : function() { t.defaultSuccess(); };
    t.error = isFunction(config.error) ? config.error : function() { t.defaultError(); };
    t.complete = isFunction(config.complete) ? config.complete : function() { t.defaultComplete(); };

    t.type = isString(config.type) ? config.type : 'ajax';
    t.baseUrl = isString(config.baseUrl) ? config.baseUrl : '';
    t.params = arrayFrom(config.params);
    t.manager = config.manager || null;

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
            if (param.hasOwnProperty(key) && !isEmpty(param[key])) {
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
    var t = this,
        url = encodeURI(this.url());

    config = isObject(config) ? config : {};

    var success = config.success || t.success,
        error = config.error || t.error,
        complete = config.complete || t.complete;

    if (this.type === 'json') {
        return $.getJSON(url, success).error(error).complete(complete);
    }
    else {
        var method = config.method || t.method,
            headers = config.headers || t.headers,
            dataType = config.dataType || t.dataType,
            contentType = config.contentType || t.contentType,
            xhr = {};

        xhr.url = url;
        xhr.method = method;
        headers && (xhr.headers = headers);
        dataType && (xhr.dataType = dataType);
        contentType && (xhr.contentType = contentType);
        xhr.success = success;
        xhr.error = error;
        xhr.complete = complete;

        return $.ajax(xhr);
    }
};
