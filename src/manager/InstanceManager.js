import {isString, isObject, arrayContains} from 'd2-utilizr';

export var InstanceManager;

InstanceManager = function(config) {
    var t = this;

    config = isObject(config) ? config : {};

    t.api = config.api;
    t.appManager = config.appManager;
    t.uiManager = config.uiManager;
    t.i18nManager = config.i18nManager;

    // uninitialized
    var apiResource;
    var fn;
    var layoutWindow;
    var optionWindow;

    // getter/setter
    t.getApiResource = function() {
        return apiResource;
    };

    t.setApiResource = function(resource) {
        apiResource = resource;
    };

    t.getFn = function() {
        return fn;
    };

    t.setFn = function(func) {
        fn = func;
    };

    t.getLayoutWindow = function() {
        return layoutWindow;
    };

    t.setLayoutWindow = function(win) {
        layoutWindow = win;
    };

    t.getOptionWindow = function() {
        return optionWindow;
    };

    t.setOptionWindow = function(win) {
        optionWindow = win;
    };
};

InstanceManager.prototype.getLayout = function(layoutConfig) {
    layoutConfig = layoutConfig || this.uiManager.getLayoutState();

    return new this.api.Layout(layoutConfig);
};

InstanceManager.prototype.getById = function(id, ) {
    if (!isString(id)) {
        console.log('Invalid id', id);
        return;
    }

    var t = this;

    var path = t.appManager.getPath();
    var fields = t.appManager.getAnalysisFields();
    var resource = t.getApiResource();
    var uiManager = t.uiManager;
    var api = t.api;
    var i18n = i18nManager.get();

    $.getJSON(path + '/api/' + resource + '/' + id + '.json?fields=' + fields, function(r) {
        var layout = new api.Layout(r);

        if (layout) {
            t.getReport(layout);
        }
    }).error(function(r) {
        uiManager.unmask(uiManager.get('centerRegion'));

        if (arrayContains([403], parseInt(r.httpStatusCode))) {
            r.message = i18n.you_do_not_have_access_to_all_items_in_this_favorite || r.message;
        }

        uiManager.alert(r);
    });
};

// dep 1

InstanceManager.prototype.getData = function(layout) {
    layout = layout || this.getLayout();

    return layout.data();
};

InstanceManager.prototype.getReport = function(layout, response) {
    var t = this;

    if (!layout) {
        layout = this.getLayout();
        response = null;

        if (!layout) {
            return;
        }
    }

    if (!response) {
        var reqMap = layout.data();

        reqMap.metaData.done(function(md) {
            reqMap.data.done(function(res) {
                res.metaData = md.metaData;

                response = new t.api.Response(res);

                t.fn(layout, response);
            });
        });
    }
    else {
        t.fn(layout, response);
    }
};
