import isArray from 'd2-utilizr/lib/isArray';

export var Plugin;

Plugin = function({ refs, inits = [], renderFn, initializeFn, type }) {
    const t = this;

    // public properties
    t.url = null;
    t.username = null;
    t.password = null;
    t.auth = null;
    t.loadingIndicator = false;
    t.onRender = Function.prototype;

    // private properties
    let _layouts = [];
    let _isPending = false;
    let _isReady = false;

    // public functions
    t.add = function (...layouts) {
        layouts = isArray(layouts[0]) ? layouts[0] : layouts;

        if (layouts.length) {
            _layouts = [..._layouts, ...layouts];
        }
    };

    t.load = function (...layouts) {
        t.add(isArray(layouts[0]) ? layouts[0] : layouts);

        _runFn();
    };

    t.getType = function() {
        return type;
    };

    // private functions
    const _readyFn = function () {
        _isReady = true;
        _isPending = false;
    };

    const _pendingFn = function () {
        _isPending = true;
    };

    const _runFn = function (initializeFn = initializeFn || _initializeFn) {
        if (_isReady) {
            while (_layouts.length) {
                renderFn(t, _layouts.shift());
            }
        }
        else if (!_isPending) {
            _pendingFn();

            initializeFn();
        }
    };

    const _initializeFn = function (readyFn = _readyFn, runFn = _runFn) {
        const { appManager, requestManager, init } = refs;
        const { Request } = refs.api;

        const credentials = t.username && t.password ? t.username + ':' + t.password : null;
        const auth = t.auth;

        appManager.setAuth(credentials, auth);
        appManager.path = t.url;

        // user account
        new Request(refs, {
            baseUrl: appManager.getApiPath() + '/me.json',
            type: 'json',
            param: [
                'fields=id,firstName,surname,userCredentials[username],settings'
            ],
            success: function (response) {
                appManager.userAccount = response;

                // inits
                inits.forEach(initFn => requestManager.add(new Request(refs, initFn(refs))));

                readyFn();

                requestManager.set(runFn);
                requestManager.run();
            }
        }).run();
    };
};

