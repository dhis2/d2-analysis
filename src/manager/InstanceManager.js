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

    // initialized
    t.isPlugin = false;

    // uninitialized
    t.apiResource;
    t.dataStatisticsEventType;

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

    t.setState = function(curr, isFavorite, skipSelect, forceUiState) {
        _state.current = curr ? curr : null;

        if (!_state.current || isFavorite) {
            _state.favorite = _state.current;
        }

        if (t.sessionStorageManager && _state.current) {
            t.sessionStorageManager.set(_state.current.toSession(), t.appManager.sessionName);
        }

        t.uiManager.setState(_state.current, _state.favorite, isFavorite, skipSelect, forceUiState);
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
    var t = this;

    layoutConfig = layoutConfig || t.uiManager.getUiState();

    return new t.api.Layout(layoutConfig);
};

InstanceManager.prototype.getById = function(id, fn) {
    if (!isString(id)) {
        console.log('Invalid id', id);
        return;
    }

    var t = this;

    var appManager = t.appManager;
    var uiManager = t.uiManager;
    var i18n = t.i18nManager ? t.i18nManager.get() : {};

    fn = fn || function(layout, isFavorite) {
        t.getReport(layout, isFavorite);
    };

    var request = new t.api.Request({
        baseUrl: appManager.getPath() + '/api/' + t.apiResource + '/' + id + '.json',
        type: 'json',
        success: function(r) {
            var layout = new t.api.Layout(r);

            if (layout) {
                fn(layout, true);
            }
        },
        error: function(r) {
            uiManager.unmask();

            if (arrayContains([403], parseInt(r.httpStatusCode))) {
                r.message = i18n.you_do_not_have_access_to_all_items_in_this_favorite || r.message;
            }

            uiManager.alert(r);
        }
    });

    request.add({
        fields: appManager.getAnalysisFields()
    });

    request.run();
};

InstanceManager.prototype.delById = function(id, fn, doMask, doUnmask) {
    if (!isString(id)) {
        console.log('Invalid id', id);
        return;
    }

    var t = this;

    var appManager = t.appManager;
    var uiManager = t.uiManager;
    var i18n = t.i18nManager.get();

    var request = new t.api.Request({
        baseUrl: t.appManager.getPath() + '/api/' + t.apiResource + '/' + id,
        method: 'DELETE',
        beforeRun: function() {
            if (doMask) {
                uiManager.mask();
            }
        },
        success: function(obj, success, r) {
            if (doUnmask) {
                uiManager.unmask();
            }

            fn && fn(obj, success, r);
        },
        error: function(r) {
            uiManager.unmask();

            uiManager.alert(r);
        }
    });

    request.run();
};

InstanceManager.prototype.getSharingById = function(id, fn) {
    var t = this;

    var type = t.apiResource.substring(0, t.apiResource.length - 1);

    var request = new t.api.Request({
        baseUrl: t.appManager.getPath() + '/api/sharing',
        type: 'json',
        success: function(r) {
            fn && fn(r);
        },
        error: function() {
            t.uiManager.unmask();
        }
    });

    request.add({
        type: type,
        id: id
    });

    request.run();
};

InstanceManager.prototype.getUiState = function() {
    return this.uiManager.getUiState();
};

InstanceManager.prototype.postDataStatistics = function() {
    var t = this;

    var request = new t.api.Request({
        baseUrl: t.appManager.getPath() + '/api/dataStatistics',
        method: 'POST'
    });

    request.add({
        eventType: t.dataStatisticsEventType,
        favorite: t.getStateFavoriteId()
    });

    request.run();
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

InstanceManager.prototype.getReport = function(layout, isFavorite, skipState, forceUiState) {
    var t = this;

    var fn = function() {
        if (!skipState) {
            t.setState(layout, isFavorite, false, forceUiState);
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
