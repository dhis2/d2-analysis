import isString from 'd2-utilizr/lib/isString';
import isNumber from 'd2-utilizr/lib/isNumber';
import isBoolean from 'd2-utilizr/lib/isBoolean';
import isArray from 'd2-utilizr/lib/isArray';
import isObject from 'd2-utilizr/lib/isObject';
import isDefined from 'd2-utilizr/lib/isDefined';
import arrayFrom from 'd2-utilizr/lib/arrayFrom';
import arrayContains from 'd2-utilizr/lib/arrayContains';
import arrayClean from 'd2-utilizr/lib/arrayClean';
import arrayPluck from 'd2-utilizr/lib/arrayPluck';
import arraySort from 'd2-utilizr/lib/arraySort';

import { Axis } from './Axis.js';
import { Dimension } from './Dimension.js';
import { Request } from './Request.js';
import { ResponseRowIdCombination } from './ResponseRowIdCombination.js';
import { Sorting } from './Sorting.js';
import { DateManager } from '../manager/DateManager.js';

export var Layout;

Layout = function(refs, c, applyConfig, forceApplyConfig) {
    var t = this;

    refs = isObject(refs) ? refs : {};

    c = isObject(c) ? c : {};
    $.extend(c, applyConfig);

    // private
    var _path = refs.appManager.getApiPath();
    var _source = '/analytics';
    var _format = 'json';

    var _response;
    var _access;

    var _dataDimensionItems;

    // constructor
    t.columns = (Axis(c.columns)).val();
    t.rows = (Axis(c.rows)).val();
    t.filters = (Axis(c.filters)).val(true);

        // access
    _access = isObject(c.access) ? c.access : null;

        // data dimension items
    _dataDimensionItems = isArray(c.dataDimensionItems) ? c.dataDimensionItems : null;

        // non model

        // id
    if (isString(c.id)) {
        t.id = c.id;
    }

        // interpretationId
    if (isString(c.interpretationId)) {
        t.interpretationId = c.interpretationId;
    }

        // name
    t.name = arrayClean([c.displayName, c.displayShortName, c.name, c.shortName]).find(item => isString(item));

        // title
    t.title = arrayClean([c.displayShortName, c.title]).find(item => isString(item));

        // description
    if (isString(c.description)) {
        t.description = c.description;
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
    if (isString(c.displayDescription)) {
        t.displayDescription = c.displayDescription;
    }

        //interpretations
    if (arrayFrom(c.interpretations).length) {
        t.interpretations = isArray(c.interpretations) ? c.interpretations : null;
    }

        //lastUpdated
    if (DateManager.getYYYYMMDD(c.lastUpdated)) {
        t.lastUpdated = DateManager.getYYYYMMDD(c.lastUpdated);
    }

        //created
    if (DateManager.getYYYYMMDD(c.created)) {
        t.created = DateManager.getYYYYMMDD(c.created);
    }

        //favorite user
    if (isObject(c.user)) {
        t.user = c.user;
    }

        //public access
    if (isString(c.publicAccess)) {
        t.publicAccess = c.publicAccess;
    }

        //permission
    if (isString(c.permission)) {
        t.permission = c.permission;
    }

        //user group accesses
    if (arrayFrom(c.userGroupAccesses).length) {
        t.userGroupAccesses = c.userGroupAccesses;
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

    t.getDefaultPath = function() {
        return _path;
    };

    t.getDefaultSource = function() {
        return _source;
    };

    t.getDefaultFormat = function() {
        return _format;
    };

    t.getRequestPath = function(s, f) {
        return (_path || refs.appManager.getPath()) + (s || _source) + '.' + (f || _format);
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

Layout.prototype.apply = function(obj, keys) {
    if (!isObject(obj)) {
        return;
    }

    var t = this;

    var preservedProps = ['name', 'description'];

    keys = isArray(keys) ? keys : preservedProps;

    keys.forEach(function(key) {
        t[key] = obj[key];
    });

    return t;
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

Layout.prototype.applyInterpretation = function(interpretation) {
    this.setResponse(null);
    this.relativePeriodDate = interpretation.created;
    this.interpretationId = interpretation.id;
};

Layout.prototype.setSharing = function(sharing) {
    this.publicAccess = sharing.publicAccess;
    this.externalAccess = sharing.externalAccess;
    this.userGroupAccesses = sharing.userGroupAccesses;
    this.userAccesses = sharing.userAccesses;
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

Layout.prototype.stripAxes = function(includeFilter, skipAddToFilter) {
    var t = this;

    if (!skipAddToFilter && !t.filters) {
        t.filters = new t.getRefs().api.Axis();
    }

    t.getAxes(includeFilter).forEach(function(axis) {
        axis.strip().forEach(function(dimension) {
            if (!skipAddToFilter) {
                t.filters.add(dimension);
            }
        });
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
    var i18nManager = this.getRefs().i18nManager;

    if (!(this.columns || this.rows)) {
        this.alert(i18nManager.get('at_least_one_dimension_must_be_specified_as_row_or_column'), noError); //todo alert
        return null;
    }

    if (!this.hasDimension(refs.dimensionConfig.get('period').dimensionName, true)) {
        this.alert(i18nManager.get('at_least_one_period_must_be_specified_as_column_row_or_filter'), noError); //todo alert
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
            'showDimensionLabels',
            'showValues'
        ];

        var deleteIfFalsy = [
            'hideEmptyRows',
            'skipRounding',
            'showHierarchy',
            'completedOnly',
            'hideLegend',
            'hideTitle',
            'title',
            'legendSet',
            'sorting',

            'targetLineValue',
            'targetLineTitle',
            'baseLineValue',
            'baseLineTitle',
            'rangeAxisMaxValue',
            'rangeAxisMinValue',
            'rangeAxisSteps',
            'rangeAxisDecimals',
            'rangeAxisTitle',
            'domainAxisTitle',

            'regression',
            'cumulative',
            'sortOrder',
            'topLimit'
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
            'topLimit',
            'displayDescription',
            'interpretations',
            'lastUpdated',
            'created',
            'user',
            'publicAccess',
            'permission',
            'userGroupAccesses',
            'prototype',
            'url'
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

        if (layout.regressionType === 'NONE') {
            delete layout.regressionType;
        }
    }

    layout.url = appManager.getPath();

    if (el) {
        layout.el = el;
    }

    return layout;
};

Layout.prototype.toPostSuper = function() {
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

    delete this.displayDescription;
    delete this.interpretations;
    delete this.lastUpdated;
    delete this.created;
    delete this.user;
    delete this.publicAccess;
    delete this.permission,
    delete this.userGroupAccesses;
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

Layout.prototype.getFirstDxId = function() {
    return this.getDimension('dx').getRecordIds()[0];
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

Layout.prototype.del = function(fn, doMask, doUnmask) {
    var t = this,
        refs = this.getRefs();

    var instanceManager = refs.instanceManager;

    instanceManager.delById(t.id, fn, doMask, doUnmask);
};

Layout.prototype.toPost = function() {
    var t = this;

    t.toPostSuper();
};

// dep 4

Layout.prototype.toPut = function() {
    this.toPost();
};

// dep 5

Layout.prototype.post = function(fn, doMask, doUnmask) {
    var t = this,
        refs = this.getRefs();

    var appManager = refs.appManager,
        instanceManager = refs.instanceManager,
        uiManager = refs.uiManager;

    var apiPath = appManager.getApiPath(),
        apiEndpoint = instanceManager.apiEndpoint;

    var url = apiPath + '/' + apiEndpoint;

    if (doMask) {
        uiManager.mask();
    }

    instanceManager.getSharingById(t.id, function(sharing) {
        t.toPost();

        // set sharing
        if (isObject(sharing) && isObject(sharing.object)) {
            t.setSharing(sharing.object);
        }

        // post
        var postRequest = new Request({
            baseUrl: url,
            type: 'ajax',
            method: 'POST',
            data: JSON.stringify(t),
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

        postRequest.run();
    });
};

Layout.prototype.put = function(id, fn, doMask, doUnmask) {
    var t = this,
        refs = this.getRefs();

    var appManager = refs.appManager,
        instanceManager = refs.instanceManager,
        uiManager = refs.uiManager;

    var apiPath = appManager.getApiPath(),
        apiEndpoint = instanceManager.apiEndpoint;

    var url = apiPath + '/' + apiEndpoint + '/' + id;

    if (doMask) {
        uiManager.mask();
    }

    instanceManager.getSharingById(t.id, function(sharing) {
        t.toPut();

        // set sharing
        if (isObject(sharing) && isObject(sharing.object)) {
            t.setSharing(sharing.object);
        }

        // put
        var putRequest = new Request({
            baseUrl: url,
            type: 'ajax',
            method: 'PUT',
            data: JSON.stringify(t),
            success: function(obj, success, r) {
                if (doUnmask) {
                    uiManager.unmask();
                }

                if (fn) {
                    fn(id, success, r);
                }
            }
        });

        putRequest.run();
    });
};

Layout.prototype.patch = function(properties, fn, doMask, doUnmask) {
    var t = this,
        refs = this.getRefs();

    var appManager = refs.appManager,
        instanceManager = refs.instanceManager,
        uiManager = refs.uiManager;

    var apiPath = appManager.getApiPath(),
        apiEndpoint = instanceManager.apiEndpoint;

    var url = apiPath + '/' + apiEndpoint + '/' + t.id;

    if (!isObject(properties)) {
        return;
    }

    if (doMask) {
        uiManager.mask();
    }

    $.ajax({
        url: encodeURI(url),
        type: 'PATCH',
        data: JSON.stringify(properties),
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





Layout.prototype.req = function(source, format, isSorted, isTableLayout, isFilterAsDimension) {
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
            var isFilter = !(isFilterAsDimension && dimension.isRequired());

            request.add(dimension.url(isSorted, null, isFilter));
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
