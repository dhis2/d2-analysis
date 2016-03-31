import isString from 'd2-utilizr/lib/isString';
import isObject from 'd2-utilizr/lib/isObject';
import stringReplaceAll from 'd2-utilizr/lib/stringReplaceAll';
import arrayFrom from 'd2-utilizr/lib/arrayFrom';
import arrayTo from 'd2-utilizr/lib/arrayTo';
import arrayClean from 'd2-utilizr/lib/arrayClean';
import arraySort from 'd2-utilizr/lib/arraySort';

export var AppManager;

AppManager = function() {
    var t = this;

    // constants
    t.defaultUiLocale = 'en';
    t.defaultDisplayProperty = 'displayName';
    t.defaultIndexedDb = 'dhis2';
    t.rootNodeId = 'root';

    t.valueTypes = {
        'numeric': ['NUMBER','UNIT_INTERVAL','PERCENTAGE','INTEGER','INTEGER_POSITIVE','INTEGER_NEGATIVE','INTEGER_ZERO_OR_POSITIVE'],
        'text': ['TEXT','LONG_TEXT','LETTER','PHONE_NUMBER','EMAIL'],
        'boolean': ['BOOLEAN','TRUE_ONLY'],
        'date': ['DATE','DATETIME'],
        'aggregate': ['NUMBER','UNIT_INTERVAL','PERCENTAGE','INTEGER','INTEGER_POSITIVE','INTEGER_NEGATIVE','INTEGER_ZERO_OR_POSITIVE','BOOLEAN','TRUE_ONLY']
    };

    t.defaultRequestHeaders = {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
    };

    t.defaultAnalysisFields = [
        '*',
        'program[id,displayName|rename(name)]',
        'programStage[id,displayName|rename(name)]',
        'columns[dimension,filter,items[id,$]]',
        'rows[dimension,filter,items[id,$]]',
        'filters[dimension,filter,items[id,$]]',
        'access',
        '!lastUpdated',
        '!href',
        '!created',
        '!publicAccess',
        '!rewindRelativePeriods',
        '!userOrganisationUnit',
        '!userOrganisationUnitChildren',
        '!userOrganisationUnitGrandChildren',
        '!externalAccess',
        '!relativePeriods',
        '!columnDimensions',
        '!rowDimensions',
        '!filterDimensions',
        '!user',
        '!organisationUnitGroups',
        '!itemOrganisationUnitGroups',
        '!userGroupAccesses',
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
    t.legendSets = [];
    t.dataApprovalLevels = [];

    // transient
    t.path;
    t.dateFormat;
    t.relativePeriod;
    t.uiLocale;
    t.displayProperty;
    t.displayPropertyUrl;
    t.analysisFields;

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
};

AppManager.prototype.getPath = function() {
    var dhis = this.manifest ? this.manifest.activities.dhis : {};

    return this.path ? this.path : (this.env === 'production' ? dhis.href : dhis.devHref || dhis.href);
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

    return this.displayProperty = this.displayPropertyMap[(this.userAccount.settings.keyAnalysisDisplayProperty || this.defaultDisplayProperty)];
};

AppManager.prototype.getValueTypesByType = function(type) {
    return this.valueTypes[type];
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

AppManager.prototype.addDimensions = function(param) {
    this.dimensions = arrayClean(this.dimensions.concat(arrayFrom(param)));

    arraySort(this.dimensions, 'ASC', 'name');
};

AppManager.prototype.addDataApprovalLevels = function(param) {
    this.dataApprovalLevels = arrayClean(this.dataApprovalLevels.concat(arrayFrom(param)));

    arraySort(this.dataApprovalLevels, 'ASC', 'level');
};

AppManager.prototype.setAuth = function(auth) {
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
        if ($) {
            $.ajaxSetup({
                headers: headers
            });
        }

        if (window.Ext && isObject(window.Ext.Ajax)) {
            window.Ext.Ajax.defaultHeaders = headers;
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

AppManager.prototype.getDisplayPropertyUrl = function() {
    if (this.displayPropertyUrl) {
        return this.displayPropertyUrl;
    }

    var key = this.getDisplayProperty();

    return this.displayPropertyUrl = (key + '|rename(name)');
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
