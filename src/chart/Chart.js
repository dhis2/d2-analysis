import arrayClean from 'd2-utilizr/lib/arrayClean';
import arrayContains from 'd2-utilizr/lib/arrayContains';
import arrayMax from 'd2-utilizr/lib/arrayMax';
import arrayMin from 'd2-utilizr/lib/arrayMin';
import arrayPluck from 'd2-utilizr/lib/arrayPluck';
import arraySort from 'd2-utilizr/lib/arraySort';
import clone from 'd2-utilizr/lib/clone';
import isArray from 'd2-utilizr/lib/isArray';
import isBoolean from 'd2-utilizr/lib/isBoolean';
import isDefined from 'd2-utilizr/lib/isDefined';
import isIE from 'd2-utilizr/lib/isIE';
import isNumber from 'd2-utilizr/lib/isNumber';
import isObject from 'd2-utilizr/lib/isObject';
import isString from 'd2-utilizr/lib/isString';
import numberConstrain from 'd2-utilizr/lib/numberConstrain';
import numberToFixed from 'd2-utilizr/lib/numberToFixed';
import objectApplyIf from 'd2-utilizr/lib/objectApplyIf';
import uuid from 'd2-utilizr/lib/uuid';

export var Chart;

Chart = function({ refs, appConfig = {}, layout, response, legendSet = {} }) {
    var t = this,
        klass = Chart;

    refs = isObject(refs) ? refs : klass;

    var appManager = refs.appManager,
        i18nManager = refs.i18nManager,
        uiManager = refs.uiManager,
        dimensionConfig = refs.dimensionConfig,
        optionConfig = refs.optionConfig,
        chartConfig = refs.chartConfig;

    var i18n = i18nManager.get(),
        viewport = uiManager.get('viewport');

    // init
    //old var columnIds = layout.columnDimensionNames[0] ? layout.dimensionNameIdsMap[layout.columnDimensionNames[0]] : [],
    var response = layout.getResponse(),
        columnIds = response.metaData[layout.columns[0].dimension],
        failSafeColumnIds = [],
        failSafeColumnIdMap = {},
        createFailSafeColumnIds = function() {
            for (var i = 0, uuId; i < columnIds.length; i++) {
                uuId = uuid();

                failSafeColumnIds.push(uuId);
                failSafeColumnIdMap[uuId] = columnIds[i];

                //old xResponse.metaData.names[uuId] = xResponse.metaData.names[columnIds[i]];
                response.metaData.names[uuId] = response.metaData.names[columnIds[i]];
            }
        }(),

        // row ids
        rowIds = response.metaData[layout.rows[0].dimension],

        // filter ids
        //filterIds = layout.filters.getRecordIds(),
        filterIds = response.getIdsByDimensionNames(arrayPluck(layout.filters, 'dimension')),

        // totals
        dataTotalKey = uuid(),
        addDataTotals = function(data, ids) {
            for (var i = 0, obj, total; i < data.length; i++) {
                obj = data[i];
                total = 0;

                for (var j = 0; j < ids.length; j++) {
                    total += parseFloat(obj[ids[j]]);
                    obj[dataTotalKey] = total;
                }
            }
        },

        getSyncronizedXLayout,
        getExtendedResponse,
        validateUrl,

        getDefaultStore,
        getDefaultNumericAxis,
        getDefaultCategoryAxis,
        getFormatedSeriesTitle,
        getDefaultSeriesTitle,
        getPieSeriesTitle,
        getDefaultSeries,
        getDefaultTrendLines,
        getDefaultTargetLine,
        getDefaultBaseLine,
        getDefaultTips,
        setDefaultTheme,
        getDefaultLegend,
        getTitleStyle,
        getFavoriteTitle,
        getDefaultChartTitle,
        getDefaultChartSizeHandler,
        getDefaultChartTitlePositionHandler,
        getDefaultChart,

        idValueMap = response.getIdValueMap(layout),
        generator = {};

    getDefaultStore = function(isStacked) {
        var data = [],
            trendLineFields = [],
            targetLineFields = [],
            baseLineFields = [],
            store;

        // data
        for (var i = 0, obj, category, rowValues, isEmpty; i < rowIds.length; i++) {
            obj = {};
            category = rowIds[i];
            rowValues = [];
            isEmpty = false;

            obj[chartConfig.consts.domain] = response.metaData.names[category];

            for (var j = 0, id, value; j < columnIds.length; j++) {
                id = columnIds[j] + '-' + rowIds[i];
                value = idValueMap[id];
                rowValues.push(value);

                obj[failSafeColumnIds[j]] = value ? parseFloat(value) : '0.0';
            }

            isEmpty = !(arrayClean(rowValues).length);

            if (!(isEmpty && layout.hideEmptyRows)) {
                data.push(obj);
            }
        }

        // stacked
        if (isStacked) {
            addDataTotals(data, failSafeColumnIds);
        }

        // sort order
        if (layout.sortOrder) {
            var valueKey = isStacked ? dataTotalKey : failSafeColumnIds[0],
                sortKey = 'sorting_' + uuid();

            // create sort key
            for (var ii = 0, rec; ii < data.length; ii++) {
                rec = data[ii];
                rec[sortKey] = rec[valueKey] === '0.0' ? null : rec[valueKey];
            }

            arraySort(data, layout.sortOrder === -1 ? 'ASC' : 'DESC', sortKey, (layout.sortOrder === -1));

            // remove sort key
            data.forEach(function(obj) {
                delete obj[sortKey];
            });
        }

        // trend lines
        if (layout.showTrendLine) {
            var regression,
                regressionKey;

            if (isStacked) {
                regression = new SimpleRegression();
                regressionKey = chartConfig.consts.trendLine + dataTotalKey;

                for (var i = 0, value; i < data.length; i++) {
                    value = data[i][dataTotalKey];
                    regression.addData(i, parseFloat(value));
                }

                for (var i = 0; i < data.length; i++) {
                    data[i][regressionKey] = parseFloat(regression.predict(i).toFixed(1));
                }

                trendLineFields.push(regressionKey);
                response.metaData.names[regressionKey] = i18n.trend + ' (Total)';
            }
            else {
                for (var i = 0; i < failSafeColumnIds.length; i++) {
                    regression = new SimpleRegression();
                    regressionKey = chartConfig.consts.trendLine + failSafeColumnIds[i];

                    for (var j = 0, value; j < data.length; j++) {
                        value = data[j][failSafeColumnIds[i]];
                        regression.addData(j, parseFloat(value));
                    }

                    for (var j = 0; j < data.length; j++) {
                        data[j][regressionKey] = parseFloat(regression.predict(j).toFixed(1));
                    }

                    trendLineFields.push(regressionKey);
                    response.metaData.names[regressionKey] = i18n.trend + (appConfig.dashboard ? '' : ' (' + response.metaData.names[failSafeColumnIds[i]] + ')');
                }
            }
        }

        // target line
        if (isNumber(layout.targetLineValue) || isNumber(parseFloat(layout.targetLineValue))) {
            for (var i = 0; i < data.length; i++) {
                data[i][chartConfig.consts.targetLine] = parseFloat(layout.targetLineValue);
            }

            targetLineFields.push(chartConfig.consts.targetLine);
        }

        // base line
        if (isNumber(layout.baseLineValue) || isNumber(parseFloat(layout.baseLineValue))) {
            for (var i = 0; i < data.length; i++) {
                data[i][chartConfig.consts.baseLine] = parseFloat(layout.baseLineValue);
            }

            baseLineFields.push(chartConfig.consts.baseLine);
        }

        store = Ext.create('Ext.data.Store', {
            fields: function() {
                var fields = clone(failSafeColumnIds);
                fields.push(chartConfig.consts.domain);
                fields = fields.concat(trendLineFields, targetLineFields, baseLineFields);

                return fields;
            }(),
            data: data
        });

        store.rangeFields = failSafeColumnIds;
        store.domainFields = [chartConfig.consts.domain];
        store.trendLineFields = trendLineFields;
        store.targetLineFields = targetLineFields;
        store.baseLineFields = baseLineFields;
        store.numericFields = [].concat(store.rangeFields, store.trendLineFields, store.targetLineFields, store.baseLineFields);

        store.getMaximum = function() {
            var maximums = [];

            for (var i = 0; i < store.numericFields.length; i++) {
                maximums.push(store.max(store.numericFields[i]));
            }

            return arrayMax(maximums);
        };

        store.getMinimum = function() {
            var minimums = [];

            for (var i = 0; i < store.numericFields.length; i++) {
                minimums.push(store.min(store.numericFields[i]));
            }

            return arrayMin(minimums);
        };

        store.getMaximumSum = function() {
            var sums = [],
                recordSum = 0;

            store.each(function(record) {
                recordSum = 0;

                for (var i = 0; i < store.rangeFields.length; i++) {
                    recordSum += record.data[store.rangeFields[i]];
                }

                sums.push(recordSum);
            });

            return arrayMax(sums);
        };

        store.hasDecimals = function() {
            var records = store.getRange();

            for (var i = 0; i < records.length; i++) {
                for (var j = 0, value; j < store.rangeFields.length; j++) {
                    value = records[i].data[store.rangeFields[j]];

                    if (isNumber(value) && (value % 1)) {
                        return true;
                    }
                }
            }

            return false;
        };

        store.getNumberOfDecimals = function() {
            var records = store.getRange(),
                values = [];

            for (var i = 0; i < records.length; i++) {
                for (var j = 0, value; j < store.rangeFields.length; j++) {
                    value = records[i].data[store.rangeFields[j]];

                    if (isNumber(value) && (value % 1)) {
                        value = value.toString();

                        values.push(value.length - value.indexOf('.') - 1);
                    }
                }
            }

            return arrayMax(values);
        };

        return store;
    };

    getDefaultNumericAxis = function(store) {
        var labelFont = 'normal 11px ' + chartConfig.style.fontFamily,
            labelColor = 'black',
            labelRotation = 0,
            titleFont = 'bold 12px ' + chartConfig.style.fontFamily,
            titleColor = 'black',

            stackedcolumn = chartConfig.client.stackedcolumn,
            stackedbar = chartConfig.client.stackedbar,
            minimum = store.getMinimum(),
            maximum,
            numberOfDecimals,
            renderer,
            axis;

        var getRenderer = function(numberOfDecimals) {
            var renderer = '0.';

            for (var i = 0; i < numberOfDecimals; i++) {
                renderer += '0';
            }

            return renderer;
        };

        // set maximum if stacked + extra line
        if ((layout.type === stackedcolumn || layout.type === stackedbar) &&
            (layout.showTrendLine || layout.targetLineValue || layout.baseLineValue)) {
            var a = [store.getMaximum(), store.getMaximumSum()];
            maximum = Math.ceil(arrayMax(a) * 1.1);
            maximum = Math.floor(maximum / 10) * 10;
        }

        // renderer
        numberOfDecimals = store.getNumberOfDecimals();
        renderer = !!numberOfDecimals && (store.getMaximum() < 20) ? getRenderer(numberOfDecimals) : '0,0';

        axis = {
            type: 'Numeric',
            position: 'left',
            fields: store.numericFields,
            minimum: minimum < 0 ? minimum : 0,
            label: {
                renderer: Ext.util.Format.numberRenderer(renderer),
                style: {},
                rotate: {}
            },
            labelTitle: {},
            grid: {
                odd: {
                    opacity: 1,
                    stroke: '#000',
                    'stroke-width': 0.03
                },
                even: {
                    opacity: 1,
                    stroke: '#000',
                    'stroke-width': 0.03
                }
            }
        };

        if (maximum) {
            axis.maximum = maximum;
        }

        if (layout.rangeAxisMaxValue) {
            axis.maximum = layout.rangeAxisMaxValue;
        }

        if (layout.rangeAxisMinValue) {
            axis.minimum = layout.rangeAxisMinValue;
        }

        if (layout.rangeAxisSteps) {
            axis.majorTickSteps = layout.rangeAxisSteps - 1;
        }

        if (layout.rangeAxisDecimals) {
            axis.label.renderer = Ext.util.Format.numberRenderer(getRenderer(layout.rangeAxisDecimals));
        }

        if (layout.rangeAxisTitle) {
            axis.title = layout.rangeAxisTitle;
        }

        // style
        if (isObject(layout.rangeAxisStyle)) {
            var style = layout.rangeAxisStyle;

            // label
            labelColor = style.labelColor || labelColor;

            if (style.labelFont) {
                labelFont = style.labelFont;
            }
            else {
                labelFont = style.labelFontWeight ? style.labelFontWeight + ' ' : 'normal ';
                labelFont += style.labelFontSize ? parseFloat(style.labelFontSize) + 'px ' : '11px ';
                labelFont +=  style.labelFontFamily ? style.labelFontFamily : chartConfig.style.fontFamily;
            }

            // rotation
            if (isNumber(parseFloat(style.labelRotation))) {
                labelRotation = 360 - parseFloat(style.labelRotation);
            }

            // title
            titleColor = style.titleColor || titleColor;

            if (style.titleFont) {
                titleFont = style.titleFont;
            }
            else {
                titleFont = style.titleFontWeight ? style.titleFontWeight + ' ' : 'bold ';
                titleFont += style.titleFontSize ? parseFloat(style.titleFontSize) + 'px ' : '12px ';
                titleFont +=  style.titleFontFamily ? style.titleFontFamily : chartConfig.style.fontFamily;
            }
        }

        axis.label.style.fill = labelColor;
        axis.label.style.font = labelFont;
        axis.label.rotate.degrees = labelRotation;

        axis.labelTitle.fill = titleColor;
        axis.labelTitle.font = titleFont;

        return axis;
    };

    getDefaultCategoryAxis = function(store) {
        var labelFont = 'normal 11px ' + chartConfig.style.fontFamily,
            labelColor = 'black',
            labelRotation = 315,
            titleFont = 'bold 12px ' + chartConfig.style.fontFamily,
            titleColor = 'black',

            axis = {
                type: 'Category',
                position: 'bottom',
                fields: store.domainFields,
                label: {
                    rotate: {},
                    style: {}
                },
                labelTitle: {}
            };

        if (layout.domainAxisTitle) {
            axis.title = layout.domainAxisTitle;
        }

        // style
        if (isObject(layout.domainAxisStyle)) {
            var style = layout.domainAxisStyle;

            // label
            labelColor = style.labelColor || labelColor;

            if (style.labelFont) {
                labelFont = style.labelFont;
            }
            else {
                labelFont = style.labelFontWeight ? style.labelFontWeight + ' ' : 'normal ';
                labelFont += style.labelFontSize ? parseFloat(style.labelFontSize) + 'px ' : '11px ';
                labelFont +=  style.labelFontFamily ? style.labelFontFamily : chartConfig.style.fontFamily;
            }

            // rotation
            if (isNumber(parseFloat(style.labelRotation))) {
                labelRotation = 360 - parseFloat(style.labelRotation);
            }

            // title
            titleColor = style.titleColor || titleColor;

            if (style.titleFont) {
                titleFont = style.titleFont;
            }
            else {
                titleFont = style.titleFontWeight ? style.titleFontWeight + ' ' : 'bold ';
                titleFont += style.titleFontSize ? parseFloat(style.titleFontSize) + 'px ' : '12px ';
                titleFont +=  style.titleFontFamily ? style.titleFontFamily : chartConfig.style.fontFamily;
            }
        }

        axis.label.style.fill = labelColor;
        axis.label.style.font = labelFont;
        axis.label.rotate.degrees = labelRotation;

        axis.labelTitle.fill = titleColor;
        axis.labelTitle.font = titleFont;

        return axis;
    };

    getFormatedSeriesTitle = function(titles) {
        var itemLength = appConfig.dashboard ? 23 : 30,
            charLength = appConfig.dashboard ? 5 : 6,
            numberOfItems = titles.length,
            numberOfChars,
            totalItemLength = numberOfItems * itemLength,
            //minLength = 5,
            maxLength = arrayMax(titles, function(max, item) {
                return item.length > max.length ? -1 : 0;
            }).length,
            fallbackLength = 10,
            maxWidth = uiManager.getWidth(),
            width,
            validateTitles;

        getValidatedTitles = function(titles, len) {
            var numberOfItems = titles.length,
                newTitles,
                fallbackTitles;

            fallbackLength = len < fallbackLength ? len : fallbackLength;

            for (var i = len, width; i > 0; i--) {
                newTitles = [];

                for (var j = 0, title, numberOfChars, newTitle; j < titles.length; j++) {
                    title = titles[j];

                    newTitles.push(title.length > i ? (title.slice(0, i) + '..') : title);
                }

                numberOfChars = newTitles.join('').length;
                width = totalItemLength + (numberOfChars * charLength);

                if (i === fallbackLength) {
                    fallbackTitles = clone(newTitles);
                }

                if (width < maxWidth) {
                    return newTitles;
                }
            }

            return fallbackTitles;
        };

        return getValidatedTitles(titles, maxLength);
    };

    getDefaultSeriesTitle = function(store) {
        var a = [],
            ls = isObject(layout.legendStyle) ? layout.legendStyle : null;

        if (ls && isArray(ls.labelNames)) {
            return ls.labelNames;
        }
        else {
            for (var i = 0, id, name, mxl, ids; i < store.rangeFields.length; i++) {
                id = failSafeColumnIdMap[store.rangeFields[i]];
                name = response.metaData.names[id];

                if (ls && ls.labelMaxLength) {
                    var mxl = parseInt(ls.labelMaxLength);

                    if (isNumber(mxl) && name.length > mxl) {
                        name = name.substr(0, mxl) + '..';
                    }
                }

                a.push(name);
            }
        }

        return appConfig.dashboard ? getFormatedSeriesTitle(a) : a;
    };

    getPieSeriesTitle = function(store) {
        var a = [],
            ls = isObject(layout.legendStyle) ? layout.legendStyle : null;

        if (ls && isArray(ls.labelNames)) {
            return ls.labelNames;
        }
        else {
            var id = store.domainFields[0],
                name;

            store.each( function(r) {
                name = r.data[id];

                if (ls && ls.labelMaxLength) {
                    var mxl = parseInt(ls.labelMaxLength);

                    if (isNumber(mxl) && name.length > mxl) {
                        name = name.substr(0, mxl) + '..';
                    }
                }

                a.push(name);
            });
        }

        return appConfig.dashboard ? getFormatedSeriesTitle(a) : a;
    };

    getDefaultSeries = function(store) {
        var main = {
            type: 'column',
            axis: 'left',
            xField: store.domainFields,
            yField: store.rangeFields,
            style: {
                opacity: 0.8,
                lineWidth: 3
            },
            markerConfig: {
                type: 'circle',
                radius: 4
            },
            tips: getDefaultTips(),
            title: getDefaultSeriesTitle(store)
        };

        if (layout.showValues) {
            var labelFont = chartConfig.style.fontFamily,
                labelColor = 'black';

            if (isObject(layout.seriesStyle)) {
                var style = layout.seriesStyle;

                // label
                labelColor = style.labelColor || labelColor;

                if (style.labelFont) {
                    labelFont = style.labelFont;
                }
                else {
                    labelFont = style.labelFontWeight ? style.labelFontWeight + ' ' : 'normal ';
                    labelFont += style.labelFontSize ? parseFloat(style.labelFontSize) + 'px ' : '11px ';
                    labelFont +=  style.labelFontFamily ? style.labelFontFamily : chartConfig.style.fontFamily;
                }
            }

            main.label = {
                display: 'outside',
                'text-anchor': 'middle',
                field: store.rangeFields,
                font: labelFont,
                fill: labelColor,
                renderer: function(n) {
                    n = n === '0.0' ? '' : n;
                    return optionConfig.prettyPrint(n, layout.digitGroupSeparator);
                }
            };
        }

        return main;
    };

    getDefaultTrendLines = function(store, isStacked) {
        var a = [];

        for (var i = 0, strokeColor; i < store.trendLineFields.length; i++) {
            strokeColor = isStacked ? '#000' : chartConfig.theme.dv1[i];

            a.push({
                type: 'line',
                axis: 'left',
                xField: store.domainFields,
                yField: store.trendLineFields[i],
                style: {
                    opacity: 0.8,
                    lineWidth: 2,
                    'stroke-dasharray': 14,
                    stroke: strokeColor
                },
                markerConfig: {
                    type: 'circle',
                    radius: 0,
                    fill: strokeColor
                },
                title: function() {
                    var title = response.metaData.names[store.trendLineFields[i]],
                        ls = layout.legendStyle;
                    return ls && isNumber(ls.labelMaxLength) ? title.substr(0, ls.labelMaxLength) + '..' : title;
                }()
            });
        }

        return a;
    };

    getDefaultTargetLine = function(store) {
        return {
            type: 'line',
            axis: 'left',
            xField: store.domainFields,
            yField: store.targetLineFields,
            style: {
                opacity: 1,
                lineWidth: 1,
                'stroke-width': 1,
                stroke: '#000'
            },
            showMarkers: false,
            title: function() {
                var title = (isString(layout.targetLineTitle) ? layout.targetLineTitle : i18n.target) + ' (' + layout.targetLineValue + ')',
                    ls = layout.legendStyle;
                return ls && isNumber(ls.labelMaxLength) ? title.substr(0, ls.labelMaxLength) + '..' : title;
            }()
        };
    };

    getDefaultBaseLine = function(store) {
        return {
            type: 'line',
            axis: 'left',
            xField: store.domainFields,
            yField: store.baseLineFields,
            style: {
                opacity: 1,
                lineWidth: 1,
                'stroke-width': 1,
                stroke: '#000'
            },
            showMarkers: false,
            title: function() {
                var title = (isString(layout.baseLineTitle) ? layout.baseLineTitle : i18n.base) + ' (' + layout.baseLineValue + ')',
                    ls = layout.legendStyle;
                return ls && isNumber(ls.labelMaxLength) ? title.substr(0, ls.labelMaxLength) + '..' : title;
            }()
        };
    };

    getDefaultTips = function() {
        return {
            trackMouse: true,
            cls: 'dv-chart-tips',
            renderer: function(si, item) {
                if (item.value) {
                    var value = item.value[1] === '0.0' ? '-' : item.value[1];
                    this.update('<div style="font-size:17px; font-weight:bold">' + optionConfig.prettyPrint(value, layout.digitGroupSeparator) + '</div><div style="font-size:10px">' + si.data[chartConfig.consts.domain] + '</div>');
                }
            }
        };
    };

    setDefaultTheme = function(store) {
        var colors = chartConfig.theme.dv1.slice(0, store.rangeFields.length);

        Ext.chart.theme.dv1 = Ext.extend(Ext.chart.theme.Base, {
            constructor: function(config) {
                Ext.chart.theme.Base.prototype.constructor.call(this, Ext.apply({
                    seriesThemes: colors,
                    colors: colors
                }, config));
            }
        });
    };

    getDefaultLegend = function(store, _chartConfig) {
        var itemLength = appConfig.dashboard ? 24 : 30,
            charLength = appConfig.dashboard ? 4 : 6,
            numberOfItems = 0,
            numberOfChars = 0,
            width,
            isVertical = false,
            labelFont = '11px ' + chartConfig.style.fontFamily,
            labelColor = 'black',
            position = 'top',
            padding = 0,
            positions = ['top', 'right', 'bottom', 'left'],
            series = _chartConfig.series,
            labelMarkerSize = layout.legendStyle && layout.legendStyle.labelMarkerSize ? layout.legendStyle.labelMarkerSize : null,
            newChartConfig;

        for (var i = 0, title; i < series.length; i++) {
            title = series[i].title;

            if (isString(title)) {
                numberOfItems += 1;
                numberOfChars += title.length;
            }
            else if (isArray(title)) {
                numberOfItems += title.length;
                numberOfChars += title.toString().split(',').join('').length;
            }
        }

        width = (numberOfItems * itemLength) + (numberOfChars * charLength);

        if (width > uiManager.getWidth() - 6) {
            position = 'right';
        }

        // style
        if (isObject(layout.legendStyle)) {
            var style = layout.legendStyle;

            labelColor = style.labelColor || labelColor;

            if (arrayContains(positions, style.position)) {
                position = style.position;
            }

            if (style.labelFont) {
                labelFont = style.labelFont;
            }
            else {
                labelFont = style.labelFontWeight ? style.labelFontWeight + ' ' : 'normal ';
                labelFont += style.labelFontSize ? parseFloat(style.labelFontSize) + 'px ' : '11px ';
                labelFont += style.labelFontFamily ? style.labelFontFamily : chartConfig.style.fontFamily;
            }
        }

        // padding
        if (position === 'right') {
            padding = 3;
        }

        // chart
        newChartConfig = {
            position: position,
            isVertical: isVertical,
            boxStroke: '#ffffff',
            boxStrokeWidth: 0,
            padding: padding,
            itemSpacing: 3,
            labelFont: labelFont,
            labelColor: labelColor,
            boxFill: 'transparent'
        };

        if (labelMarkerSize) {
            newChartConfig.labelMarkerSize = labelMarkerSize;
        }

        return Ext.create('Ext.chart.Legend', newChartConfig);
    };

    getTitleStyle = function(text, isSubtitle) {
        var fontSize = (uiManager.getWidth() / text.length) < 11.6 ? 12 : 17,
            titleFont,
            titleColor;

        titleFont = 'normal ' + fontSize + 'px ' + chartConfig.style.fontFamily;
        titleColor = 'black';

        // legend
        if (isObject(layout.legendStyle)) {
            var style = layout.legendStyle;

            titleColor = style.titleColor || titleColor;

            if (style.titleFont) {
                titleFont = style.titleFont;
            }
            else {
                titleFont = style.titleFontWeight ? style.titleFontWeight + ' ' : 'normal ';
                titleFont += style.titleFontSize ? parseFloat(style.titleFontSize) + 'px ' : (fontSize + 'px ');
                titleFont +=  style.titleFontFamily ? style.titleFontFamily : chartConfig.style.fontFamily;
            }
        }

        //TODO
        if (isSubtitle) {
            titleFont = titleFont.replace('bold', 'normal');
        }

        return {
            font: titleFont,
            fill: titleColor
        };
    };

    getFavoriteTitle = function() {
        return appConfig.dashboard && layout.name ? Ext.create('Ext.draw.Sprite', Ext.apply({
            type: 'text',
            text: layout.name,
            y: 7
        }, getTitleStyle(layout.name))) : null;
    };

    getDefaultChartTitle = function(store) {
        var ids = [],
            text = '',
            titleFont,
            titleColor,
            isPie = layout.type === chartConfig.client.pie,
            isGauge = layout.type === chartConfig.client.gauge;

        if (isPie) {
            ids.push(columnIds[0]);
        }
        else if (isGauge) {
            ids.push(columnIds[0], rowIds[0]);
        }

        ids = arrayClean(ids.concat(filterIds || []));

        if (isArray(ids) && ids.length) {
            for (var i = 0; i < ids.length; i++) {
                text += response.metaData.names[ids[i]];
                text += i < ids.length - 1 ? ', ' : '';
            }
        }

        if (layout.title) {
            text = layout.title;
        }

        return Ext.create('Ext.draw.Sprite', Ext.apply({
            type: 'text',
            text: text,
            height: 14,
            y: appConfig.dashboard ? 24 : 20
        }, getTitleStyle((appConfig.dashboard ? layout.name : text), true)));
    };

    getDefaultChartSizeHandler = function() {
        return function() {
            var width = uiManager.getWidth(),
                height = uiManager.getHeight();

            this.animate = false;
            this.setWidth(appConfig.dashboard ? width : width - 15);
            this.setHeight(appConfig.dashboard ? height : height - 40);
            this.animate = !appConfig.dashboard;
        };
    };

    getDefaultChartTitlePositionHandler = function() {
        return function() {
            if (this.items) {
                for (var i = 0, title, titleWidth, titleXFallback, legend, legendCenterX, titleX; i < this.items.length; i++) {
                    title = this.items[i];
                    titleWidth = isIE ? title.el.dom.scrollWidth : title.el.getWidth();
                    titleXFallback = 10;
                    legend = this.legend;
                    legendCenterX;
                    titleX;

                    if (this.legend.position === 'top') {
                        legendCenterX = legend.x + (legend.width / 2);
                        titleX = titleWidth ? legendCenterX - (titleWidth / 2) : titleXFallback;
                    }
                    else {
                        var legendWidth = legend ? legend.width : 0;
                        titleX = titleWidth ? (this.width / 2) - (titleWidth / 2) : titleXFallback;
                    }

                    title.setAttributes({
                        x: titleX
                    }, true);
                }
            }
        };
    };

    getDefaultChart = function(config) {
        var chart,
            store = config.store || {},
            width = uiManager.getWidth(),
            height = uiManager.getHeight(),
            isLineBased = arrayContains(['LINE', 'AREA'], layout.type),
            defaultConfig = {
                //animate: true,
                animate: false,
                shadow: false,
                insetPadding: 35,
                insetPaddingObject: {
                    top: appConfig.dashboard ? 20 : 32,
                    right: appConfig.dashboard ? (isLineBased ? 5 : 3) : (isLineBased ? 25 : 15),
                    bottom: appConfig.dashboard ? 2 : 10,
                    left: appConfig.dashboard ? (isLineBased ? 15 : 7) : (isLineBased ? 70 : 50)
                },
                width: appConfig.dashboard ? width : width - 15,
                height: appConfig.dashboard ? height : height - 40,
                theme: 'dv1'
            };

        // legend
        if (!layout.hideLegend) {
            defaultConfig.legend = getDefaultLegend(store, config);

            if (defaultConfig.legend.position === 'right') {
                defaultConfig.insetPaddingObject.top = appConfig.dashboard ? 22 : 40;
                defaultConfig.insetPaddingObject.right = appConfig.dashboard ? 5 : 40;
            }
        }

        // title
        if (layout.hideTitle) {
            defaultConfig.insetPadding = appConfig.dashboard ? 1 : 10;
            defaultConfig.insetPaddingObject.top = appConfig.dashboard ? 3 : 10;
        }
        else {
            defaultConfig.items = arrayClean([getFavoriteTitle(), getDefaultChartTitle(store)]);
        }

        Ext.apply(defaultConfig, config);

        // chart
        chart = Ext.create('Ext.chart.Chart', defaultConfig);

        chart.setChartSize = getDefaultChartSizeHandler();
        chart.setTitlePosition = getDefaultChartTitlePositionHandler();

        chart.onViewportResize = function() {
            chart.setChartSize();
            chart.redraw();
            chart.setTitlePosition();
        };

        chart.on('resize', function() {
            chart.setTitlePosition();
        });

        return chart;
    };

    generator.column = function(isStacked) {
        var store = getDefaultStore(isStacked),
            numericAxis = getDefaultNumericAxis(store),
            categoryAxis = getDefaultCategoryAxis(store),
            axes = [numericAxis, categoryAxis],
            series = [getDefaultSeries(store)];

        // options
        if (layout.showTrendLine) {
            series = series.concat(getDefaultTrendLines(store, isStacked));
        }

        if (layout.targetLineValue) {
            series.push(getDefaultTargetLine(store));
        }

        if (layout.baseLineValue) {
            series.push(getDefaultBaseLine(store));
        }

        // theme
        setDefaultTheme(store, isStacked);

        return getDefaultChart({
            store: store,
            axes: axes,
            series: series
        });
    };

    generator.stackedcolumn = function() {
        var chart = this.column(true);

        for (var i = 0, item; i < chart.series.items.length; i++) {
            item = chart.series.items[i];

            if (item.type === chartConfig.client.column) {
                item.stacked = true;
            }
        }

        return chart;
    };

    generator.bar = function(isStacked) {
        var store = getDefaultStore(isStacked),
            numericAxis = getDefaultNumericAxis(store),
            categoryAxis = getDefaultCategoryAxis(store),
            axes,
            series = getDefaultSeries(store),
            trendLines,
            targetLine,
            baseLine,
            chart;

        // Axes
        numericAxis.position = 'bottom';
        categoryAxis.position = 'left';
        categoryAxis.label.rotate.degrees = 360;
        axes = [numericAxis, categoryAxis];

        // Series
        series.type = 'bar';
        series.axis = 'bottom';

        // Options
        if (layout.showValues) {
            series.label = {
                display: 'outside',
                'text-anchor': 'middle',
                field: store.rangeFields
            };
        }

        series = [series];

        if (layout.showTrendLine) {
            trendLines = getDefaultTrendLines(store, isStacked);

            for (var i = 0; i < trendLines.length; i++) {
                trendLines[i].axis = 'bottom';
                trendLines[i].xField = store.trendLineFields[i];
                trendLines[i].yField = store.domainFields;
            }

            series = series.concat(trendLines);
        }

        if (layout.targetLineValue) {
            targetLine = getDefaultTargetLine(store);
            targetLine.axis = 'bottom';
            targetLine.xField = store.targetLineFields;
            targetLine.yField = store.domainFields;

            series.push(targetLine);
        }

        if (layout.baseLineValue) {
            baseLine = getDefaultBaseLine(store);
            baseLine.axis = 'bottom';
            baseLine.xField = store.baseLineFields;
            baseLine.yField = store.domainFields;

            series.push(baseLine);
        }

        // Theme
        setDefaultTheme(store);

        return getDefaultChart({
            store: store,
            axes: axes,
            series: series
        });
    };

    generator.stackedbar = function() {
        var chart = this.bar(true);

        for (var i = 0, item; i < chart.series.items.length; i++) {
            item = chart.series.items[i];

            if (item.type === chartConfig.client.bar) {
                item.stacked = true;
            }
        }

        return chart;
    };

    generator.line = function() {
        var store = getDefaultStore(),
            numericAxis = getDefaultNumericAxis(store),
            categoryAxis = getDefaultCategoryAxis(store),
            axes = [numericAxis, categoryAxis],
            series = [],
            colors = chartConfig.theme.dv1.slice(0, store.rangeFields.length),
            seriesTitles = getDefaultSeriesTitle(store);

        // Series
        for (var i = 0, line; i < store.rangeFields.length; i++) {
            line = {
                type: 'line',
                axis: 'left',
                xField: store.domainFields,
                yField: store.rangeFields[i],
                style: {
                    opacity: 0.8,
                    lineWidth: 3
                },
                markerConfig: {
                    type: 'circle',
                    radius: appConfig.dashboard ? 3 : 4
                },
                tips: getDefaultTips(),
                title: seriesTitles[i]
            };

            //if (layout.showValues) {
                //line.label = {
                    //display: 'over',
                    //field: store.rangeFields[i]
                //};
            //}

            series.push(line);
        }

        // options, theme colors
        if (layout.showTrendLine) {
            series = getDefaultTrendLines(store).concat(series);

            colors = colors.concat(colors);
        }

        if (layout.targetLineValue) {
            series.push(getDefaultTargetLine(store));

            colors.push('#051a2e');
        }

        if (layout.baseLineValue) {
            series.push(getDefaultBaseLine(store));

            colors.push('#051a2e');
        }

        // theme
        Ext.chart.theme.dv1 = Ext.extend(Ext.chart.theme.Base, {
            constructor: function(config) {
                Ext.chart.theme.Base.prototype.constructor.call(this, Ext.apply({
                    seriesThemes: colors,
                    colors: colors
                }, config));
            }
        });

        return getDefaultChart({
            store: store,
            axes: axes,
            series: series
        });
    };

    generator.area = function() {

        // NB, always true for area charts as extjs area charts cannot handle nulls
        layout.hideEmptyRows = true;

        var store = getDefaultStore(true),
            numericAxis = getDefaultNumericAxis(store),
            categoryAxis = getDefaultCategoryAxis(store),
            axes = [numericAxis, categoryAxis],
            series = getDefaultSeries(store);

        series.type = 'area';
        series.style.opacity = 0.7;
        series.style.lineWidth = 0;
        delete series.label;
        delete series.tips;
        series = [series];

        // Options
        if (layout.showTrendLine) {
            series = series.concat(getDefaultTrendLines(store, true));
        }

        if (layout.targetLineValue) {
            series.push(getDefaultTargetLine(store));
        }

        if (layout.baseLineValue) {
            series.push(getDefaultBaseLine(store));
        }

        // Theme
        setDefaultTheme(store);

        return getDefaultChart({
            store: store,
            axes: axes,
            series: series
        });
    };

    generator.pie = function() {
        var store = getDefaultStore(),
            series,
            colors,
            chart,
            label = {
                field: chartConfig.consts.domain
            };

        // label
        if (layout.showValues) {
            var labelFont = chartConfig.style.fontFamily,
                labelColor;

            if (isObject(layout.seriesStyle)) {
                var style = layout.seriesStyle;

                // color
                labelColor = style.labelColor || labelColor;

                if (style.labelFont) {
                    labelFont = style.labelFont;
                }
                else {
                    labelFont = style.labelFontWeight ? style.labelFontWeight + ' ' : 'normal ';
                    labelFont += style.labelFontSize ? parseFloat(style.labelFontSize) + 'px ' : '11px ';
                    labelFont +=  style.labelFontFamily ? style.labelFontFamily : chartConfig.style.fontFamily;
                }
            }

            label.display = 'middle';
            label.contrast = !labelColor;
            label.font = labelFont;
            label.fill = labelColor;
            label.renderer = function(value) {
                var record = store.getAt(store.findExact(chartConfig.consts.domain, value)),
                    v = record.data[store.rangeFields[0]];

                return optionConfig.prettyPrint(v, layout.digitGroupSeparator);
            };
        }

        // series
        series = [{
            type: 'pie',
            field: store.rangeFields[0],
            donut: 5,
            showInLegend: true,
            highlight: {
                segment: {
                    margin: 5
                }
            },
            label: label,
            style: {
                opacity: 0.8,
                stroke: '#555'
            },
            tips: {
                trackMouse: true,
                cls: 'dv-chart-tips',
                renderer: function(item) {
                    var value = item.data[store.rangeFields[0]],
                        data = item.data[chartConfig.consts.domain];

                    var ppValue = optionConfig.prettyPrint(value, layout.digitGroupSeparator);

                    this.update('<div style="text-align:center"><div style="font-size:17px; font-weight:bold">' + ppValue + '</div><div style="font-size:10px">' + data + '</div></div>');
                }
            },
            shadowAttributes: false,
            title: getPieSeriesTitle(store)
        }];

        // theme
        colors = chartConfig.theme.dv1.slice(0, response.getHeaderByName(layout.rowDimensionNames[0]).ids.length);

        Ext.chart.theme.dv1 = Ext.extend(Ext.chart.theme.Base, {
            constructor: function(config) {
                Ext.chart.theme.Base.prototype.constructor.call(this, Ext.apply({
                    seriesThemes: colors,
                    colors: colors
                }, config));
            }
        });

        // chart
        chart = getDefaultChart({
            store: store,
            series: series,
            insetPaddingObject: {
                top: appConfig.dashboard ? 25 : 40,
                right: appConfig.dashboard ? 2 : 30,
                bottom: appConfig.dashboard ? 13: 30,
                left: appConfig.dashboard ? 7 : 30
            }
        });

        return chart;
    };

    generator.radar = function() {
        var store = getDefaultStore(),
            axes = [],
            series = [],
            seriesTitles = getDefaultSeriesTitle(store),
            labelFont = 'normal 9px sans-serif',
            labelColor = '#333',
            chart;

        // axes
        axes.push({
            type: 'Radial',
            position: 'radial',
            label: {
                display: true
            }
        });

        // series
        for (var i = 0, obj; i < store.rangeFields.length; i++) {
            obj = {
                showInLegend: true,
                type: 'radar',
                xField: store.domainFields,
                yField: store.rangeFields[i],
                style: {
                    opacity: 0.5
                },
                tips: getDefaultTips(),
                title: seriesTitles[i]
            };

            if (layout.showValues) {
                obj.label = {
                    display: 'over',
                    field: store.rangeFields[i]
                };
            }

            series.push(obj);
        }

        // style
        if (isObject(layout.seriesStyle)) {
            var style = layout.seriesStyle;

            // label
            labelColor = style.labelColor || labelColor;

            if (style.labelFont) {
                labelFont = style.labelFont;
            }
            else {
                labelFont = style.labelFontWeight ? style.labelFontWeight + ' ' : 'normal ';
                labelFont += style.labelFontSize ? parseFloat(style.labelFontSize) + 'px ' : '9px ';
                labelFont +=  style.labelFontFamily ? style.labelFontFamily : chartConfig.style.fontFamily;
            }
        }

        // chart
        chart = getDefaultChart({
            store: store,
            axes: axes,
            series: series,
            theme: 'Category2',
            insetPaddingObject: {
                top: 30,
                right: appConfig.dashboard ? 2 : 60,
                bottom: 20,
                left: appConfig.dashboard ? 80 : 7
            },
            seriesStyle: {
                labelColor: labelColor,
                labelFont: labelFont
            }
        });

        return chart;
    };

    generator.gauge = function() {
        var valueColor = '#aaa',
            store,
            axis,
            series,
            legend,
            config,
            chart;

        // overwrite items
        columnIds = [columnIds[0]];
        failSafeColumnIds = [failSafeColumnIds[0]];
        rowIds = [rowIds[0]];

        // store
        store = getDefaultStore();

        // axis
        axis = {
            type: 'gauge',
            position: 'gauge',
            minimum: 0,
            maximum: 100,
            steps: 10,
            margin: -7
        };

        // series, legendset
        if (legendSet) {
            valueColor = service.legend.getColorByValue(legendSet, store.getRange()[0].data[failSafeColumnIds[0]]) || valueColor;
        }

        series = {
            type: 'gauge',
            field: store.rangeFields[0],
            //donut: 5,
            colorSet: [valueColor, '#ddd']
        };

        chart = getDefaultChart({
            axes: [axis],
            series: [series],
            width: uiManager.getWidth(),
            height: uiManager.getHeight() * 0.6,
            store: store,
            insetPadding: appConfig.dashboard ? 50 : 100,
            theme: null,
            //animate: {
                //easing: 'elasticIn',
                //duration: 1000
            //}
            animate: false
        });

        if (layout.showValues) {
            chart.items.push(Ext.create('Ext.draw.Sprite', {
                type: 'text',
                text: store.getRange()[0].data[failSafeColumnIds[0]],
                font: 'normal 26px ' + chartConfig.style.fontFamily,
                fill: '#111',
                height: 40,
                y:  60
            }));
        }

        chart.setChartSize = function() {
            //this.animate = false;
            this.setWidth(uiManager.getWidth());
            this.setHeight(uiManager.getHeight() * 0.6);
            //this.animate = true;
        };

        chart.setTitlePosition = function() {
            if (this.items) {
                for (var i = 0, item, itemWidth, itemX, itemXFallback = 10; i < this.items.length; i++) {
                    item = this.items[i];

                    if (item) {
                        itemWidth = isIE ? item.el.dom.scrollWidth : item.el.getWidth();
                        itemX = itemWidth ? (uiManager.getWidth() / 2) - (itemWidth / 2) : itemXFallback;

                        item.setAttributes({
                            x: itemX
                        }, true);
                    }
                }
            }
        };

        return chart;
    };

    return generator[layout.type]();
};
