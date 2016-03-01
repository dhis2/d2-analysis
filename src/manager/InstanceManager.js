import isString from 'd2-utilizr/lib/isString';
import isObject from 'd2-utilizr/lib/isObject';
import arrayContains from 'd2-utilizr/lib/arrayContains';
import arrayTo from 'd2-utilizr/lib/arrayTo';
import clone from 'd2-utilizr/lib/clone';

export var InstanceManager;

InstanceManager = function(config) {
    var t = this;

    config = isObject(config) ? config : {};

    t.api = config.api;
    t.appManager = config.appManager;
    t.uiManager = config.uiManager;
    t.i18nManager = config.i18nManager;

    // state
    var _state = {
		favorite: null,
		current: null
	};

    // uninitialized
    var apiResource;
    var fn;

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
		return _state.favorite ? _state.favorite.clone() : _state.favorite;
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

	t.setState = function(curr, isFavorite) {
		_state.current = curr ? curr : null;

        if (!_state.current || isFavorite) {
            _state.favorite = _state.current;
        }

		t.uiManager.setState(_state.current, isFavorite);
	};

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
};

InstanceManager.prototype.getLayout = function(layoutConfig) {
    layoutConfig = layoutConfig || this.uiManager.getUiState();

    return new this.api.Layout(layoutConfig);
};

InstanceManager.prototype.getById = function(id) {
    if (!isString(id)) {
        console.log('Invalid id', id);
        return;
    }

    var t = this;

    var path = t.appManager.getPath();
    var fields = t.appManager.getAnalysisFields();
    var apiResource = t.getApiResource();
    var uiManager = t.uiManager;
    var api = t.api;
    var i18n = t.i18nManager.get();

    $.getJSON(path + '/api/' + apiResource + '/' + id + '.json?fields=' + fields, function(r) {
        var layout = new api.Layout(r);

        if (layout) {
            t.getReport(layout, true);
        }
    }).error(function(r) {
        uiManager.unmask();

        if (arrayContains([403], parseInt(r.httpStatusCode))) {
            r.message = i18n.you_do_not_have_access_to_all_items_in_this_favorite || r.message;
        }

        uiManager.alert(r);
    });
};

InstanceManager.prototype.getUiState = function() {
    return this.uiManager.getUiState();
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

    t.uiManager.mask();

    // layout
    if (!layout) {
        layout = this.getLayout();

        if (!layout) {
            return;
        }
    }

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