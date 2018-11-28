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
        gauge: 'gauge',
        yearoveryearcolumn: 'YEAR_OVER_YEAR_COLUMN',
        yearoveryearline: 'YEAR_OVER_YEAR_LINE',
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
        gauge: 'GAUGE',
        yearoveryearcolumn: 'YEAR_OVER_YEAR_COLUMN',
        yearoveryearline: 'YEAR_OVER_YEAR_LINE',
    };

    t.consts = {
        domain: 'domain_',
        targetLine: 'targetline_',
        baseLine: 'baseline_',
        trendLine: 'trendline_',
    };

    t.style = {
        inset: 30,
        fontFamily: 'Arial,Sans-serif,Roboto,Helvetica,Consolas',
    };

    t.theme = {
        dv1: [
            '#94ae0a',
            '#1d5991',
            '#a61120',
            '#ff8809',
            '#7c7474',
            '#a61187',
            '#ffd13e',
            '#24ad9a',
            '#a66111',
            '#414141',
            '#4500c4',
            '#1d5700',
        ],
    };

    // transient

    t.c2s = {};
    t.s2c = {};

    // initialize
    (function() {
        Object.keys(t.client).forEach(function(key) {
            t.c2s[t.client[key]] = t.server[key];
        });

        Object.keys(t.server).forEach(function(key) {
            t.s2c[t.server[key]] = t.client[key];
        });
    })();
};
