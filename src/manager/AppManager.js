import isArray from 'd2-utilizr/lib/isArray';
import isFunction from 'd2-utilizr/lib/isFunction';
import isNumeric from 'd2-utilizr/lib/isNumeric';
import isObject from 'd2-utilizr/lib/isObject';
import isString from 'd2-utilizr/lib/isString';
import stringReplaceAll from 'd2-utilizr/lib/stringReplaceAll';
import arrayClean from 'd2-utilizr/lib/arrayClean';
import arrayFrom from 'd2-utilizr/lib/arrayFrom';
import arraySort from 'd2-utilizr/lib/arraySort';
import arrayTo from 'd2-utilizr/lib/arrayTo';
import arrayUnique from 'd2-utilizr/lib/arrayUnique';

export var AppManager;

AppManager = function(refs) {
    var t = this;

    t.refs = isObject(refs) ? refs : {};

    // constants
    t.defaultUiLocale = 'en';
    t.defaultDisplayProperty = 'displayName';
    t.defaultAnalyticsDisplayProperty = 'name';
    t.defaultIndexedDb = 'dhis2';
    t.rootNodeId = 'root';

    t.defaultRequestHeaders = {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
    };

    t.defaultAnalysisFields = [
        '*',
        'interpretations[*,user[id,displayName],likedBy[id,displayName],comments[id,lastUpdated,text,user[id,displayName]]]',
        'columns[dimension,filter,legendSet[id],items[dimensionItem~rename(id),dimensionItemType,$]]',
        'rows[dimension,filter,legendSet[id],items[dimensionItem~rename(id),dimensionItemType,$]]',
        'filters[dimension,filter,items[dimensionItem~rename(id),dimensionItemType,$]]',
        'access',
        'userGroupAccesses',
        'publicAccess',
        'displayDescription',
        'user[displayName]',
        '!href',
        '!rewindRelativePeriods',
        '!userOrganisationUnit',
        '!userOrganisationUnitChildren',
        '!userOrganisationUnitGrandChildren',
        '!externalAccess',
        '!relativePeriods',
        '!columnDimensions',
        '!rowDimensions',
        '!filterDimensions',
        '!organisationUnitGroups',
        '!itemOrganisationUnitGroups',
        '!indicators',
        '!dataElements',
        '!dataElementOperands',
        '!dataElementGroups',
        '!dataSets',
        '!periods',
        '!organisationUnitLevels',
        '!organisationUnits'
    ];

    t.displayPropertyMap = {
        'name': 'displayName',
        'displayName': 'displayName',
        'shortName': 'displayShortName',
        'displayShortName': 'displayShortName'
    };

    t.userIdDestroyCacheKeys = [
        'USER_ORGUNIT',
        'USER_ORGUNIT_CHILDREN',
        'USER_ORGUNIT_GRANDCHILDREN'
    ];

    t.ignoreResponseHeaders = [
        'dy',
        'value',
        'psi',
        'ps',
        'eventdate',
        'longitude',
        'latitude',
        'ouname',
        'oucode'
    ];

    // uninitialized
    t.appName;
    t.sessionName;
    t.manifest;
    t.env;
    t.systemInfo;
    t.systemSettings;
    t.userAccount;
    t.calendar;
    t.periodGenerator;
    t.viewUnapprovedData;

    t.rootNodes = [];
    t.organisationUnitLevels = [];
    t.dimensions = [];
    t.categoryOptionGroupSets = [];
    t.dimensions = [];
    t.legendSets = [];
    t.dataApprovalLevels = [];
    t.userFavorites = [];

    // transient
    t.path;
    t.dateFormat;
    t.relativePeriod;
    t.uiLocale;
    t.displayProperty;
    t.displayPropertyUrl;
    t.analyticsDisplayProperty;
    t.analysisFields;
    t.legendSetMap;

    // optional
    t.manifestVersion;
    t.apiVersion;

    // fns
    t.getUrlParam = function(s) {
        var output = '';
        var href = window.location.href;
        if (href.indexOf('?') > -1 ) {
            var query = href.substr(href.indexOf('?') + 1);
            var query = query.split('&');
            for (var i = 0; i < query.length; i++) {
                if (query[i].indexOf('=') > -1) {
                    var a = query[i].split('=');
                    if (a[0].toLowerCase() === s) {
                        output = a[1];
                        break;
                    }
                }
            }
        }
        return unescape(output);
    };

    // event handler array
    t.getEventHandlerArray = function() {
        var a = [];

        a.run = function(params) {
            a.forEach(function(fn) {
                fn(params.cmp, params.width, params.height, params.eOpts);
            });
        };

        return a;
    };
};

AppManager.prototype.init = function(callbackFn) {
    const t = this;

    // manifest
    const manifestReq = () => {
        new t.refs.api.Request(t.refs, {
            baseUrl: 'manifest.webapp',
            type: 'json',
            success: function (response) {
                t.manifest = response;
                t.env = process.env.NODE_ENV;
                t.setAuth();
                t.logVersion();

                systemInfoReq();
            }
        }).run();
    };

    // system info
    const systemInfoReq = () => {
        new t.refs.api.Request(t.refs, {
            baseUrl: t.getApiPath() + '/system/info.json',
            type: 'json',
            success: function (response) {
                t.systemInfo = response;
                t.path = response.contextPath;

                systemSettingsReq();
            }
        }).run();
    };

    // system settings
    const systemSettingsReq = () => {
        new t.refs.api.Request(t.refs, {
            baseUrl: t.getApiPath() + '/systemSettings.json',
            type: 'json',
            params: [
                'key=keyCalendar',
                'key=keyDateFormat',
                'key=keyAnalysisRelativePeriod',
                'key=keyHideUnapprovedDataInAnalytics',
                'key=keyAnalysisDigitGroupSeparator',
            ],
            success: function (response) {
                t.systemSettings = response;

                userAccountReq();
            }
        }).run();
    };

    // user account
    const userAccountReq = () => {
        new t.refs.api.Request(t.refs, {
            baseUrl: t.getApiPath() + '/me.json',
            type: 'json',
            params: [
                'fields=id,firstName,surname,userCredentials[username],settings',
            ],
            success: function (response) {
                t.userAccount = response;

                const calendarManager = t.refs.calendarManager;

                calendarManager.setBaseUrl(t.getPath());
                calendarManager.setDateFormat(t.getDateFormat());
                calendarManager.init(t.systemSettings.keyCalendar);

                // allow for other code to be executed after all the init stuff is done
                if (callbackFn) {
                    callbackFn();
                }
            }
        }).run();
    };

    manifestReq();
};

AppManager.prototype.logVersion = function() {
    if (console && this.manifest && this.manifest.version) {
        var version = 'v' + this.manifest.version;
        var name = this.manifest.name || null;

        var msg = arrayClean([name, version]).join(' ');
        var fn = console.info || console.log;

        fn.call(console, msg);
    }
};

AppManager.prototype.getPath = function() {
    var dhis = this.manifest ? this.manifest.activities.dhis : {};

    return this.path ? this.path : (this.env === 'production' ? dhis.href : dhis.devHref || dhis.href);
};

AppManager.prototype.getManifestFullVersionNumber = function() {
    var t = this;

    return t.manifest && isNumeric(parseInt(t.manifest.version)) ? parseInt(t.manifest.version) : t.manifestVersion || undefined;
};

AppManager.prototype.getApiVersion = function() {
    return this.apiVersion;
};

AppManager.prototype.getDateFormat = function() {
    return this.dateFormat ? this.dateFormat : (this.dateFormat = isString(this.systemSettings.keyDateFormat) ? this.systemSettings.keyDateFormat.toLowerCase() : 'yyyy-mm-dd');
};

AppManager.prototype.getRelativePeriod = function() {
    return this.relativePeriod ? this.relativePeriod : (this.relativePeriod = this.systemSettings.keyAnalysisRelativePeriod || 'LAST_12_MONTHS');
};

AppManager.prototype.getUiLocale = function() {
    return this.uiLocale ? this.uiLocale : (this.uiLocale = this.userAccount.settings.keyUiLocale || this.defaultUiLocale);
};

AppManager.prototype.getDisplayProperty = function() {
    if (this.displayProperty) {
        return this.displayProperty;
    }

    var keyAnalysisDisplayProperty = this.userAccount && this.userAccount.settings ? this.userAccount.settings.keyAnalysisDisplayProperty : null;

    return this.displayProperty = this.displayPropertyMap[(keyAnalysisDisplayProperty || this.defaultDisplayProperty)];
};

AppManager.prototype.getAnalyticsDisplayProperty = function() {
    if (this.analyticsDisplayProperty) {
        return this.analyticsDisplayProperty;
    }

    var keyAnalysisDisplayProperty = this.userAccount && this.userAccount.settings ? this.userAccount.settings.keyAnalysisDisplayProperty : null;

    return this.analyticsDisplayProperty = (keyAnalysisDisplayProperty || this.defaultAnalyticsDisplayProperty).toUpperCase();
};

AppManager.prototype.getRootNodes = function() {
    return this.rootNodes;
};

AppManager.prototype.addRootNodes = function(param) {
    var t = this,
        nodes = arrayFrom(param);

    nodes.forEach(function(node) {
        node.expanded = true;
        node.path = '/' + t.rootId + '/' + node.id;
    });

    t.rootNodes = arrayClean(t.rootNodes.concat(nodes));
};

AppManager.prototype.addOrganisationUnitLevels = function(param) {
    this.organisationUnitLevels = arrayClean(this.organisationUnitLevels.concat(arrayFrom(param)));

    arraySort(this.organisationUnitLevels, 'ASC', 'level');
};

AppManager.prototype.addLegendSets = function(param) {
    this.legendSets = arrayClean(this.legendSets.concat(arrayFrom(param)));

    arraySort(this.legendSets, 'ASC', 'name');
};

AppManager.prototype.getLegendSetById = function(id) {
    var t = this;

    if (t.legendSetMap) {
        return t.legendSetMap[id];
    }

    t.legendSetMap = {};

    t.legendSets.forEach(function(set) {
        t.legendSetMap[set.id] = set;
    });

    return t.legendSetMap[id];
};

AppManager.prototype.addDimensions = function(param) {
    this.dimensions = arrayClean(this.dimensions.concat(arrayFrom(param)));

    arraySort(this.dimensions, 'ASC', 'name');
};

AppManager.prototype.addCategoryOptionGroupSets = function(param) {
    this.categoryOptionGroupSets = arrayClean(this.categoryOptionGroupSets.concat(arrayFrom(param)));

    arraySort(this.categoryOptionGroupSets, 'ASC', 'name');
};

AppManager.prototype.addDataApprovalLevels = function(param) {
    this.dataApprovalLevels = arrayClean(this.dataApprovalLevels.concat(arrayFrom(param)));

    arraySort(this.dataApprovalLevels, 'ASC', 'level');
};

AppManager.prototype.addIgnoreResponseHeaders = function(headers, append) {
    var t = this;

    t.ignoreResponseHeaders = arrayUnique([
        ...(append ? t.ignoreResponseHeaders : []),
        ...headers
    ]);
};

AppManager.prototype.setAuth = function(auth) {
    var J = 'jQuery' in window ? window['jQuery'] : undefined;
    var E = 'Ext' in window ? window['Ext'] : undefined;
    var headers;

    if (auth) {
        headers = {
            Authorization: 'Basic ' + btoa(auth)
        };
    }
    else if (this.env !== 'production' && (this.manifest && isString(this.manifest.activities.dhis.auth))) {
        headers = {
            Authorization: 'Basic ' + btoa(this.manifest.activities.dhis.auth)
        };
    }

    if (headers) {
        if (J) {
            J.ajaxSetup({
                headers: headers
            });
        }

        if (E && isObject(E.Ajax)) {
            E.Ajax.defaultHeaders = headers;
        }
    }
};

AppManager.prototype.applyTo = function(modules) {
    var t = this;

    arrayTo(modules).forEach(function(module) {
        module.appManager = t;
    });
};

// dep 1

AppManager.prototype.getApiPath = function() {
    var t = this;

    var version = t.getApiVersion() || '';

    return t.getPath() + '/api' + (version ? '/' + version : '');
};

AppManager.prototype.getLegendColorByValue = function(id, value) {
    var t = this,
        color;

    var legendSet = t.getLegendSetById(id);

    for (var i = 0, legend; i < legendSet.legends.length; i++) {
        legend = legendSet.legends[i];

        if (value >= parseFloat(legend.startValue) && value < parseFloat(legend.endValue)) {
            color = legend.color;
            break;
        }
    }

    return color;
};

AppManager.prototype.getDisplayPropertyUrl = function() {
    if (this.displayPropertyUrl) {
        return this.displayPropertyUrl;
    }

    var key = this.getDisplayProperty();

    return this.displayPropertyUrl = (key + '~rename(name)');
};

AppManager.prototype.isUiLocaleDefault = function() {
    return this.getUiLocale() === this.defaultUiLocale;
};

AppManager.prototype.getAnalysisFields = function() {
    return this.analysisFields ? this.analysisFields : (this.analysisFields = stringReplaceAll(this.defaultAnalysisFields.join(','), '$', this.getDisplayPropertyUrl()));
};

AppManager.prototype.getRootNode = function() {
    return this.getRootNodes()[0];
};

// dep 2

AppManager.prototype.getLegendSetIdByDxId = function(id, fn) {
    if (!(isString(id) && isFunction(fn))) {
        return;
    }

    var t = this;

    var legendSetId;

    new t.refs.api.Request(t.refs, {
        type: 'json',
        baseUrl: t.getApiPath() + '/indicators.json',
        params: [
            'filter=id:eq:' + id,
            'fields=legendSet[id]',
            'paging=false'
        ],
        success: function(json) {
            if (isArray(json.indicators) && json.indicators.length) {
                if (isObject(json.indicators[0].legendSet)) {
                    var legendSet = json.indicators[0].legendSet;

                    if (isObject(legendSet)) {
                        legendSetId = legendSet.id;
                    }
                }
            }
        },
        complete: function() {
            fn(legendSetId);
        }
    }).run();
};

AppManager.prototype.getOptionSets = function(response, callbackFn) {
    var optionSetHeaders = response.getOptionSetHeaders();
    var dhis2 = window.dhis2;

    if (optionSetHeaders.length) {
        var callbacks = 0,
            optionMap = {};

        var fn = function() {
            if (++callbacks === optionSetHeaders.length) {
                response.metaData.optionNames = optionMap;
                callbackFn();
            }
        };

        var getObjectMap = function(array, idProperty = 'id', nameProperty = 'name', namePrefix = '') {
            if (!(isArray(array) && array.length)) {
                return {};
            }

            var map = {};

            array.forEach(obj => {
                map[namePrefix + obj[idProperty]] = obj[nameProperty];
            });

            return map;
        };

        var getOptions = function(optionSetId, dataElementId) {
            dhis2.er.store.get('optionSets', optionSetId).done( function(obj) {
                Object.assign(optionMap, getObjectMap(obj.options, 'code', 'name', dataElementId));
                fn();
            });
        };

        // execute
        optionSetHeaders.forEach(header => {
            var optionSetIds = arrayFrom(header.optionSet);
            var dataElementId = header.name;

            optionSetIds.forEach(id => {
                getOptions(id, dataElementId);
            });
        });
    }
    else {
        callbackFn();
    }
};
