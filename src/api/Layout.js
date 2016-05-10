import isString from 'd2-utilizr/lib/isString';
import isNumber from 'd2-utilizr/lib/isNumber';
import isBoolean from 'd2-utilizr/lib/isBoolean';
import isArray from 'd2-utilizr/lib/isArray';
import isObject from 'd2-utilizr/lib/isObject';
import isDefined from 'd2-utilizr/lib/isDefined';
import isEmpty from 'd2-utilizr/lib/isEmpty';
import arrayFrom from 'd2-utilizr/lib/arrayFrom';
import arrayContains from 'd2-utilizr/lib/arrayContains';
import arrayClean from 'd2-utilizr/lib/arrayClean';
import arrayPluck from 'd2-utilizr/lib/arrayPluck';
import arraySort from 'd2-utilizr/lib/arraySort';

import {Axis} from './Axis.js';
import {Dimension} from './Dimension.js';
import {Record} from './Record.js';
import {Request} from './Request.js';
import {ResponseRowIdCombination} from './ResponseRowIdCombination.js';
import {Sorting} from './Sorting.js';
import {DateManager} from '../manager/DateManager.js';

export var Layout;

Layout = function(c, applyConfig, forceApplyConfig) {
    var t = this;
    t.klass = Layout;

    c = isObject(c) ? c : {};
    $.extend(c, applyConfig);

    // private
    var _source = '/api/analytics';
    var _format = 'json';

    var _response;
    var _access;

    var _dataDimensionItems;

    // constructor
    t.columns = (Axis(c.columns)).val();
    t.rows = (Axis(c.rows)).val();
    t.filters = (Axis(c.filters)).val(true);

    t.showColTotals = isBoolean(c.colTotals) ? c.colTotals : (isBoolean(c.showColTotals) ? c.showColTotals : true);
    t.showRowTotals = isBoolean(c.rowTotals) ? c.rowTotals : (isBoolean(c.showRowTotals) ? c.showRowTotals : true);
    t.showColSubTotals = isBoolean(c.colSubTotals) ? c.colSubTotals : (isBoolean(c.showColSubTotals) ? c.showColSubTotals : true);
    t.showRowSubTotals = isBoolean(c.rowSubTotals) ? c.rowSubTotals : (isBoolean(c.showRowSubTotals) ? c.showRowSubTotals : true);
    t.showDimensionLabels = isBoolean(c.showDimensionLabels) ? c.showDimensionLabels : (isBoolean(c.showDimensionLabels) ? c.showDimensionLabels : true);
    t.hideEmptyRows = isBoolean(c.hideEmptyRows) ? c.hideEmptyRows : false;
    t.skipRounding = isBoolean(c.skipRounding) ? c.skipRounding : false;
    t.aggregationType = isString(c.aggregationType) ? c.aggregationType : t.klass.optionConfig.getAggregationType('def').id;
    t.dataApprovalLevel = isObject(c.dataApprovalLevel) && isString(c.dataApprovalLevel.id) ? c.dataApprovalLevel : null;
    t.showHierarchy = isBoolean(c.showHierarchy) ? c.showHierarchy : false;
    t.completedOnly = isBoolean(c.completedOnly) ? c.completedOnly : false;
    t.displayDensity = isString(c.displayDensity) && !isEmpty(c.displayDensity) ? c.displayDensity : t.klass.optionConfig.getDisplayDensity('normal').id;
    t.fontSize = isString(c.fontSize) && !isEmpty(c.fontSize) ? c.fontSize : t.klass.optionConfig.getFontSize('normal').id;
    t.digitGroupSeparator = isString(c.digitGroupSeparator) && !isEmpty(c.digitGroupSeparator) ? c.digitGroupSeparator : t.klass.optionConfig.getDigitGroupSeparator('space').id;

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

        // sharing
    _access = isObject(c.access) ? c.access : null;

        // data dimension items
    _dataDimensionItems = isArray(c.dataDimensionItems) ? c.dataDimensionItems : null;

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
        t.sorting = new Sorting(c.sorting);
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

        // reduce layout
    if (isBoolean(c.reduceLayout)) {
        t.reduceLayout = c.reduceLayout;
    }

    if (c.el && isString(c.el)) {
        t.el = c.el;
    }

    $.extend(t, forceApplyConfig);

    // setter/getter
    t.getResponse = function() {
        return _response;
    };

    t.setResponse = function(r) {
        _response = r;
    };

    t.getAccess = function() {
        return _access;
    };

    t.setAccess = function(a) {
        _access = a;
    };

    t.getDataDimensionItems = function() {
        return _dataDimensionItems;
    };

    t.setDataDimensionItems = function(a) {
        _dataDimensionItems = a;
    };

    t.getRequestPath = function(s, f) {
        return t.klass.appManager.getPath() + (s || _source) + '.' + (f || _format);
    };
};

Layout.prototype.log = function(text, noError) {
    if (!noError) {
        console.log(text, this);
    }
};

Layout.prototype.alert = function(text, noError) {
    if (!noError) {
        alert(text);
    }
};

Layout.prototype.clone = function() {
    var t = this;

    var layout = new Layout(t);

    layout.setResponse(t.getResponse());
    layout.setAccess(t.getAccess());
    layout.setDataDimensionItems(t.getDataDimensionItems());

    return layout;
};

Layout.prototype.getAxes = function(includeFilter) {
    return arrayClean([this.columns, this.rows, (includeFilter ? this.filters : null)]);
};

Layout.prototype.getUserOrgUnitUrl = function() {
    if (isArray(this.userOrgUnit) && this.userOrgUnit.length) {
        return 'userOrgUnit=' + this.userOrgUnit.join(';');
    }
};

// dep 1

Layout.prototype.hasDimension = function(dimensionName, includeFilter) {
    return this.getAxes(includeFilter).some(function(axis) {
        return axis.has(dimensionName);
    });
};

Layout.prototype.getDimensions = function(includeFilter, isSorted, axes) {
    var dimensions = [];

    axes = arrayClean(axes ? arrayFrom(axes) : this.getAxes(includeFilter));

    axes.forEach(function(axis) {
        dimensions = dimensions.concat(axis);
    });

    return isSorted ? dimensions.sort(function(a, b) {return a.dimension > b.dimension;}) : dimensions;
};

Layout.prototype.getRecords = function(includeFilter) {
    var records = [];

    this.getAxes(includeFilter).forEach(function(axis) {
        axis.forEach(function(dimension) {
            records = records.concat(dimension.getRecords());
        });
    });

    return records;
};

// dep 2

Layout.prototype.getRecordIds = function(includeFilter) {
    var ids = [];

    this.getRecords(includeFilter).forEach(function(record) {
        ids.push(record.id);
    });

    return ids;
};

Layout.prototype.getDimension = function(dimensionName) {
    return this.getDimensions(true).find(function(dimension) {
        return dimension.dimension === dimensionName;
    });
};

Layout.prototype.getDimensionNames = function(includeFilter, isSorted, axes) {
    var names = arrayPluck(this.getDimensions(includeFilter, false, axes), 'dimension');

    return isSorted ? names.sort() : names;
};

Layout.prototype.getDimensionNameRecordIdsMap = function(response) {
    var map = {};

    this.getDimensions(true).forEach(function(dimension) {
        map[dimension.dimension] = dimension.getRecordIds(false, response);
    });

    return map;
};

Layout.prototype.removeDimensionItems = function(includeFilter) {
    this.getDimensions(includeFilter).forEach(function(dimension) {
        dimension.removeItems();
    });
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

Layout.prototype.toPlugin = function(el) {
    var appManager = this.klass.appManager,
        optionConfig = this.klass.optionConfig,
        layout;

    if (this.id) {
        layout = {
            id: this.id
        };
    }
    else {
        layout = this.clone();

        // columns, rows, filters
        layout.getAxes(true).forEach(function(item) {
            item.toPlugin();
        });

        // properties
        var deleteIfTruthy = [
            'showRowTotals',
            'showColTotals',
            'showColSubTotals',
            'showRowSubTotals',
            'showDimensionLabels'
        ];

        var deleteIfFalsy = [
            'hideEmptyRows',
            'skipRounding',
            'showHierarchy',
            'completedOnly',
            'legendSet',
            'sorting'
        ];

        var deleteAnyway = [
            'klass',
            'name',
            'parentGraphMap',
            'reportingPeriod',
            'organisationUnit',
            'parentOrganisationUnit',
            'regression',
            'cumulative',
            'sortOrder',
            'topLimit'
        ];

        deleteIfTruthy.forEach(function(item) {
            if (!!layout[item]) {
                delete layout[item];
            }
        });

        deleteIfFalsy.forEach(function(item) {
            if (!layout[item]) {
                delete layout[item];
            }
        });

        deleteAnyway.forEach(function(item) {
            delete layout[item];
        });

        if (layout.displayDensity === optionConfig.getDisplayDensity('normal').id) {
            delete layout.displayDensity;
        }

        if (layout.fontSize === optionConfig.getFontSize('normal').id) {
            delete layout.fontSize;
        }

        if (layout.digitGroupSeparator === optionConfig.getDigitGroupSeparator('space').id) {
            delete layout.digitGroupSeparator;
        }

        if (layout.aggregationType === optionConfig.getAggregationType('def').id) {
            delete layout.aggregationType;
        }

        if (layout.dataApprovalLevel && layout.dataApprovalLevel.id === optionConfig.getDataApprovalLevel('def').id) {
            delete layout.dataApprovalLevel;
        }
    }

    layout.url = appManager.getPath();

    if (el) {
        layout.el = el;
    }

    return layout;
};

Layout.prototype.toPost = function() {
    delete this.klass;
    delete this.getResponse;
    delete this.setResponse;
    delete this.getAccess;
    delete this.setAccess;
    delete this.getDataDimensionItems;
    delete this.setDataDimensionItems;
    delete this.getRequestPath;

    this.getDimensions(true).forEach(function(dimension) {
        dimension.toPost();
    });

    this.rowTotals = this.showRowTotals;
    delete this.showRowTotals;

    this.colTotals = this.showColTotals;
    delete this.showColTotals;

    this.rowSubTotals = this.showRowSubTotals;
    delete this.showRowSubTotals;

    this.colSubTotals = this.showColSubTotals;
    delete this.showColSubTotals;

    this.reportParams = {
        paramReportingPeriod: this.reportingPeriod,
        paramOrganisationUnit: this.organisationUnit,
        paramParentOrganisationUnit: this.parentOrganisationUnit
    };

    delete this.reportingPeriod;
    delete this.organisationUnit;
    delete this.parentOrganisationUnit;

    delete this.parentGraphMap;

    delete this.id;
    delete this.el;
};

Layout.prototype.sort = function(table) {
    var id = this.sorting.id,
        direction = this.sorting.direction,
        dimension = this.rows[0],
        response = this.getResponse(),
        idValueMap = table ? table.idValueMap : response.getIdValueMap(),
        records = [],
        ids,
        sortingId,
        obj;

    if (!isString(id)) {
        return;
    }

    ids = this.getDimensionNameRecordIdsMap(response)[dimension.dimension];

    ids.forEach(function(item) {
        sortingId = parseFloat(idValueMap[(new ResponseRowIdCombination([id, item]).get())]);

        obj = {
            id: item,
            sortingId: isNumber(sortingId) ? sortingId : (Number.MAX_VALUE * -1)
        };

        records.push(obj);
    });

    // sort
    arraySort(records, direction, 'sortingId');

    // dimension
    dimension.items = records;
    dimension.sorted = true;

    dimension = new Dimension(dimension);

    this.sorting.id = id;
};

// dep 3

Layout.prototype.hasRecordIds = function(idParam, includeFilter) {
    var ids = this.getRecordIds(includeFilter);
    var has = false;

    idParam = arrayFrom(idParam);

    idParam.forEach(function(id) {
        if (arrayContains(ids, id)) {
            has = true;
        }
    });

    return has;
};

Layout.prototype.data = function(source, format) {
    var metaDataRequest = this.req(source, format, true);
    var dataRequest = this.req(source, format);

    return {
        metaData: $.getJSON(encodeURI(metaDataRequest.url('skipData=true'))),
        data: $.getJSON(encodeURI(dataRequest.url('skipMeta=true')))
    };
};

Layout.prototype.post = function(fn, doMask, doUnmask) {
    var t = this;

    var appManager = t.klass.appManager,
        instanceManager = t.klass.instanceManager,
        uiManager = t.klass.uiManager;

    var path = appManager.getPath(),
        apiResource = instanceManager.apiResource;

    var url = path + '/api/' + apiResource;

    t.toPost();

    if (doMask) {
        uiManager.mask();
    }

    $.ajax({
        url: encodeURI(url),
        type: 'POST',
        headers: appManager.defaultRequestHeaders,
        data: JSON.stringify(t),
        dataType: 'json',
        success: function(obj, success, r) {
            var id = (r.getResponseHeader('location') || '').split('/').pop();

            if (!isString(id)) {
                console.log('Layout post', 'Invalid id', id);
            }

            if (doUnmask) {
                uiManager.unmask();
            }

            if (fn) {
                fn(id, success, r);
            }
        }
    });
};

Layout.prototype.put = function(fn, doMask, doUnmask) {
    var t = this;

    var appManager = t.klass.appManager,
        instanceManager = t.klass.instanceManager,
        uiManager = t.klass.uiManager;

    var path = appManager.getPath(),
        apiResource = instanceManager.apiResource;

    var url = path + '/api/' + apiResource + '/' + t.id;

    t.toPost();

    if (doMask) {
        uiManager.mask();
    }

    $.ajax({
        url: encodeURI(url),
        type: 'PUT',
        data: JSON.stringify(t),
        dataType: 'json',
        headers: appManager.defaultRequestHeaders,
        success: function(obj, success, r) {
            if (doUnmask) {
                uiManager.unmask();
            }

            if (fn) {
                fn(null, success, r);
            }
        }
    });
};

Layout.prototype.del = function(fn, doMask, doUnmask) {
    var t = this;

    var instanceManager = t.klass.instanceManager;

    instanceManager.delById(t.id, fn, doMask, doUnmask);
};

// dep 4

Layout.prototype.req = function(source, format, isSorted, isTableLayout) {
    var optionConfig = this.klass.optionConfig,
        appManager = this.klass.appManager,
        request = new Request();

    var defAggTypeId = optionConfig.getAggregationType('def').id,
        displayProperty = this.displayProperty || appManager.getAnalyticsDisplayProperty();

    // dimensions
    this.getDimensions(false, isSorted).forEach(function(dimension) {
        request.add(dimension.url(isSorted));
    });

    // filters
    if (this.filters) {
        this.filters.forEach(function(dimension) {
            request.add(dimension.url(isSorted, null, true));
        });
    }

    // skip rounding
    if (this.skipRounding) {
        request.add('skipRounding=true');
    }

    // display property
    request.add('displayProperty=' + displayProperty.toUpperCase());

    // normal request only
    if (!isTableLayout) {

        // hierarchy
        if (this.showHierarchy) {
            request.add('hierarchyMeta=true');
        }

        // completed only
        if (this.completedOnly) {
            request.add('completedOnly=true');
        }

        // aggregation type
        if (isString(this.aggregationType) && this.aggregationType !== defAggTypeId) {
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

        // relative period date
        if (this.relativePeriodDate) {
            request.add('relativePeriodDate=' + this.relativePeriodDate);
        }
    }
    else {

        // table layout
        request.add('tableLayout=true');

        // columns
        request.add('columns=' + this.getDimensionNames(false, false, this.columns).join(';'));

        // rows
        request.add('rows=' + this.getDimensionNames(false, false, this.rows).join(';'));

        // hide empty rows
        if (this.hideEmptyRows) {
            request.add('hideEmptyRows=true');
        }
    }

    // relative orgunits / user
    if (this.hasRecordIds(appManager.userIdDestroyCacheKeys, true)) {
        request.add('user=' + appManager.userAccount.id);
    }

    // base
    request.setBaseUrl(this.getRequestPath(source, format));

    return request;
};
