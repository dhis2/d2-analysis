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
    var numberType;
    var outputType;
    var dataApprovalLevel;
    var dataSetMetric;
    var legendDisplayStyle;
    var legendDisplayStrategy;
    var programStatus;
    var eventStatus;
    var timeField;

    // setter
    var setDisplayDensity = function() {
        displayDensity = {
            comfortable: {
                index: 1,
                id: 'COMFORTABLE',
                name: i18nManager.get('comfortable') || 'Comfortable',
            },
            normal: {
                index: 2,
                id: 'NORMAL',
                name: i18nManager.get('normal') || 'Normal',
            },
            compact: {
                index: 3,
                id: 'COMPACT',
                name: i18nManager.get('compact') || 'Compact',
            },
        };
    };

    var setFontSize = function() {
        fontSize = {
            large: {
                index: 1,
                id: 'LARGE',
                name: i18nManager.get('large') || 'Large',
            },
            normal: {
                index: 2,
                id: 'NORMAL',
                name: i18nManager.get('normal') || 'Normal',
            },
            small: {
                index: 3,
                id: 'SMALL',
                name: i18nManager.get('small') || 'Small',
            },
        };
    };

    var setDigitGroupSeparator = function() {
        digitGroupSeparator = {
            none: {
                index: 1,
                id: 'NONE',
                name: i18nManager.get('none') || 'None',
                value: '',
            },
            space: {
                index: 2,
                id: 'SPACE',
                name: i18nManager.get('space') || 'Space',
                value: '&nbsp;',
            },
            comma: {
                index: 3,
                id: 'COMMA',
                name: i18nManager.get('comma') || 'Comma',
                value: ',',
            },
        };
    };

    var setAggregationType = function() {
        aggregationType = {
            def: {
                index: 1,
                id: 'DEFAULT',
                name: i18nManager.get('by_data_element') || 'By data element',
            },
            count: {
                index: 2,
                id: 'COUNT',
                name: i18nManager.get('count') || 'Count',
            },
            avg: {
                index: 3,
                id: 'AVERAGE',
                name: i18nManager.get('average') || 'Average',
            },
            'avg-sum-org-unit': {
                index: 3,
                id: 'AVERAGE_SUM_ORG_UNIT',
                name:
                    i18nManager.get('average_sum_org_unit') ||
                    'Average (sum in org unit hierarchy)',
            },
            sum: {
                index: 3,
                id: 'SUM',
                name: i18nManager.get('sum') || 'Sum',
            },
            stddev: {
                index: 4,
                id: 'STDDEV',
                name: i18nManager.get('stddev') || 'Standard deviation',
            },
            variance: {
                index: 5,
                id: 'VARIANCE',
                name: i18nManager.get('variance') || 'Variance',
            },
            min: {
                index: 6,
                id: 'MIN',
                name: i18nManager.get('min') || 'Min',
            },
            max: {
                index: 7,
                id: 'MAX',
                name: i18nManager.get('max') || 'Max',
            },
            last: {
                index: 8,
                id: 'LAST',
                name: i18nManager.get('last') || 'Last value',
            },
            'last-average-org-unit': {
                index: 9,
                id: 'LAST_AVERAGE_ORG_UNIT',
                name:
                    i18nManager.get('last_average_org_unit') ||
                    'Last value (average in org unit hierarchy)',
            },
        };
    };

    var setNumberType = function() {
        numberType = {
            value: {
                index: 1,
                id: 'VALUE',
                name: i18nManager.get('value') || 'Value',
            },
            percentofrow: {
                index: 2,
                id: 'ROW_PERCENTAGE',
                name: i18nManager.get('percent_of_row') || 'Percentage of row',
            },
            percentofcolumn: {
                index: 3,
                id: 'COLUMN_PERCENTAGE',
                name: i18nManager.get('percent_of_column') || 'Percentage of column',
            },
        };
    };

    var setOutputType = function() {
        outputType = {
            event: {
                index: 1,
                id: 'EVENT',
                name: i18nManager.get('event') || 'Event',
            },
            enrollment: {
                index: 2,
                id: 'ENROLLMENT',
                name: i18nManager.get('enrollment') || 'Enrollment',
            },
            trackedentityinstance: {
                index: 3,
                id: 'TRACKED_ENTITY_INSTANCE',
                name: i18nManager.get('tracked_entity_instance') || 'Tracked entity instance',
            },
        };
    };

    var setDataApprovalLevel = function() {
        dataApprovalLevel = {
            def: {
                index: 1,
                id: 'DEFAULT',
                name: i18nManager.get('show_all_data') || 'Show all data',
            },
        };
    };

    var setDataSetMetric = function() {
        dataSetMetric = {
            reportingRates: {
                index: 1,
                id: 'REPORTING_RATE',
                name: i18nManager.get('reporting_rates') || 'Reporting rates',
            },
            reportingRatesOnTime: {
                index: 2,
                id: 'REPORTING_RATE_ON_TIME',
                name: i18nManager.get('reporting_rates_on_time') || 'Reporting rates on time',
            },
            actualReports: {
                index: 3,
                id: 'ACTUAL_REPORTS',
                name: i18nManager.get('actual_reports') || 'Actual reports',
            },
            actualReportsOnTime: {
                index: 4,
                id: 'ACTUAL_REPORTS_ON_TIME',
                name: i18nManager.get('actual_reports_on_time') || 'Actual reports on time',
            },
            expectedReports: {
                index: 5,
                id: 'EXPECTED_REPORTS',
                name: i18nManager.get('expected_reports') || 'Expected reports',
            },
        };
    };

    var setLegendDisplayStyle = function() {
        legendDisplayStyle = {
            fill: {
                index: 2,
                id: 'FILL',
                name: i18nManager.get('background_color') || 'Background color',
            },
            text: {
                index: 3,
                id: 'TEXT',
                name: i18nManager.get('text_color') || 'Text color',
            },
        };
    };

    var setLegendDisplayStrategy = function() {
        legendDisplayStrategy = {
            fixed: {
                index: 1,
                id: 'FIXED',
                name: i18nManager.get('all_data_items') || 'All',
            },
            by_data_item: {
                index: 2,
                id: 'BY_DATA_ITEM',
                name: i18nManager.get('by_data_item') || 'By data item',
            },
        };
    };

    var setProgramStatus = function() {
        programStatus = {
            def: {
                index: 1,
                id: 'DEFAULT',
                name: i18nManager.get('all') || 'All',
            },
            active: {
                index: 2,
                id: 'ACTIVE',
                name: i18nManager.get('active') || 'Active',
            },
            completed: {
                index: 3,
                id: 'COMPLETED',
                name: i18nManager.get('completed') || 'Completed',
            },
            cancelled: {
                index: 4,
                id: 'CANCELLED',
                name: i18nManager.get('cancelled') || 'Cancelled',
            },
        };
    };

    var setEventStatus = function() {
        eventStatus = {
            def: {
                index: 1,
                id: 'DEFAULT',
                name: i18nManager.get('all') || 'All',
            },
            active: {
                index: 2,
                id: 'ACTIVE',
                name: i18nManager.get('active') || 'Active',
            },
            completed: {
                index: 3,
                id: 'COMPLETED',
                name: i18nManager.get('completed') || 'Completed',
            },
            scheduled: {
                index: 4,
                id: 'SCHEDULE',
                name: i18nManager.get('scheduled') || 'Scheduled',
            },
            overdue: {
                index: 5,
                id: 'OVERDUE',
                name: i18nManager.get('overdue') || 'Overdue',
            },
            skipped: {
                index: 6,
                id: 'SKIPPED',
                name: i18nManager.get('skipped') || 'Skipped',
            },
        };
    };

    var setTimeField = function() {
        timeField = {
            eventdate: {
                index: 1,
                id: 'EVENT_DATE',
                name: i18nManager.get('event_date') || 'Event date',
            },
            created: {
                index: 2,
                id: 'CREATED',
                name: i18nManager.get('created_date') || 'Created date',
            },
            lastupdated: {
                index: 3,
                id: 'LAST_UPDATED',
                name: i18nManager.get('last_updated') || 'Last updated date',
            },
            enrollmentdate: {
                index: 4,
                id: 'ENROLLMENT_DATE',
                name: i18nManager.get('enrollment_date') || 'Enrollment date',
            },
            incidentdate: {
                index: 5,
                id: 'INCIDENT_DATE',
                name: i18nManager.get('incident_date') || 'Incident date',
            },
            duedate: {
                index: 6,
                id: 'DUE_DATE',
                name: i18nManager.get('due_date') || 'Due date',
            },
            completeddate: {
                index: 7,
                id: 'COMPLETED_DATE',
                name: i18nManager.get('completed_date') || 'Completed date',
            },
        };
    };

    // logic
    var getRecords = function(optionType) {
        var records = [];

        for (var option in optionType) {
            if (optionType.hasOwnProperty(option)) {
                records.push(optionType[option]);
            }
        }

        arraySort(records, 'ASC', 'index');

        return records;
    };

    // init
    t.init = function() {
        setDisplayDensity();
        setFontSize();
        setDigitGroupSeparator();
        setAggregationType();
        setNumberType();
        setOutputType();
        setDataApprovalLevel();
        setDataSetMetric();
        setLegendDisplayStyle();
        setLegendDisplayStrategy();
        setProgramStatus();
        setEventStatus();
        setTimeField();
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

    t.getNumberType = function(key) {
        return key ? numberType[key] : numberType;
    };

    t.getOutputType = function(key) {
        return key ? outputType[key] : outputType;
    };

    t.getDataApprovalLevel = function(key) {
        return key ? dataApprovalLevel[key] : dataApprovalLevel;
    };

    t.getDataSetMetric = function(key) {
        return key ? dataSetMetric[key] : dataSetMetric;
    };

    t.getLegendDisplayStyle = function(key) {
        return key ? legendDisplayStyle[key] : legendDisplayStyle;
    };

    t.getLegendDisplayStrategy = function(key) {
        return key ? legendDisplayStrategy[key] : legendDisplayStrategy;
    };

    t.getProgramStatus = function(key) {
        return key ? programStatus[key] : programStatus;
    };

    t.getEventStatus = function(key) {
        return key ? eventStatus[key] : eventStatus;
    };

    t.getTimeField = function(key) {
        return key ? timeField[key] : timeField;
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

    t.getNumberTypeRecords = function() {
        return getRecords(numberType);
    };

    t.getOutputTypeRecords = function() {
        return getRecords(outputType);
    };

    t.getDataSetMetricRecords = function() {
        return getRecords(dataSetMetric);
    };

    t.getLegendDisplayStyleRecords = function() {
        return getRecords(legendDisplayStyle);
    };

    t.getLegendDisplayStrategyRecords = function() {
        return getRecords(legendDisplayStrategy);
    };

    t.getProgramStatusRecords = function() {
        return getRecords(programStatus);
    };

    t.getEventStatusRecords = function() {
        return getRecords(eventStatus);
    };

    t.getTimeFieldRecords = function() {
        return getRecords(timeField);
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

    t.setI18nManager = function(manager) {
        i18nManager = manager;
    };
};

OptionConfig.prototype.applyTo = function(modules) {
    var t = this;

    arrayTo(modules).forEach(function(module) {
        module.optionConfig = t;
    });
};

OptionConfig.prototype.getDigitGroupSeparatorValueById = function(id) {
    var t = this;

    var separator = t.getDigitGroupSeparatorIdMap()[id];

    return separator ? separator.value : '';
};

// dep 1

OptionConfig.prototype.prettyPrint = function(number, separator, noHtml) {
    var t = this;

    var spaceId = t.getDigitGroupSeparator('space').id,
        noneId = t.getDigitGroupSeparator('none').id,
        noneValue = t.getDigitGroupSeparator('none').value;

    separator = separator || spaceId;

    if (separator === noneId) {
        return number;
    }

    var [num, dec] = ('' + number).split('.');

    var pp =
        num.replace(
            /\B(?=(\d{3})+(?!\d))/g,
            t.getDigitGroupSeparatorValueById(separator) || noneValue
        ) + (dec ? '.' + dec : '');

    if (noHtml) {
        pp = stringReplaceAll(pp, '&nbsp;', ' ');
    }

    return pp;
};
