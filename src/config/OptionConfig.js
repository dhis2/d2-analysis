import arrayTo from 'd2-utilizr/lib/arrayTo';
import arraySort from 'd2-utilizr/lib/arraySort';
import stringReplaceAll from 'd2-utilizr/lib/stringReplaceAll';

export var OptionConfig;

OptionConfig = function() {
    var t = this;

    // service
    var i18nManager;

    // uninitialized
    var displayDensity;
    var fontSize;
    var digitGroupSeparator;
    var aggregationType;
    var dataApprovalLevel;
    var dataSetMetric;
    var legendDisplayStyle;

    // setter
    var setDisplayDensity = function() {
        displayDensity = {
            'comfortable': {
                index: 1,
                id: 'COMFORTABLE',
                name: i18nManager.get('comfortable') || 'Comfortable'
            },
            'normal': {
                index: 2,
                id: 'NORMAL',
                name: i18nManager.get('normal') || 'Normal'
            },
            'compact': {
                index: 3,
                id: 'COMPACT',
                name: i18nManager.get('compact') || 'Compact'
            }
        };
    };

    var setFontSize = function() {
        fontSize = {
            'large': {
                index: 1,
                id: 'LARGE',
                name: i18nManager.get('large') || 'Large'
            },
            'normal': {
                index: 2,
                id: 'NORMAL',
                name: i18nManager.get('normal') || 'Normal'
            },
            'small': {
                index: 3,
                id: 'SMALL',
                name: i18nManager.get('small') || 'Small'
            }
        };
    };

    var setDigitGroupSeparator = function() {
        digitGroupSeparator = {
            'none': {
                index: 1,
                id: 'NONE',
                name: i18nManager.get('none') || 'None',
                value: ''
            },
            'space': {
                index: 2,
                id: 'SPACE',
                name: i18nManager.get('space') || 'Space',
                value: '&nbsp;'
            },
            'comma': {
                index: 3,
                id: 'COMMA',
                name: i18nManager.get('comma') || 'Comma',
                value: ','
            }
        };
    };

    var setAggregationType = function() {
        aggregationType = {
            'def': {
                index: 1,
                id: 'DEFAULT',
                name: i18nManager.get('by_data_element') || 'By data element'
            },
            'count': {
                index: 2,
                id: 'COUNT',
                name: i18nManager.get('count') || 'Count'
            },
            'avg': {
                index: 3,
                id: 'AVERAGE',
                name: i18nManager.get('average') || 'Average'
            },
            'sum': {
                index: 4,
                id: 'SUM',
                name: i18nManager.get('sum') || 'Sum'
            },
            'stddev': {
                index: 5,
                id: 'STDDEV',
                name: i18nManager.get('stddev') || 'Standard deviation'
            },
            'variance': {
                index: 6,
                id: 'VARIANCE',
                name: i18nManager.get('variance') || 'Variance'
            },
            'min': {
                index: 7,
                id: 'MIN',
                name: i18nManager.get('min') || 'Min'
            },
            'max': {
                index: 8,
                id: 'MAX',
                name: i18nManager.get('max') || 'Max'
            }
        };
    };

    var setDataApprovalLevel = function() {
        dataApprovalLevel = {
            'def': {
                index: 1,
                id: 'DEFAULT',
                name: i18nManager.get('show_all_data') || 'Show all data'
            }
        };
    };

    var setDataSetMetric = function() {
        dataSetMetric = {
            'reportingRates': {
                index: 1,
                id: 'REPORTING_RATE',
                name: i18nManager.get('reporting_rates') || 'Reporting rates'
            },
            'reportingRatesOnTime': {
                index: 2,
                id: 'REPORTING_RATE_ON_TIME',
                name: i18nManager.get('reporting_rates_on_time') || 'Reporting rates on time'
            },
            'actualReports': {
                index: 3,
                id: 'ACTUAL_REPORTS',
                name: i18nManager.get('actual_reports') || 'Actual reports'
            },
            'actualReportsOnTime': {
                index: 4,
                id: 'ACTUAL_REPORTS_ON_TIME',
                name: i18nManager.get('actual_reports_on_time') || 'Actual reports on time'
            },
            'expectedReports': {
                index: 5,
                id: 'EXPECTED_REPORTS',
                name: i18nManager.get('expected_reports') || 'Expected reports'
            }
        };
    };

    var setLegendDisplayStyle = function() {
        legendDisplayStyle = {
            'fill': {
                index: 0,
                id: 'FILL',
                name: i18nManager.get('background_color') || 'Background color'
            },
            'text': {
                index: 1,
                id: 'TEXT',
                name: i18nManager.get('text_color') || 'Text color'
            }
        };
    };

    // logic
    var getRecords = function(optionType) {
        var records = [];

        for (var option in optionType) {
            if (optionType.hasOwnProperty(option)) {
                records.push(optionType[option]);
            }
        }

        arraySort(records, 'ASC', 'index');

        return records;
    };

    // init
    var initialize = function() {
        setDisplayDensity();
        setFontSize();
        setDigitGroupSeparator();
        setAggregationType();
        setDataApprovalLevel();
        setDataSetMetric();
        setLegendDisplayStyle();
    };

    // prototype
    t.getDisplayDensity = function(key) {
        return key ? displayDensity[key] : displayDensity;
    };

    t.getFontSize = function(key) {
        return key ? fontSize[key] : fontSize;
    };

    t.getDigitGroupSeparator = function(key) {
        return key ? digitGroupSeparator[key] : digitGroupSeparator;
    };

    t.getAggregationType = function(key) {
        return key ? aggregationType[key] : aggregationType;
    };

    t.getDataApprovalLevel = function(key) {
        return key ? dataApprovalLevel[key] : dataApprovalLevel;
    };

    t.getDataSetMetric = function(key) {
        return key ? dataSetMetric[key] : dataSetMetric;
    };

    t.getLegendDisplayStyle = function(key) {
        return key ? legendDisplayStyle[key] : legendDisplayStyle;
    };

    t.getDisplayDensityRecords = function() {
        return getRecords(displayDensity);
    };

    t.getFontSizeRecords = function() {
        return getRecords(fontSize);
    };

    t.getDigitGroupSeparatorRecords = function() {
        return getRecords(digitGroupSeparator);
    };

    t.getAggregationTypeRecords = function() {
        return getRecords(aggregationType);
    };

    t.getDataSetMetricRecords = function() {
        return getRecords(dataSetMetric);
    };

    t.getLegendDisplayStyleRecords = function() {
        return getRecords(legendDisplayStyle);
    };

    t.getDigitGroupSeparatorIdMap = function() {
        var map = {};

        for (var separator in digitGroupSeparator) {
            if (digitGroupSeparator.hasOwnProperty(separator)) {
                map[digitGroupSeparator[separator].id] = digitGroupSeparator[separator];
            }
        }

        return map;
    };


    t.setI18nManager = function(manager) {
        i18nManager = manager;
        initialize();
    };
};

OptionConfig.prototype.applyTo = function(modules) {
    var t = this;

    arrayTo(modules).forEach(function(module) {
        module.optionConfig = t;
    });
};

OptionConfig.prototype.getDigitGroupSeparatorValueById = function(id) {
    var t = this;

    var separator = t.getDigitGroupSeparatorIdMap()[id];
    return separator ? separator.value : '';
};

// dep 1

OptionConfig.prototype.prettyPrint = function(number, separator, noHtml) {
    var t = this;

    var spaceId = t.getDigitGroupSeparator('space').id,
        noneId = t.getDigitGroupSeparator('none').id,
        noneValue = t.getDigitGroupSeparator('none').value;

    separator = separator || spaceId;

    if (separator === noneId) {
        return number;
    }

    var [num, dec] = ('' + number).split('.');

    var pp = num.replace(/\B(?=(\d{3})+(?!\d))/g, t.getDigitGroupSeparatorValueById(separator) || noneValue) + (dec ? '.' + dec : '');

    if (noHtml) {
        pp = stringReplaceAll(pp, "&nbsp;", " ");
    }

    return pp;
};
