import {arrayFrom, arrayTo} from 'd2-utilizr';

export var DimensionConfig;

DimensionConfig = function() {
    var t = this;

    // service
    var i18nManager;

    // uninitialized
    var dimensions;

    // map
    var dimensionNameDimensionMap = {
        'dx': 'data',
        'co': 'category',
        'pe': 'period',
        'ou': 'organisationUnit'
    };

    // setter
    var setDimensions = function() {
        dimensions = {
            data: {
                value: 'data',
                name: i18nManager.get('data') || 'Data',
                dimensionName: 'dx',
                objectName: 'dx'
            },
            category: {
                name: i18nManager.get('assigned_categories') || 'Assigned categories',
                dimensionName: 'co',
                objectName: 'co',
            },
            indicator: {
                value: 'indicators',
                name: i18nManager.get('indicators') || 'Indicators',
                dimensionName: 'dx',
                objectName: 'in'
            },
            dataElement: {
                value: 'dataElements',
                name: i18nManager.get('data_elements') || 'Data elements',
                dimensionName: 'dx',
                objectName: 'de'
            },
            operand: {
                value: 'operand',
                name: i18nManager.get('operand') || 'Operand',
                dimensionName: 'dx',
                objectName: 'dc'
            },
            dataSet: {
                value: 'dataSets',
                name: i18nManager.get('data_sets') || 'Data sets',
                dimensionName: 'dx',
                objectName: 'ds'
            },
            eventDataItem: {
                value: 'eventDataItem',
                name: i18nManager.get('event_data_items') || 'Event data items',
                dimensionName: 'dx',
                objectName: 'di'
            },
            programIndicator: {
                value: 'programIndicator',
                name: i18nManager.get('program_indicators') || 'Program indicators',
                dimensionName: 'dx',
                objectName: 'pi'
            },
            period: {
                value: 'period',
                name: i18nManager.get('periods') || 'Periods',
                dimensionName: 'pe',
                objectName: 'pe'
            },
            fixedPeriod: {
                value: 'periods'
            },
            relativePeriod: {
                value: 'relativePeriods'
            },
            organisationUnit: {
                value: 'organisationUnits',
                name: i18nManager.get('i18n.organisation_units') || 'Organisation units',
                dimensionName: 'ou',
                objectName: 'ou'
            },
            dimension: {
                value: 'dimension'
                //objectName: 'di'
            },
            value: {
                value: 'value'
            }
        };
    };

    // init
    var initialize = function() {
        setDimensions();
    };

    // prototype
    t.add = function(param) {
        arrayFrom(param).forEach(function(dimension) {
            dimension.dimensionName = dimension.dimensionName || dimension.id;
            dimension.objectName = dimension.objectName || dimension.id;

            dimensions[dimension.id] = dimension;
        });
    };

    t.get = function(name) {
        var map = dimensionNameDimensionMap;

        return name ? dimensions[name] || dimensions[map[name]] : dimensions;
    };

    t.getDimensionNameMap = function() {
        var map = {};

        for (var name in dimensions) {
            if (dimensions.hasOwnProperty(name)) {
                map[dimensions[name].dimensionName] = dimensions[name];
            }
        }

        return map;
    };

    t.getObjectNameMap = function() {
        var map = {};

        for (var name in dimensions) {
            if (dimensions.hasOwnProperty(name)) {
                map[dimensions[name].objectName] = dimensions[name];
            }
        }

        return map;
    };

    t.setI18nManager = function(manager) {
        i18nManager = manager;
        initialize();
    };
};

DimensionConfig.prototype.applyTo = function(modules) {
    var t = this;

    arrayTo(modules).forEach(function(module) {
        module.dimensionConfig = t;
    });
};
