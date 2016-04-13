import isString from 'd2-utilizr/lib/isString';
import isObject from 'd2-utilizr/lib/isObject';
import arrayContains from 'd2-utilizr/lib/arrayContains';
import arrayTo from 'd2-utilizr/lib/arrayTo';
import clone from 'd2-utilizr/lib/clone';

export var InstanceManager;

InstanceManager = function(c) {
    var t = this;

    c = isObject(c) ? c : {};

    t.api = c.api;
    t.appManager = c.appManager;
    t.uiManager = c.uiManager;
    t.i18nManager = c.i18nManager;
    t.tableManager = c.tableManager;
    t.sessionStorageManager = c.sessionStorageManager;

    // state
    var _state = {
        favorite: null,
        current: null
    };

    // done fn
    var fn;

    // uninitialized
    t.apiResource;

    // getter/setter
    t.isStateFavorite = function() {
        return !!_state.favorite;
    };

    t.isStateCurrent = function() {
        return !!_state.current;
    };

    t.isStateDirty = function() {
        return _state.favorite !== _state.current;
    };

    t.isStateSaved = function() {
        return t.isStateFavorite() ? !t.isStateDirty() : false;
    };

    t.isStateUnsaved = function() {
        return t.isStateFavorite() ? t.isStateDirty() : false;
    };

    t.getStateFavorite = function() {
        return t.isStateFavorite() ? _state.favorite.clone() : _state.favorite;
    };

    t.getStateFavoriteId = function() {
        return t.isStateFavorite() ? _state.favorite.id : null;
    };

    t.getStateFavoriteName = function() {
        return t.isStateFavorite() ? _state.favorite.name : null;
    };

    t.getStateCurrent = function() {
        return _state.current ? _state.current.clone() : _state.current;
    };

    t.setState = function(curr, isFavorite, skipSelect) {
        _state.current = curr ? curr : null;

        if (!_state.current || isFavorite) {
            _state.favorite = _state.current;
        }

        if (t.sessionStorageManager) {
            t.sessionStorageManager.set(_state.current, t.appManager.sessionName);
        }

        t.uiManager.setState(_state.current, isFavorite, skipSelect);
    };

    t.setStateIf = function(curr, isFavorite) {
        if (curr.id === t.getStateFavoriteId()) {
            t.setState(curr, isFavorite);
        }
    };

    t.getFn = function() {
        return fn;
    };

    t.setFn = function(func) {
        fn = func;
    };
};

InstanceManager.prototype.getLayout = function(layoutConfig) {
    layoutConfig = layoutConfig || this.uiManager.getUiState();

    return new this.api.Layout(layoutConfig);
};

InstanceManager.prototype.getById = function(id, fn) {
    if (!isString(id)) {
        console.log('Invalid id', id);
        return;
    }

    var t = this;

    var path = t.appManager.getPath();
    var fields = t.appManager.getAnalysisFields();
    var apiResource = t.apiResource;
    var uiManager = t.uiManager;
    var api = t.api;
    var i18n = t.i18nManager ? t.i18nManager.get() : {};

    fn = fn || function(layout, isFavorite) {
        t.getReport(layout, isFavorite);
    };

    $.getJSON(encodeURI(path + '/api/' + apiResource + '/' + id + '.json?fields=' + fields), function(r) {
        var layout = new api.Layout(r);

        if (layout) {
            fn(layout, true);
        }
    }).error(function(r) {
        uiManager.unmask();

        if (arrayContains([403], parseInt(r.httpStatusCode))) {
            r.message = i18n.you_do_not_have_access_to_all_items_in_this_favorite || r.message;
        }

        uiManager.alert(r);
    });
};

InstanceManager.prototype.delById = function(id, fn, doMask, doUnmask) {
    if (!isString(id)) {
        console.log('Invalid id', id);
        return;
    }

    var t = this;

    var path = t.appManager.getPath();
    var fields = t.appManager.getAnalysisFields();
    var apiResource = t.apiResource;
    var uiManager = t.uiManager;
    var api = t.api;
    var i18n = t.i18nManager.get();

    var url = path + '/api/' + apiResource + '/' + id;

    if (doMask) {
        uiManager.mask();
    }

    $.ajax({
        url: encodeURI(url),
        type: 'DELETE',
        success: function(obj, success, r) {
            if (doUnmask) {
                uiManager.unmask();
            }

            if (fn) {
                fn(obj, success, r);
            }
        },
        error: function(r) {
            uiManager.unmask();

            uiManager.alert(r);
        }
    });
};

InstanceManager.prototype.getSharingById = function(id, fn) {
    var t = this;

    var apiResource = t.apiResource,
        path = t.appManager.getPath();

    if (!isString(apiResource)) {
        alert('No api resource defined');
    }

    var type = apiResource.substring(0, apiResource.length - 1);

    var url = path + '/api/sharing?type=' + type + '&id=' + id,
        fn = fn || function() {};

    $.getJSON(encodeURI(url), function(r) {
        fn(r);
    }).error(function() {
        uiManager.unmask();
    });
};

InstanceManager.prototype.getUiState = function() {
    return this.uiManager.getUiState();
};

InstanceManager.prototype.getFavorite = function(id, fn) {
    var url = t.appManager.getPath() + '/api/' + this.apiResource + '/' + id + '.json?fields=' + t.appManager.getAnalysisFields();

    fn = fn || function() {};

    $.getJSON(encodeURI(url), fn);
};

InstanceManager.prototype.applyTo = function(modules) {
    var t = this;

    arrayTo(modules).forEach(function(module) {
        module.instanceManager = t;
    });
};

// dep 1

InstanceManager.prototype.getData = function(layout) {
    layout = layout || this.getLayout();

    return layout.data();
};

InstanceManager.prototype.getReport = function(layout, isFavorite, skipState) {
    var t = this;

    var fn = function() {
        if (!skipState) {
            t.setState(layout, isFavorite);
        }

        t.getFn()(layout);
    };

    // layout
    if (!layout) {
        layout = t.getLayout();

        if (!layout) {
            return;
        }
    }

    t.uiManager.mask();

    // response
    var response = layout.getResponse();

    // fn
    if (response) {
       fn();
    }
    else {
        var reqMap = layout.data();

        reqMap.metaData.done(function(md) {
            reqMap.data.done(function(res) {
                res.metaData = md.metaData;

                layout.setResponse(new t.api.Response(res));

                fn();
            });
        });
    }
};
