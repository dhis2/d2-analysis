export var Layout;

Layout = function(config, applyConfig, forceApplyConfig) {
    var t = this;

    config = isObject(config) ? config : {};
    $.extend(config, applyConfig);

    // constructor
    t.columns = (Api.Axis(config.columns)).val();
    t.rows = (Api.Axis(config.rows)).val();
    t.filters = (Api.Axis(config.filters)).val();

    t.showColTotals = isBoolean(config.colTotals) ? config.colTotals : (isBoolean(config.showColTotals) ? config.showColTotals : true);
    t.showRowTotals = isBoolean(config.rowTotals) ? config.rowTotals : (isBoolean(config.showRowTotals) ? config.showRowTotals : true);
    t.showColSubTotals = isBoolean(config.colSubTotals) ? config.colSubTotals : (isBoolean(config.showColSubTotals) ? config.showColSubTotals : true);
    t.showRowSubTotals = isBoolean(config.rowSubTotals) ? config.rowSubTotals : (isBoolean(config.showRowSubTotals) ? config.showRowSubTotals : true);
    t.showDimensionLabels = isBoolean(config.showDimensionLabels) ? config.showDimensionLabels : (isBoolean(config.showDimensionLabels) ? config.showDimensionLabels : true);
    t.hideEmptyRows = isBoolean(config.hideEmptyRows) ? config.hideEmptyRows : false;
    t.skipRounding = isBoolean(config.skipRounding) ? config.skipRounding : false;
    t.aggregationType = isString(config.aggregationType) ? config.aggregationType : OptionConf.getAggregationType('def').id;
    t.dataApprovalLevel = isObject(config.dataApprovalLevel) && isString(config.dataApprovalLevel.id) ? config.dataApprovalLevel : null;
    t.showHierarchy = isBoolean(config.showHierarchy) ? config.showHierarchy : false;
    t.completedOnly = isBoolean(config.completedOnly) ? config.completedOnly : false;
    t.displayDensity = isString(config.displayDensity) && !isEmpty(config.displayDensity) ? config.displayDensity : OptionConf.getDisplayDensity('normal').id;
    t.fontSize = isString(config.fontSize) && !isEmpty(config.fontSize) ? config.fontSize : OptionConf.getFontSize('normal').id;
    t.digitGroupSeparator = isString(config.digitGroupSeparator) && !isEmpty(config.digitGroupSeparator) ? config.digitGroupSeparator : OptionConf.getDigitGroupSeparator('space').id;

    t.legendSet = (new Api.Record(config.legendSet)).val(true);

    t.parentGraphMap = isObject(config.parentGraphMap) ? config.parentGraphMap : null;

    if (isObject(config.program)) {
        t.program = config.program;
    }

        // report table
    t.reportingPeriod = isObject(config.reportParams) && isBoolean(config.reportParams.paramReportingPeriod) ? config.reportParams.paramReportingPeriod : (isBoolean(config.reportingPeriod) ? config.reportingPeriod : false);
    t.organisationUnit =  isObject(config.reportParams) && isBoolean(config.reportParams.paramOrganisationUnit) ? config.reportParams.paramOrganisationUnit : (isBoolean(config.organisationUnit) ? config.organisationUnit : false);
    t.parentOrganisationUnit = isObject(config.reportParams) && isBoolean(config.reportParams.paramParentOrganisationUnit) ? config.reportParams.paramParentOrganisationUnit : (isBoolean(config.parentOrganisationUnit) ? config.parentOrganisationUnit : false);

    t.regression = isBoolean(config.regression) ? config.regression : false;
    t.cumulative = isBoolean(config.cumulative) ? config.cumulative : false;
    t.sortOrder = isNumber(config.sortOrder) ? config.sortOrder : 0;
    t.topLimit = isNumber(config.topLimit) ? config.topLimit : 0;

        // non model

        // id
    if (isString(config.id)) {
        t.id = config.id;
    }

        // name
    if (isString(config.name)) {
        t.name = config.name;
    }

        // sorting
    if (isObject(config.sorting) && isDefined(config.sorting.id) && isString(config.sorting.direction)) {
        t.sorting = config.sorting;
    }

        // displayProperty
    if (isString(config.displayProperty)) {
        t.displayProperty = config.displayProperty;
    }

        // userOrgUnit
    if (arrayFrom(config.userOrgUnit).length) {
        t.userOrgUnit = arrayFrom(config.userOrgUnit);
    }

        // relative period date
    if (DateManager.getYYYYMMDD(config.relativePeriodDate)) {
        t.relativePeriodDate = DateManager.getYYYYMMDD(config.relativePeriodDate);
    }

    $.extend(t, forceApplyConfig);

    // uninitialized
    t.dimensionNameRecordIdsMap;
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
        request = new Api.Request(),
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
    if (request) {
        return $.getJSON('/api/analytics.json' + request.url());
    }

    var baseUrl = '/api/analytics.json',
        metaDataRequest = this.req(baseUrl, true),
        dataRequest = this.req(baseUrl);

    return {
        metaData: $.getJSON(metaDataRequest.url('skipData=true')),
        data: $.getJSON(dataRequest.url('skipMeta=true'))
    };
};
