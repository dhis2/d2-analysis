import isFunction from 'd2-utilizr/lib/isFunction';
import isString from 'd2-utilizr/lib/isString';
import isObject from 'd2-utilizr/lib/isObject';
import arrayContains from 'd2-utilizr/lib/arrayContains';
import arrayTo from 'd2-utilizr/lib/arrayTo';

export var InstanceManager;

InstanceManager = function(refs) {
    var t = this;

    refs = isObject(refs) ? refs : {};

    t.appManager = refs.appManager;
    t.uiManager = refs.uiManager;
    t.i18nManager = refs.i18nManager;
    t.tableManager = refs.tableManager;
    t.sessionStorageManager = refs.sessionStorageManager;

    // state
    var _state = {
        favorite: null,
        current: null
    };

    // done fn
    var fn;

    // initialized
    t.plugin = false;
    t.dashboard = false;

    // configurable
    t.apiResource;
    t.apiEndpoint;
    t.analyticsEndpoint = '/analytics';
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

    t.setState = function(curr, isFavorite, skipStateWest, forceUiState) {
        _state.current = curr ? curr : null;

        if (!_state.current || isFavorite) {
            _state.favorite = _state.current;
        }

        if (t.sessionStorageManager && _state.current) {
            t.sessionStorageManager.set(_state.current.toSession(), t.appManager.sessionName);
        }

        var current = _state.current ? _state.current.clone() : null;
        var favorite = _state.favorite ? _state.favorite.clone() : null;

        t.uiManager.setState(current, favorite, isFavorite, skipStateWest, forceUiState);
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

    t.getRefs = function() {
        return refs;
    };
};

InstanceManager.prototype.getLayout = function(layoutConfig, fromFavorite) {
    var t = this,
        refs = t.getRefs(),
        favorite = t.getStateFavorite(),
        layout;

    var { Layout } = refs.api;

    layoutConfig = layoutConfig || t.uiManager.getUiState();

    layout = new Layout(refs, layoutConfig);

    if (layout) {
        layout = favorite && fromFavorite ? 
            favorite.apply(layout, Object.keys(layout)) : 
            layout.apply(favorite);
    }

    return layout;
};

InstanceManager.prototype.getById = function(id, fn, doMask, doUnmask) {
    var t = this,
        refs = t.getRefs();

    var { Layout, Request } = refs.api;

    id = isString(id) ? id : t.getStateFavoriteId() || null;

    if (!isString(id)) {
        console.log('Instance manager, getById, invalid id', id);
        return;
    }

    var appManager = t.appManager;
    var uiManager = t.uiManager;
    var i18n = t.i18nManager ? t.i18nManager.get() : {};

    fn = fn || function(layout, isFavorite) {
        t.getReport(layout, isFavorite);
    };

    var request = new Request(refs, {
        baseUrl: appManager.getApiPath() + '/' + t.apiEndpoint + '/' + id + '.json',
        type: 'json',
        beforeRun: function() {
            if (doMask) {
                uiManager.mask();
            }
        },
        afterRun: function() {
            if (doUnmask) {
                uiManager.unmask();
            }
        },
        success: function(r) {
            $.ajax({
                url: appManager.getApiPath() + '/' + t.apiEndpoint + '/' + id,
                type: 'PATCH',
                data: JSON.stringify({}),
                // avoid jQuery choke on empty 200 Success response
                dataType: 'text',
                headers: appManager.defaultRequestHeaders,
                success: function(sharing) {
                    var layout = new Layout(refs, r, {permission: "write"});
                    fn(layout, true);
                },
                error: function(xhr) {
                    var permission = xhr.status === 404 ? "none" : "read";
                    var layout = new Layout(refs, r, {permission: permission});
                    fn(layout, true);
                }
            });
        },
        error: function(r) {
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

    var t = this,
        refs = this.getRefs();

    var { Request } = refs.api;

    var appManager = t.appManager;
    var uiManager = t.uiManager;
    var i18n = t.i18nManager.get();

    var request = new Request(refs, {
        baseUrl: appManager.getApiPath() + '/' + t.apiEndpoint + '/' + id,
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

InstanceManager.prototype.getSharingById = function(id, fn, options) {
    var t = this,
        refs = this.getRefs();
    options = options || {};

    var { Request } = refs.api;

    var appManager = t.appManager;

    var request = new Request(refs, {
        baseUrl: appManager.getApiPath() + '/sharing',
        type: 'json',
        success: function(r) {
            fn && fn(r);
        },
        error: function(res) {
            // If allowForbidden enabled, call the callback anyway, without response object
            if (res.status === 403 && options.allowForbidden) {
                fn && fn();
            } else {
                t.uiManager.alert(res);
                t.uiManager.unmask();
            }
        }
    });

    request.add({
        type: options.apiResource || t.apiResource,
        id: id
    });

    request.run();
};

InstanceManager.prototype.getUiState = function() {
    return this.uiManager.getUiState();
};

InstanceManager.prototype.postDataStatistics = function() {
    var t = this,
        refs = this.getRefs();

    var { Request } = refs.api;

    var request = new Request(refs, {
        baseUrl: t.appManager.getApiPath() + '/dataStatistics',
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

InstanceManager.prototype.getInterpretationById = function(id, fn) {
    if (!isString(id)) {
        console.log('Invalid id', id);
        return;
    }

    var t = this,
        refs = this.getRefs();

    var { Request } = refs.api;

    var appManager = t.appManager;
    var uiManager = t.uiManager;

    var request = new Request(refs, {
        baseUrl: appManager.getApiPath() + '/interpretations/' + id + '.json',
        type: 'json',
        success: function(r) {
            if (isFunction(fn)) {
                fn(r);
            }
        },
        error: function(r) {
            uiManager.alert(r);
        },
        complete: function(r) {
            if (!isFunction(fn)) {
                uiManager.unmask();
            }
        }
    });

    request.add({
        fields: 'id,created'
    });

    request.run();
};

// dep 1

InstanceManager.prototype.getData = function(layout) {
    layout = layout || this.getLayout();

    return layout.data();
};

InstanceManager.prototype.getReport = function(layout, isFavorite, skipState, forceUiState, fn, { noError, errorMessage } = {}) {
    var t = this,
        refs = this.getRefs();

    var { Response } = refs.api;

    var _fn = function() {
        if (!skipState) {
            t.setState(layout, isFavorite, false, forceUiState);
        }

        (fn || t.getFn())(layout);
    };

    // layout
    if (!layout) {
        layout = t.getLayout(undefined, true);

        if (!layout) {
            return;
        }
    }

    // validation
    if (isFunction(layout.val) && !layout.val(noError)) {
		if (errorMessage) {
			t.uiManager.updateErrorMessage(errorMessage, layout.el);
		}
        return;
    }

    t.uiManager.mask();

    // response
    var response = layout.getResponse();

    // fn
    if (response) {
       _fn();
    }
    else {
        var reqMap = layout.data();

        reqMap.metaData.done(function(md) {
            reqMap.data.done(function(res) {
                res.metaData = md.metaData;

                let response = new Response(refs, res);

                if (layout.showHierarchy === true) {
                    response.sortOrganisationUnitsHierarchy();
                }

                layout.setResponse(response);

                _fn();
            });
        });
    }
};
