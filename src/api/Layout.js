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

Layout = function(refs, c, applyConfig, forceApplyConfig) {
    var t = this;

    refs = isObject(refs) ? refs : {};

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
    
    	//description
    
    	//interpretations
    if (arrayFrom(c.interpretations).length) {
    	t.interpretations = isArray(c.interpretations) ? c.interpretations : null;
    }
    
    	//lastUpdated
    if (DateManager.getYYYYMMDD(c.lastUpdated, true)) {
    	t.lastUpdated = DateManager.getYYYYMMDD(c.lastUpdated, true);
    }
    
    	//created
    if (DateManager.getYYYYMMDD(c.created, true)) {
    	t.created = DateManager.getYYYYMMDD(c.created, true);
    }
    
    	//favorite user
    if (isObject(c.user)){
    	t.user = c.user;
    }
    
    	//Access?
    

        // reduce layout //todo: move to specific app
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

    t.getDefaultSource = function() {
        return _source;
    };

    t.getDefaultFormat = function() {
        return _format;
    };

    t.getRequestPath = function(s, f) {
        return refs.appManager.getPath() + (s || _source) + '.' + (f || _format);
    };

    t.getRefs = function() {
        return refs;
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

Layout.prototype.toRows = function(includeFilter) {
    this.rows = arrayClean(this.rows.concat(this.columns.empty(), includeFilter ? this.filters.empty() : []));
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

Layout.prototype.getRecords = function(includeFilter, response) {
    var t = this;

    var records = [];

    this.getAxes(includeFilter).forEach(function(axis) {
        axis.forEach(function(dimension) {
            records = records.concat(dimension.getRecords(null, response));
        });
    });

    return records;
};

Layout.prototype.extendRecords = function(response) {
    this.getAxes(true).forEach(function(axis) {
        axis.extendRecords(response);
    });
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
    var t = this,
        refs = this.getRefs();

    var appManager = refs.appManager,
        optionConfig = refs.optionConfig,
        layout;

    if (t.id) {
        layout = {
            id: t.id
        };
    }
    else {
        layout = t.clone();

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

Layout.prototype.toSession = function() {
    var t = this;

    var response = t.getResponse();

    t.extendRecords(response);

    return t;
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
    var t = this,
        refs = this.getRefs();

    var uiManager = refs.uiManager;

    var metaDataRequest = this.req(source, format);
    var dataRequest = this.req(source, format, true);

    var errorFn = function(r) {

        // 409
        if (isObject(r) && r.status == 409) {
            uiManager.unmask();

            if (isString(r.responseText)) {
                uiManager.alert(JSON.parse(r.responseText));
            }
        }
    };

    metaDataRequest.setType(this.getDefaultFormat());
    dataRequest.setType(this.getDefaultFormat());

    metaDataRequest.add('skipData=true');
    dataRequest.add('skipMeta=true');

    metaDataRequest.setError(errorFn);
    dataRequest.setError(Function.prototype);

    return {
        metaData: metaDataRequest.run(),
        data: dataRequest.run()
    };
};

Layout.prototype.post = function(fn, doMask, doUnmask) {
    var t = this,
        refs = this.getRefs();

    var appManager = refs.appManager,
        instanceManager = refs.instanceManager,
        uiManager = refs.uiManager;

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
    var t = this,
        refs = this.getRefs();

    var appManager = refs.appManager,
        instanceManager = refs.instanceManager,
        uiManager = refs.uiManager;

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
    var t = this,
        refs = this.getRefs();

    var instanceManager = refs.instanceManager;

    instanceManager.delById(t.id, fn, doMask, doUnmask);
};

// dep 4

Layout.prototype.req = function(source, format, isSorted, isTableLayout) {
    var t = this,
        refs = this.getRefs();

    var optionConfig = refs.optionConfig,
        appManager = refs.appManager,
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
    if (!isTableLayout) {

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

        // show hierarchy
        if (this.showHierarchy) {
            request.add('showHierarchy=true');
        }
    }

    // relative orgunits / user
    if (this.hasRecordIds(appManager.userIdDestroyCacheKeys, true)) {
        request.add('user=' + appManager.userAccount.id);
    }

    // base
    request.setBaseUrl(this.getRequestPath(source, format));

    return request;
};
