import {isObject} from 'd2-utilizr';

export var InstanceManager;

InstanceManager = function(config) {
    var t = this;

    config = isObject(config) ? config : {};

    t.api = config.api;
    t.uiManager = config.uiManager;

    // uninitialized
    var fn;

    // getter/setter
    t.getFn = function() {
        return fn;
    };

    t.setFn = function(func) {
        fn = func;
    };
};

InstanceManager.prototype.getLayout = function(layoutConfig) {
    layoutConfig = layoutConfig || this.uiManager.getStateLayout();

    return new this.api.Layout(layoutConfig);
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


