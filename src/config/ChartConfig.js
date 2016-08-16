export var ChartConfig;

ChartConfig = function() {
    var t = this;

    t.client = {
        series: 'series',
        category: 'category',
        filter: 'filter',
        column: 'column',
        stackedcolumn: 'stackedcolumn',
        bar: 'bar',
        stackedbar: 'stackedbar',
        line: 'line',
        area: 'area',
        pie: 'pie',
        radar: 'radar',
        gauge: 'gauge'
    };

    t.server = {
        column: 'COLUMN',
        stackedcolumn: 'STACKED_COLUMN',
        bar: 'BAR',
        stackedbar: 'STACKED_BAR',
        line: 'LINE',
        area: 'AREA',
        pie: 'PIE',
        radar: 'RADAR',
        gauge: 'GAUGE'
    };

    // transient

    t.c2s = {};
    t.s2c = {};

    // initialize
    (function() {
        Object.keys(t.client).forEach(function(key) {
            t.c2s[t.client[key]] = t.server[key];
        });

        Object.keys(t.server).forEach(function(key) {
            t.s2c[t.server[key]] = t.client[key];
        });
    }());
};
