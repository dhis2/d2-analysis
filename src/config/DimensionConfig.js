import arrayFrom from 'd2-utilizr/lib/arrayFrom';
import arrayTo from 'd2-utilizr/lib/arrayTo';

export var DimensionConfig;

DimensionConfig = function() {
    var t = this;

    // service
    var i18nManager;

    // uninitialized
    var dimensions;

    // dimension name map
    var dimensionNameDimensionMap = {
        'dx': 'data',
        'co': 'category',
        'pe': 'period',
        'ou': 'organisationUnit'
    };

    // data type
    t.dataType = {
        'aggregated_values': 'AGGREGATED_VALUES',
        'individual_cases': 'EVENTS'
    };

    // value type
    t.valueType = {
        'numeric_types': ['NUMBER','UNIT_INTERVAL','PERCENTAGE','INTEGER','INTEGER_POSITIVE','INTEGER_NEGATIVE','INTEGER_ZERO_OR_POSITIVE'],
        'text_types': ['TEXT','LONG_TEXT','LETTER','PHONE_NUMBER','EMAIL'],
        'boolean_types': ['BOOLEAN','TRUE_ONLY'],
        'date_types': ['DATE','DATETIME'],
        'aggregate_aggregatable_types': ['BOOLEAN', 'TRUE_ONLY', 'TEXT', 'LONG_TEXT', 'LETTER', 'INTEGER', 'INTEGER_POSITIVE', 'INTEGER_NEGATIVE', 'INTEGER_ZERO_OR_POSITIVE', 'NUMBER', 'UNIT_INTERVAL', 'PERCENTAGE', 'COORDINATE'],
        'tracker_aggregatable_types': ['NUMBER','UNIT_INTERVAL','PERCENTAGE','INTEGER','INTEGER_POSITIVE','INTEGER_NEGATIVE','INTEGER_ZERO_OR_POSITIVE','BOOLEAN','TRUE_ONLY']
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
                value: 'indicator',
                name: i18nManager.get('indicators') || 'Indicators',
                dimensionName: 'dx',
                objectName: 'in'
            },
            dataElement: {
                value: 'dataElement',
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
                value: 'dataSet',
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
                value: 'period'
            },
            relativePeriod: {
                value: 'relativePeriod'
            },
            organisationUnit: {
                value: 'organisationUnit',
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
