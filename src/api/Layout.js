import {isString, isNumber, isBoolean, isArray, isObject, isDefined, isEmpty, arrayFrom, arrayContains, arrayClean, arrayPluck, clone} from 'd2-utilizr';
import {Axis} from './Axis.js';
import {Record} from './Record.js';
import {Request} from './Request.js';
import {DateManager} from '../manager/DateManager.js';

export var Layout;

Layout = function(c, applyConfig, forceApplyConfig) {
    var t = this;
    t.klass = Layout;

    c = isObject(c) ? c : {};
    $.extend(c, applyConfig);

    // constructor
    t.columns = (Axis(c.columns)).val();
    t.rows = (Axis(c.rows)).val();
    t.filters = (Axis(c.filters)).val();

    t.showColTotals = isBoolean(c.colTotals) ? c.colTotals : (isBoolean(c.showColTotals) ? c.showColTotals : true);
    t.showRowTotals = isBoolean(c.rowTotals) ? c.rowTotals : (isBoolean(c.showRowTotals) ? c.showRowTotals : true);
    t.showColSubTotals = isBoolean(c.colSubTotals) ? c.colSubTotals : (isBoolean(c.showColSubTotals) ? c.showColSubTotals : true);
    t.showRowSubTotals = isBoolean(c.rowSubTotals) ? c.rowSubTotals : (isBoolean(c.showRowSubTotals) ? c.showRowSubTotals : true);
    t.showDimensionLabels = isBoolean(c.showDimensionLabels) ? c.showDimensionLabels : (isBoolean(c.showDimensionLabels) ? c.showDimensionLabels : true);
    t.hideEmptyRows = isBoolean(c.hideEmptyRows) ? c.hideEmptyRows : false;
    t.skipRounding = isBoolean(c.skipRounding) ? c.skipRounding : false;
    t.aggregationType = isString(c.aggregationType) ? c.aggregationType : OptionConf.getAggregationType('def').id;
    t.dataApprovalLevel = isObject(c.dataApprovalLevel) && isString(c.dataApprovalLevel.id) ? c.dataApprovalLevel : null;
    t.showHierarchy = isBoolean(c.showHierarchy) ? c.showHierarchy : false;
    t.completedOnly = isBoolean(c.completedOnly) ? c.completedOnly : false;
    t.displayDensity = isString(c.displayDensity) && !isEmpty(c.displayDensity) ? c.displayDensity : OptionConf.getDisplayDensity('normal').id;
    t.fontSize = isString(c.fontSize) && !isEmpty(c.fontSize) ? c.fontSize : OptionConf.getFontSize('normal').id;
    t.digitGroupSeparator = isString(c.digitGroupSeparator) && !isEmpty(c.digitGroupSeparator) ? c.digitGroupSeparator : OptionConf.getDigitGroupSeparator('space').id;

    t.legendSet = (new Record(c.legendSet)).val(true);

    t.parentGraphMap = isObject(c.parentGraphMap) ? c.parentGraphMap : null;

    if (isObject(c.program)) {
        t.program = c.program;
    }

        // report table
    t.reportingPeriod = isObject(c.reportParams) && isBoolean(c.reportParams.paramReportingPeriod) ? c.reportParams.paramReportingPeriod : (isBoolean(c.reportingPeriod) ? c.reportingPeriod : false);
    t.organisationUnit =  isObject(c.reportParams) && isBoolean(c.reportParams.paramOrganisationUnit) ? c.reportParams.paramOrganisationUnit : (isBoolean(c.organisationUnit) ? c.organisationUnit : false);
    t.parentOrganisationUnit = isObject(c.reportParams) && isBoolean(c.reportParams.paramParentOrganisationUnit) ? c.reportParams.paramParentOrganisationUnit : (isBoolean(c.parentOrganisationUnit) ? c.parentOrganisationUnit : false);

    t.regression = isBoolean(c.regression) ? c.regression : false;
    t.cumulative = isBoolean(c.cumulative) ? c.cumulative : false;
    t.sortOrder = isNumber(c.sortOrder) ? c.sortOrder : 0;
    t.topLimit = isNumber(c.topLimit) ? c.topLimit : 0;

        // non model

        // id
    if (isString(c.id)) {
        t.id = c.id;
    }

        // name
    if (isString(c.name)) {
        t.name = c.name;
    }

        // sorting
    if (isObject(c.sorting) && isDefined(c.sorting.id) && isString(c.sorting.direction)) {
        t.sorting = c.sorting;
    }

        // displayProperty
    if (isString(c.displayProperty)) {
        t.displayProperty = c.displayProperty;
    }

        // userOrgUnit
    if (arrayFrom(c.userOrgUnit).length) {
        t.userOrgUnit = arrayFrom(c.userOrgUnit);
    }

        // relative period date
    if (DateManager.getYYYYMMDD(c.relativePeriodDate)) {
        t.relativePeriodDate = DateManager.getYYYYMMDD(c.relativePeriodDate);
    }

    $.extend(t, forceApplyConfig);

    // uninitialized
    t.dimensionNameRecordIdsMap;
};

Layout.prototype.log = function(text, noError) {
    if (!noError) {
        console.log(text, this, config, applyConfig, forceApplyConfig);
    }
};

Layout.prototype.alert = function(text, noError) {
    if (!noError) {
        alert(text);
    }
};

Layout.prototype.getAxes = function(includeFilter) {
    return arrayClean([this.columns, this.rows, (includeFilter ? this.filters : null)]);
};

Layout.prototype.getUserOrgUnitUrl = function() {
    if (isArray(this.userOrgUnit) && this.userOrgUnit.length) {
        return 'userOrgUnit=' + this.userOrgUnit.join(';');
    }
};

Layout.prototype.toPlugin = function(layout, el) {
    var layout = clone(layout),
        dimensions = arrayClean([].concat(layout.columns || [], layout.rows || [], layout.filters || []));

    layout.url = init.contextPath;

    if (el) {
        layout.el = el;
    }

    if (Ext.isString(layout.id)) {
        return {id: layout.id};
    }

    for (var i = 0, dimension, item; i < dimensions.length; i++) {
        dimension = dimensions[i];

        delete dimension.id;
        delete dimension.ids;
        delete dimension.type;
        delete dimension.dimensionName;
        delete dimension.objectName;

        for (var j = 0, item; j < dimension.items.length; j++) {
            item = dimension.items[j];

            delete item.name;
            delete item.code;
            delete item.created;
            delete item.lastUpdated;
            delete item.value;
        }
    }

    if (layout.showRowTotals) {
        delete layout.showRowTotals;
    }

    if (layout.showColTotals) {
        delete layout.showColTotals;
    }

    if (layout.showColSubTotals) {
        delete layout.showColSubTotals;
    }

    if (layout.showRowSubTotals) {
        delete layout.showRowSubTotals;
    }

    if (layout.showDimensionLabels) {
        delete layout.showDimensionLabels;
    }

    if (!layout.hideEmptyRows) {
        delete layout.hideEmptyRows;
    }

    if (!layout.skipRounding) {
        delete layout.skipRounding;
    }

    if (!layout.showHierarchy) {
        delete layout.showHierarchy;
    }

    if (!layout.completedOnly) {
        delete layout.completedOnly;
    }

    if (layout.displayDensity === conf.finals.style.normal) {
        delete layout.displayDensity;
    }

    if (layout.fontSize === conf.finals.style.normal) {
        delete layout.fontSize;
    }

    if (layout.digitGroupSeparator === conf.finals.style.space) {
        delete layout.digitGroupSeparator;
    }

    if (!layout.legendSet) {
        delete layout.legendSet;
    }

    if (!layout.sorting) {
        delete layout.sorting;
    }

    if (layout.aggregationType === conf.finals.style.default_) {
        delete layout.aggregationType;
    }

    if (layout.dataApprovalLevel && layout.dataApprovalLevel.id === conf.finals.style.default_) {
        delete layout.dataApprovalLevel;
    }

    delete layout.parentGraphMap;
    delete layout.reportingPeriod;
    delete layout.organisationUnit;
    delete layout.parentOrganisationUnit;
    delete layout.regression;
    delete layout.cumulative;
    delete layout.sortOrder;
    delete layout.topLimit;

    return layout;
}

// dep 1

Layout.prototype.hasDimension = function(dimensionName, includeFilter) {
    return this.getAxes(includeFilter).some(function(axis) {
        return axis.has(dimensionName);
    });
};

Layout.prototype.getDimensions = function(includeFilter, isSorted) {
    var dimensions = [];

    this.getAxes(includeFilter).forEach(function(axis) {
        dimensions = dimensions.concat(axis);
    });

    return isSorted ? dimensions.sort(function(a, b) {return a.dimension > b.dimension;}) : dimensions;
};

Layout.prototype.getDimensionNameRecordIdsMap = function(response) {
    //if (this.dimensionNameRecordIdsMap) {
        //return this.dimensionNameRecordIdsMap;
    //}

    var map = {};

    this.getDimensions(true).forEach(function(dimension) {
        map[dimension.dimension] = dimension.getRecordIds(false, response);
    });

    return this.dimensionNameRecordIdsMap = map;
};

// dep 2

Layout.prototype.getDimensionNames = function(includeFilter, isSorted) {
    var names = arrayPluck(this.getDimensions(includeFilter), 'dimension');

    return isSorted ? names.sort() : names;
};

Layout.prototype.val = function(noError) {

    if (!(this.columns || this.rows)) {
        this.alert(I18nManager.get('at_least_one_dimension_must_be_specified_as_row_or_column'), noError); //todo alert
        return null;
    }

    if (!this.hasDimension(DimConf.get('period').dimensionName)) {
        this.alert(I18nManager.get('at_least_one_period_must_be_specified_as_column_row_or_filter'), noError); //todo alert
        return null;
    }

    return this;
};

Layout.prototype.req = function(baseUrl, isSorted) {
    var aggTypes = ['COUNT', 'SUM', 'STDDEV', 'VARIANCE', 'MIN', 'MAX'],
        //displayProperty = this.displayProperty || init.userAccount.settings.keyAnalysisDisplayProperty || 'name',
        displayProperty = this.displayProperty || 'name',
        request = new Request(),
        i;

    // dimensions
    this.getDimensions(false, isSorted).forEach(function(dimension) {
        request.add(dimension.url(isSorted));
    });

    // filters
    if (this.filters) {
        this.filters.forEach(function(dimension) {
            request.add(dimension.url(isSorted));
        });
    }

    // hierarchy
    if (this.showHierarchy) {
        request.add('hierarchyMeta=true');
    }

    // completed only
    if (this.completedOnly) {
        request.add('completedOnly=true');
    }

    // aggregation type
    if (arrayContains(aggTypes, this.aggregationType)) {
        request.add('aggregationType=' + this.aggregationType);
    }

    // user org unit
    if (isArray(this.userOrgUnit) && this.userOrgUnit.length) {
        request.add(this.getUserOrgUnitUrl());
    }

    // data approval level
    if (isObject(this.dataApprovalLevel) && isString(this.dataApprovalLevel.id) && this.dataApprovalLevel.id !== 'DEFAULT') {
        request.add('approvalLevel=' + this.dataApprovalLevel.id);
    }

    // TODO program
    if (isObject(this.program) && isString(this.program.id)) {
        request.add('program=' + this.program.id);
    }

    // relative period date
    if (this.relativePeriodDate) {
        request.add('relativePeriodDate=' + this.relativePeriodDate);
    }

    // skip rounding
    if (this.skipRounding) {
        request.add('skipRounding=true');
    }

    // display property
    request.add('displayProperty=' + displayProperty.toUpperCase());

    // base url
    if (baseUrl) {
        request.setBaseUrl(baseUrl);
    }

    return request;
};

// dep 3

Layout.prototype.data = function(request) {
    var path = this.klass.appManager ? this.klass.appManager.getPath() : '',
        analyticsPath = '/api/analytics.json';

    if (request) {
        return $.getJSON(path + analyticsPath + request.url());
    }

    var baseUrl = '/api/analytics.json',
        metaDataRequest = this.req(path + analyticsPath, true),
        dataRequest = this.req(path + analyticsPath);

    return {
        metaData: $.getJSON(metaDataRequest.url('skipData=true')),
        data: $.getJSON(dataRequest.url('skipMeta=true'))
    };
};
