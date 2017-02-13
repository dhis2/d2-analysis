import arrayTo from 'd2-utilizr/lib/arrayTo';

export var PeriodConfig;

PeriodConfig = function() {
    var t = this;

    // service
    var i18nManager;

    // uninitialized
    var periodTypes;

    // setter
    var setPeriodTypes = function() {
        periodTypes = {
            'Daily': i18nManager.get('daily') || 'Daily',
            'Weekly': i18nManager.get('weekly') || 'Weekly',
            'Monthly': i18nManager.get('monthly') || 'Monthly',
            'BiMonthly': i18nManager.get('bimonthly') || 'BiMonthly',
            'Quarterly': i18nManager.get('quarterly') || 'Quarterly',
            'SixMonthly': i18nManager.get('sixmonthly') || 'SixMonthly',
            'SixMonthlyApril': i18nManager.get('sixmonthly_april') || 'SixMonthly April',
            'Yearly': i18nManager.get('yearly') || 'Yearly',
            'FinancialOct': i18nManager.get('financial_oct') || 'Financial October',
            'FinancialJuly': i18nManager.get('financial_july') || 'Financial July',
            'FinancialApril': i18nManager.get('financial_april') || 'Financial April'
        };
    };

    // init
    t.init = function() {
        setPeriodTypes();
    };

    // prototype
    t.getPeriodTypeRecords = function() {
        var records = [];

        for (var type in periodTypes) {
            if (periodTypes.hasOwnProperty(type)) {
                records.push({
                    id: type,
                    name: periodTypes[type]
                });
            }
        }

        return records;
    };

    t.setI18nManager = function(manager) {
        i18nManager = manager;
    };
};

PeriodConfig.prototype.applyTo = function(modules) {
    var t = this;

    arrayTo(modules).forEach(function(module) {
        module.periodConfig = t;
    });
};
