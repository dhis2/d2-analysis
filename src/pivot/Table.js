import isString from 'd2-utilizr/lib/isString';
import isNumber from 'd2-utilizr/lib/isNumber';
import isArray from 'd2-utilizr/lib/isArray';
import isObject from 'd2-utilizr/lib/isObject';
import isBoolean from 'd2-utilizr/lib/isBoolean';
import isDefined from 'd2-utilizr/lib/isDefined';
import numberToFixed from 'd2-utilizr/lib/numberToFixed';
import numberConstrain from 'd2-utilizr/lib/numberConstrain';
import objectApplyIf from 'd2-utilizr/lib/objectApplyIf';
import arrayPluck from 'd2-utilizr/lib/arrayPluck';
import arrayContains from 'd2-utilizr/lib/arrayContains';
import arrayClean from 'd2-utilizr/lib/arrayClean';
import uuid from 'd2-utilizr/lib/uuid';

import {ResponseRowIdCombination} from '../api/ResponseRowIdCombination';

export var Table;

Table = function(layout, response, colAxis, rowAxis, options) {
    var t = this,
        klass = Table,

        appManager = klass.appManager,
        uiManager = klass.uiManager,
        dimensionConfig = klass.dimensionConfig,
        optionConfig = klass.optionConfig;

    options = options || {};

    // init
    var getRoundedHtmlValue,
        getTdHtml,
        getValue,
        roundIf,
        getNumberOfDecimals,
        doColTotals,
        doRowTotals,
        doColSubTotals,
        doRowSubTotals,
        doColPercentage,
        doRowPercentage,
        doHideEmptyRows,
        doHideEmptyColumns,
        doSortableColumnHeaders,
        getColAxisHtmlArray,
        getRowHtmlArray,
        rowAxisHtmlArray,
        getColTotalHtmlArray,
        getGrandTotalHtmlArray,
        getTotalHtmlArray,
        getTopBarSpan,
        getFilterHtmlArray,
        getTitle,
        getHtml,
        recursiveReduce,
        colAxisAllObjects = [],
        rowAxisAllObjects = [],
        columnDimensionNames,
        rowDimensionNames,
        getEmptyNameTdConfig,
        getEmptyHtmlArray,


        createSubTotalCell,
        createTotalCell,
        createSubDimCell,
        createGrandTotalCell,
        createEmptyCell,
        testTable = { rows: [], columns: [], total: 0 },
        allRows = [],

        getUniqueFactor,
        colUniqueFactor,
        rowUniqueFactor,
        valueItems = [],
        valueObjects = [],
        totalColObjects = [],
        uuidDimUuidsMap = {},
        legendSet = isObject(layout.legendSet) ? appManager.getLegendSetById(layout.legendSet.id) : null,
        legendDisplayStyle = layout.legendDisplayStyle,
        tdCount = 0,
        htmlArray,
        dimensionNameMap = dimensionConfig.getDimensionNameMap(),
        objectNameMap = dimensionConfig.getObjectNameMap(),
        idValueMap = response.getIdValueMap(layout),
        sortableIdObjects = []; //todo

    getUniqueFactor = function(xAxis) {
        var unique;

        if (!xAxis.xItems) {
            return null;
        }

        unique = xAxis.xItems.unique;

        if (unique) {
            return unique.length < 2 ? 1 : (xAxis.size / unique[0].length);
        }

        return null;
    };

    colUniqueFactor = getUniqueFactor(colAxis);
    rowUniqueFactor = getUniqueFactor(rowAxis);
    columnDimensionNames = colAxis.type ? layout.columns.getDimensionNames(response) : [];
    rowDimensionNames = rowAxis.type ? layout.rows.getDimensionNames(response) : [];

    getRoundedHtmlValue = function(value, dec) {
        dec = dec || 2;
        return parseFloat(roundIf(value, 2)).toString();
    };

    getEmptyNameTdConfig = function(config) {
        config = config || {};

        return getTdHtml({
            cls: config.cls ? ' ' + config.cls : 'pivot-empty',
            colSpan: config.colSpan ? config.colSpan : 1,
            rowSpan: config.rowSpan ? config.rowSpan : 1,
            htmlValue: config.htmlValue ? config.htmlValue : '&nbsp;'
        });
    };

    getEmptyHtmlArray = function(i) {
        var html = [],
            isIntersectionCell = i < colAxis.dims - 1;


        if (rowAxis.type && rowAxis.dims) {
            for (var j = 0; j < rowAxis.dims - 1; j++) {
                html.push(createEmptyCell('pivot-dim-label', isIntersectionCell ? response.getNameById(rowDimensionNames[j]) : ''));
            }
        }
        var cellValue = isIntersectionCell ? response.getNameById(columnDimensionNames[i]) :
                response.getNameById(rowDimensionNames[j]) + 
                (colAxis.type && rowAxis.type ? '&nbsp;/&nbsp;' : '') + 
                response.getNameById(columnDimensionNames[i]);

        html.push(createEmptyCell('pivot-dim-label', cellValue));

        return html;
    };

    getTdHtml = function(config, metaDataId) {
        var bgColor,
            legends,
            colSpan,
            rowSpan,
            htmlValue,
            displayDensity,
            fontSize,
            isNumeric = isObject(config) && isString(config.type) && config.type.substr(0,5) === 'value' && !config.empty,
            isValue = isNumeric && config.type === 'value',
            cls = '',
            html = '',
            getHtmlValue;

        getHtmlValue = function(config) {
            var str = config.htmlValue,
                n = parseFloat(config.htmlValue);

            if (config.collapsed) {
                return '';
            }

            if (isValue) {
                if (isBoolean(str)) {
                    return str;
                }

                //if (!isNumber(n) || n != str || new Date(str).toString() !== 'Invalid Date') {
                if (!isNumber(n) || n != str) {
                    return str;
                }

                return n;
            }

            return str || '';
        }

        if (!isObject(config)) {
            return '';
        }

        if (config.hidden || config.collapsed) {
            return '';
        }

        // number of cells
        tdCount = tdCount + 1;

        // background color from legend set
        if (isValue && legendSet) {
            var value = parseFloat(config.value);
            legends = legendSet.legends;

            for (var i = 0; i < legends.length; i++) {
                if (numberConstrain(value, legends[i].startValue, legends[i].endValue) === value) {
                    bgColor = legends[i].color;
                }
            }
        }

        colSpan = config.colSpan ? 'colspan="' + config.colSpan + '" ' : '';
        rowSpan = config.rowSpan ? 'rowspan="' + config.rowSpan + '" ' : '';
        htmlValue = getHtmlValue(config);
        htmlValue = !arrayContains(['dimension', 'filter'], config.type) ? optionConfig.prettyPrint(htmlValue, layout.digitGroupSeparator) : htmlValue;

        cls += config.hidden ? ' td-hidden' : '';
        cls += config.collapsed ? ' td-collapsed' : '';
        cls += isValue ? ' pointer' : '';
        //cls += bgColor ? ' legend' : (config.cls ? ' ' + config.cls : '');
        cls += config.cls ? ' ' + config.cls : '';

        // if sorting
        if (isString(metaDataId)) {
            cls += ' td-sortable';

            sortableIdObjects.push({
                id: metaDataId,
                uuid: config.uuid
            });
        }

        html += '<td ' + (config.uuid ? ('id="' + config.uuid + '" ') : '');
        html += ' class="' + cls + '" ' + colSpan + rowSpan;
        html += config.title ? ' title="' + config.title + '" ' : '';

        //if (bgColor && isValue) {
            //html += 'style="color:' + bgColor + ';padding:' + displayDensity + '; font-size:' + fontSize + ';"' + '>' + htmlValue + '</td>';
            //html += '>';
            //html += '<div class="legendCt">';
            //html += '<div class="number ' + config.cls + '" style="padding:' + displayDensity + '; padding-right:3px; font-size:' + fontSize + '">' + htmlValue + '</div>';
            //html += '<div class="arrowCt ' + config.cls + '">';
            //html += '<div class="arrow" style="border-bottom:8px solid transparent; border-right:8px solid ' + bgColor + '">&nbsp;</div>';
            //html += '</div></div></div></td>';
        //}
        //else {
        //    html += 'style="' + (bgColor && isValue ? 'color:' + bgColor + '; ' : '') + '">' + htmlValue + '</td>';
        //}

        if (legendDisplayStyle === optionConfig.getLegendDisplayStyle('fill').id) {
            if(bgColor) {
                var rgb = uiManager.hexToRgb(bgColor),
                    color = uiManager.isColorBright(rgb) ? 'black' : 'white';

                html += 'style="' + (bgColor && isValue ? 'background-color:' + bgColor + '; color: ' + color + '; '  : '') + '">' + htmlValue + '</td>';
            } else {
                html += 'style="' + (bgColor && isValue ? 'background-color:' + bgColor + '; ' : '') + '">' + htmlValue + '</td>';
            }
        }

        if (legendDisplayStyle === optionConfig.getLegendDisplayStyle('text').id) {
            html += 'style="' + (bgColor && isValue ? 'color:' + bgColor + '; ' : '') + '">' + htmlValue + '</td>';
        }

        return html;
    };

    var addColumn = function(position, total, empty) {
        if(!testTable.columns[position]) {
            testTable.columns.push({ values: [], total: 0, empty: 0 });
        }
        testTable.columns[position].total += total;
        testTable.columns[position].isEmpty = empty;
    }

    getValue = function(str) {
        var n = parseFloat(str);

        if (isBoolean(str)) {
            return 1;
        }

        // return string if
        // - parsefloat(string) is not a number
        // - string is just starting with a number
        // - string is a valid date
        // if (!isNumber(n) || n != str || new Date(str).toString() !== 'Invalid Date') {
        if (!isNumber(n) || n != str) {
            return 0;
        }

        return n;
    };

    roundIf = function(number, precision) {
        number = parseFloat(number);
        precision = parseFloat(precision);

        if (isNumber(number) && isNumber(precision)) {
            var numberOfDecimals = getNumberOfDecimals(number);
            return numberOfDecimals > precision ? numberToFixed(number, precision) : number;
        }

        return number;
    };

    getNumberOfDecimals = function(number) {
        var str = new String(number);
        return (str.indexOf('.') > -1) ? (str.length - str.indexOf('.') - 1) : 0;
    };

    doColTotals = function() {
        return !!layout.showColTotals;
    };

    doRowTotals = function() {
        return !!layout.showRowTotals;
    };

    doColSubTotals = function() {
        return !!layout.showColSubTotals && rowAxis.type && rowAxis.dims > 1;
    };

    doColPercentage = function() {
        return layout.displayType === 'PERCENTCOLUMN';
    };

    doRowPercentage = function() {
        return layout.displayType === 'PERCENTROW';
    };

    doRowSubTotals = function() {
        return !!layout.showRowSubTotals && colAxis.type && colAxis.dims > 1;
    };

    doSortableColumnHeaders = function() {
        return (rowAxis.type && rowAxis.dims === 1);
    };

    doSortableColumnHeaders = function() {
        return (rowAxis.type && rowAxis.dims === 1);
    };

    doHideEmptyRows = function() {
        return layout.hideEmptyRows && colAxis.type && rowAxis.type;
    };

    doHideEmptyColumns = function() {
        return layout.hideEmptyColumns && colAxis.type && rowAxis.type;
    };

        createSubTotalCell = function(value, empty, collapsed = false) {
        return {
            type: 'valueSubtotal',
            cls: 'pivot-value-subtotal' + (empty ? ' cursor-default' : ''),
            htmlValue: empty ? '&nbsp;' : getRoundedHtmlValue(value),
            collapsed,
            empty,
            value,
        };
    };

    createTotalCell = function(value, empty, collapsed = false) {
        return {
            type: 'valueTotalSubgrandtotal',
            cls: 'pivot-value-total-subgrandtotal' + (empty ? ' cursor-default' : ''),
            htmlValue: empty ? '&nbsp;' : getRoundedHtmlValue(value),
            collapsed,
            empty,
            value,
        };
    };

    createSubDimCell = function (htmlValue = '', collapsed = false, colSpan = 1, rowSpan = 1, hidden = false) {
        return {
            type: 'dimensionSubtotal',
            cls: 'pivot-dim-subtotal cursor-default',
            collapsed,
            colSpan,
            hidden,
            rowSpan,
            htmlValue,
        };
    };

    createGrandTotalCell = function (colSpan) {
        return {
            type: 'dimensionSubtotal',
            cls: 'pivot-dim-total',
            htmlValue: 'Total',
            colSpan,
        };
    };

    createEmptyCell = function (cls='pivot-empty', htmlValue='&nbsp;', colSpan = 1, rowSpan = 1)  {
        return {
            type: 'empty',
            cls,
            colSpan,
            htmlValue,
            rowSpan,
        };
    };

    recursiveReduce = function(obj) {
        if (!obj.children) {
            obj.collapsed = true;

            if (obj.parent) {
                obj.parent.oldestSibling.children--;
            }
        }

        if (obj.parent) {
            recursiveReduce(obj.parent.oldestSibling);
        }
    };

    var getColDimHtmlArray = function() {

        var html = [];

        for (var i = 0, dimHtml; i < colAxisAllObjects.length; i++) {
            dimHtml = [];

            for (var j = 0, obj, condoId; j < colAxisAllObjects[i].length; j++) {
                switch(colAxisAllObjects[i][j].type) {
                    case "dimension": {
                        if (i === colAxis.dims - 1 && doSortableColumnHeaders()) {
                            condoId = colAxis.ids[j];
                        }
                        dimHtml.push(getTdHtml(colAxisAllObjects[i][j], condoId));
                    } break;

                    case "dimensionSubtotal": {
                        dimHtml.push(getTdHtml(colAxisAllObjects[i][j]));
                    } break;

                    case "dimensionTotal": {
                        dimHtml.push(getTdHtml(colAxisAllObjects[i][j], doSortableColumnHeaders() ? 'total' : null));
                    } break;

                    case "empty": {
                        dimHtml.push(getTdHtml(colAxisAllObjects[i][j]));
                    } break;

                    default: {
                        dimHtml.push('');
                    } break;
                }
            }

            html.push(dimHtml);
        }
        return html;
    }

    getColAxisHtmlArray = function() {
        var a = [];

        if (!colAxis.type) {

            // show row dimension labels
            if (rowAxis.type && layout.showDimensionLabels) {
                var dimLabelHtml = [];

                // labels from row object names
                for (var i = 0; i < rowDimensionNames.length; i++) {
                    dimLabelHtml.push(getEmptyNameTdConfig({
                        cls: 'pivot-dim-label',
                        htmlValue: response.getNameById(rowDimensionNames[i])
                    }));
                }

                // pivot-transparent-column unnecessary

                a.push(dimLabelHtml);
            }
            return a;
        }

        // for each col dimension
        for (var i = 0; i < colAxis.dims; i++) {
            colAxisAllObjects.push([]);

            if (layout.showDimensionLabels) {
                colAxisAllObjects[i] = colAxisAllObjects[i].concat(getEmptyHtmlArray(i))
                console.log(colAxisAllObjects)
            }
            
            else if (i === 0 && colAxis.type && rowAxis.type) {
                colAxisAllObjects[i].push(createEmptyCell('pivot-empty', '&nbsp;', rowAxis.dims, colAxis.dims))
            }

            for (var j = 0, obj, spanCount = 0; j < colAxis.size; j++) {
                spanCount++;

                obj = colAxis.objects.all[i][j];
                obj.type = 'dimension';
                obj.cls = 'pivot-dim';
                obj.noBreak = false;
                obj.hidden = !(obj.rowSpan || obj.colSpan);
                obj.htmlValue = response.getItemName(obj.id, layout.showHierarchy, true);

                colAxisAllObjects[i].push(obj);

                if (i === 0 && spanCount === colAxis.span[i] && doRowSubTotals() ) {                    
                    colAxisAllObjects[i].push(createSubDimCell('&nbsp;', false, 1, colAxis.dims));
                    spanCount = 0;
                }

                if (i === 0 && (j === colAxis.size - 1) && doRowTotals()) {
                    var totalCell = {
                        uuid: uuid(),
                        type: 'dimensionTotal',
                        cls: 'pivot-dim-total',
                        rowSpan: colAxis.dims,
                        htmlValue: 'Total'
                    }
                    colAxisAllObjects[i].push(totalCell);
                }
            }
        }

        return getColDimHtmlArray();
    };

    getRowHtmlArray = function() {
        var a = [],
            axisAllObjects = [],
            mergedObjects = [],
            valueItemsCopy,
            colAxisSize = colAxis.type ? colAxis.size : 1,
            rowAxisSize = rowAxis.type ? rowAxis.size : 1;

        // dimension
        if (rowAxis.type) {
            for (var i = 0, row; i < rowAxis.size; i++) {
                row = [];

                for (var j = 0, obj, newObj; j < rowAxis.dims; j++) {
                    obj = rowAxis.objects.all[j][i];
                    obj.type = 'dimension';
                    obj.cls = 'pivot-dim td-nobreak' + (layout.showHierarchy ? ' align-left' : '');
                    obj.noBreak = true;
                    obj.hidden = !(obj.rowSpan || obj.colSpan);
                    obj.htmlValue = response.getItemName(obj.id, layout.showHierarchy, true);

                    row.push(obj);
                }

                axisAllObjects.push(row);
            }
        }
        else {
            if (layout.showDimensionLabels) {
                axisAllObjects.push([{
                    type: 'transparent',
                    cls: 'pivot-transparent-row'
                }]);
            }
        }

        var rowTotalValueArray = new Array(rowAxisSize).fill(0);
        var rowSubValueArray = new Array(rowAxisSize).fill(0);
        var emptyCellsSubRowArray = new Array(rowAxisSize).fill(0);
        var emptyCellsTotalRowArray = new Array(colAxisSize).fill(0);

        var rowShift = 0;

        // value
        for (var i = 0; i < rowAxisSize; i++) {

            var row = { values: [], total: 0, empty: 0 },
                subValueRow = { values: [], total: 0, empty: 0 },
                totalValueRow = { values: [], total: 0, empty: 0 };

            var columnSubTotal = 0,
                rowSubTotal = 0,
                rowTotal = 0;

            var grandTotalRowSubValues = 0,
                grandTotalRowValues = 0;

            var colEmptyCellsTotal = 0,
                colEmptyCellsSub = 0,
                colshift = 0;

            for (var j = 0, rric, value, responseValue, htmlValue, empty, _uuid, uuids, empty; j < colAxisSize; j++) {
                rric = new ResponseRowIdCombination();
                empty = false;
                uuids = [];

                if(!testTable.columns[j + colshift]) {
                    testTable.columns.push({ values: [], total: 0, empty: 0 });
                }

                // meta data uid
                rric.add(colAxis.type ? colAxis.ids[j] : '');
                rric.add(rowAxis.type ? rowAxis.ids[i] : '');

                // value html element id
                _uuid = uuid();

                // get uuids array from colaxis/rowaxis leaf
                if (colAxis.type) {
                    uuids = uuids.concat(colAxis.objects.all[colAxis.dims - 1][j].uuids);
                }
                if (rowAxis.type) {
                    uuids = uuids.concat(rowAxis.objects.all[rowAxis.dims - 1][i].uuids);
                }

                // value, htmlValue
                responseValue = idValueMap[rric.get()];

                if (isDefined(responseValue)) {
                    value = getValue(responseValue);
                    htmlValue = responseValue;
                }
                else {
                    value = 0;
                    htmlValue = '&nbsp;';
                    empty = true;
                    emptyCellsSubRowArray[j] += 1;
                    emptyCellsTotalRowArray[j] += 1;
                    colEmptyCellsSub += 1;
                    colEmptyCellsTotal += 1;
                }

                var cell = {
                    uuid: _uuid,
                    type: 'value',
                    cls: 'pivot-value' + (empty ? ' cursor-default' : ''),
                    value: value,
                    htmlValue: htmlValue,
                    empty: empty,
                    uuids: uuids,
                    dxId: rric.getDxIdByIds(response.metaData.dx),
                }

                var emptySubRow = emptyCellsSubRowArray[j] % rowUniqueFactor === 0,
                    emptySubCol = colEmptyCellsSub % colUniqueFactor === 0,
                    emptyTotalRow = emptyCellsTotalRowArray[j] === rowAxisSize,
                    emptyTotalCol = colEmptyCellsTotal === colAxisSize;

                row.values.push(cell);

                // update totals
                row.total += cell.value;
                rowSubValueArray[j] += cell.value;
                rowTotalValueArray[j] += cell.value;
                columnSubTotal += cell.value;

                testTable.columns[j + colshift].total += cell.value;
                testTable.columns[j + colshift].isEmpty = emptyTotalRow;

                // do row sub totals
                if((i + 1) % rowUniqueFactor === 0 && doColSubTotals()) {

                    rowSubTotal += rowSubValueArray[j];
                    rowTotal += rowSubValueArray[j];

                    subValueRow.total += rowSubValueArray[j];
                    subValueRow.values.push(createSubTotalCell(rowSubValueArray[j], emptySubRow));

                    if((j + 1) % colUniqueFactor === 0 && doRowSubTotals()) {
                        subValueRow.values.push(createSubTotalCell(rowSubTotal, emptySubCol));
                        rowSubTotal = 0;
                    }

                    if(j === colAxisSize - 1 && doRowTotals()) {
                        subValueRow.values.push(createTotalCell(rowTotal, emptyTotalCol));
                        rowTotal = 0;
                    }

                    rowSubValueArray[j] = 0;
                }

                // do column sub totals
                if((j + 1) % colUniqueFactor === 0 && doRowSubTotals()) {
                    colshift++;
                    //console.log(emptySubRow, emptySubCol, emptyTotalRow, emptyTotalCol)
                    row.values.push(createSubTotalCell(columnSubTotal, emptySubCol));
                    addColumn(j + colshift, columnSubTotal, emptySubCol);
                    columnSubTotal = 0;
                }

                // do row totals
                if(i === rowAxisSize - 1 && doRowTotals()) {

                    grandTotalRowValues += rowTotalValueArray[j];
                    grandTotalRowSubValues += rowTotalValueArray[j];

                    totalValueRow.values.push(createTotalCell(rowTotalValueArray[j], emptyTotalRow));

                    if((j + 1) % colUniqueFactor === 0 && doRowSubTotals()) {
                        totalValueRow.values.push(createTotalCell(grandTotalRowSubValues, emptySubCol));
                        grandTotalRowSubValues = 0;
                    }

                    if(j === colAxisSize - 1 && doColTotals()) {
                        totalValueRow.values.push(createTotalCell(grandTotalRowValues, emptyTotalCol));
                        addColumn(j + ++colshift, grandTotalRowValues, emptyTotalCol)
                    }

                    if (doSortableColumnHeaders()) {
                        var totalIdComb = new ResponseRowIdCombination(['total', rowAxis.ids[i]]);
                        idValueMap[totalIdComb.get()] = emptyTotalRow ? null : rowTotalValueArray[j];
                    }

                    rowTotalValueArray[j] = 0;
                }

                // do column totals
                if(j === colAxisSize - 1 && doColTotals()) {
                    row.values.push(createTotalCell(row.total, emptyTotalCol));
                }

                testTable.total += value;
                row.isEmpty = emptyTotalCol;
                subValueRow.isEmpty = emptyTotalCol;

                // map element id to dim element ids
                uuidDimUuidsMap[_uuid] = uuids;
            }

            // push value row
            testTable.rows.push(row);

            // push sub value row
            if(subValueRow.values.length > 0) {
                testTable.rows.push(subValueRow);
                var axisRow = [];
                axisRow.push(createSubDimCell('&nbsp;', doHideEmptyRows() && subValueRow.isEmpty, rowAxis.dims));
                for (var j = 0; j < rowAxis.dims; j++) {
                    axisRow.push(createSubDimCell('', doHideEmptyRows() && subValueRow.isEmpty, 1, 1, true));
                }
                axisAllObjects.splice(i + 1 + rowShift++, 0, axisRow);
            }

            // push total value row
            if(totalValueRow.values.length > 0) {
                totalValueRow.total = testTable.total;
                testTable.rows.push(totalValueRow);
            }
        }

        // display col percentages
        if(doColPercentage()) {
            for(var i = 0; i < testTable.rows.length; i++) {
                for (var j = 0; j < testTable.rows[i].values.length; j++) {
                    testTable.rows[i].values[j].htmlValue = getRoundedHtmlValue((testTable.rows[i].values[j].value / testTable.columns[j].total) * 100) + '%';
                }
            }
        }

        // display row percentages
        if(doRowPercentage()) {
            for(var i = 0; i < testTable.rows.length; i++) {
                for (var j = 0; j < testTable.rows[i].values.length; j++) {
                    testTable.rows[i].values[j].htmlValue = getRoundedHtmlValue((testTable.rows[i].values[j].value / testTable.rows[i].total) * 100) + '%';
                }
            }
        }

        // hide empty columns
        if(doHideEmptyColumns()) {
            for(var i = 0, dimLeaf; i < testTable.columns.length; i++) {
                if(testTable.columns[i].isEmpty) {
                    for(var j = 0; j < testTable.rows.length; j++) {
                        testTable.rows[j].values[i].collapsed = true;
                    }
                    dimLeaf = colAxisAllObjects[colAxis.dims-1][i];
                    if (dimLeaf) recursiveReduce(dimLeaf);
                }
            }
        }

        // hide empty rows
        if(doHideEmptyRows()) {
            for(var i = 0, dimLeaf; i < testTable.rows.length; i++) {
                if(testTable.rows[i].isEmpty) {
                    for(var j = 0; j < testTable.rows[i].values.length; j++) {
                        testTable.rows[i].values[j].collapsed = true;
                    }
                    dimLeaf = axisAllObjects[i][rowAxis.dims-1];
                    console.log(axisAllObjects);
                    recursiveReduce(dimLeaf);
                }
            }
        }

        // merge dim, value, total
        for (var i = 0, row; i < testTable.rows.length; i++) {
            row = [];

            if(doRowTotals() && i === testTable.rows.length - 1) {
                row.push(createGrandTotalCell(rowAxis.dims));
            } else {
                row = row.concat(axisAllObjects[i]);
            }

            mergedObjects.push(row.concat(testTable.rows[i].values));
        }

        // create html items
        for (var i = 0, row; i < mergedObjects.length; i++) {
            row = [];

            for (var j = 0; j < mergedObjects[i].length; j++) {
                row.push(getTdHtml(mergedObjects[i][j]));
            }

            a.push(row);
        }

        return a;
    };

    getTopBarSpan = function(span) {
        var rowDims = rowAxis.dims || 0;

        if (!layout.showDimensionLabels) {
            if (!colAxis.type && rowAxis.type) {
                return rowDims + 1;
            }
            else if (colAxis.type && rowAxis.type) {
                return span + (rowDims > 1 ? rowDims - 1 : rowDims);
            }
        }

        return span;
    };

    getFilterHtmlArray = function(span) {
        if (!layout.filters) {
            return;
        }

        var text = layout.filters.getRecordNames(false, layout.getResponse(), true);
        var row = [];

        row.push(getTdHtml({
            type: 'filter',
            cls: 'pivot-filter cursor-default',
            colSpan: getTopBarSpan(span),
            title: text,
            htmlValue: text
        }));

        return [row];
    };

    getTitle = function(span) {
        if (!layout.title) {
            return;
        }

        var text = layout.title;
        var row = [];

        row.push(getTdHtml({
            type: 'filter',
            cls: 'pivot-filter cursor-default',
            colSpan: getTopBarSpan(span),
            title: text,
            htmlValue: text,
        }));

        return [row];
    };

    getHtml = function(rowStart = 0, colStart = 0, columnWidth, columnHeight) {

        var cls = 'pivot user-select',
            rowEnd = Math.floor((document.body.clientHeight / columnHeight) + rowStart),
            colEnd = Math.floor((document.body.clientWidth / columnWidth) + colStart),
            progressiveLoading = false,
            table;

        cls += layout.displayDensity ? ' displaydensity-' + layout.displayDensity : '';
        cls += layout.fontSize ? ' fontsize-' + layout.fontSize : '';

        table = '<table class="' + cls + '">';

        // TODO: Work in progress
        if(progressiveLoading) {
            console.log(`start: ${colStart} end: ${colEnd}`);
            for (var i = 0; i < htmlArray.slice(rowStart, rowEnd).length; i++) {

                var columns = htmlArray[i].slice(colStart, colEnd),
                    rightPad = (htmlArray[i].length - colEnd) * columnWidth,
                    leftPad = colStart * columnWidth;

                if(colStart < rowAxis.items.length) {
                    columns = htmlArray[i].slice(0, colEnd + rowAxis.items.length);
                }

                if(i >= colAxis.items.length && colStart >= rowAxis.items.length) {
                    columns.unshift(`<td style="width:${leftPad}px!important"></td>`);
                }

                if(i >= colAxis.items.length && rightPad > 0) {
                    columns.push(`<td style="min-width:${rightPad}px!important"></td>`);
                }

                if(i < colAxis.items.length && colStart >= rowAxis.items.length) {
                      columns = htmlArray[i].filter((col) => col !== '').

                      slice(Math.max(
                        Math.floor(colStart / colAxis.span[i]) - 2,
                        0
                      ), Math.floor(colEnd / colAxis.span[i]) + 2);

                      if (Math.floor(colStart / colAxis.span[i]) > 2 && i === 5) {
                         columns.unshift(`<td style="min-width:${leftPad - 1 * 120}px!important"`);
                      }
                }

                table += '<tr>' + columns.join('') + '</tr>';
            }
        } else {
            for (var i = 0; i < htmlArray.length; i++) {
                table += '<tr>' + htmlArray[i].join('') + '</tr>';
            }
        }

        return table += '</table>';
    };

    // get html
    (function() {
        var colAxisHtmlArray = getColAxisHtmlArray();
        var filterRowColSpan = (colAxisHtmlArray[0] || []).length;
        var rowDims = rowAxis.dims || 0;

        htmlArray = arrayClean([].concat(
            options.skipTitle ? [] : getTitle(filterRowColSpan) || [],
            getFilterHtmlArray(filterRowColSpan) || [],
            colAxisHtmlArray || [],
            getRowHtmlArray() || []
        ));
    }());

    // constructor
    t.html = getHtml();
    t.htmlfn = getHtml;
    t.uuidDimUuidsMap = uuidDimUuidsMap;
    t.sortableIdObjects = sortableIdObjects;
    t.idValueMap = idValueMap;

    t.layout = layout;
    t.response = response;
    t.colAxis = colAxis;
    t.rowAxis = rowAxis;
    t.tdCount = tdCount;
    t.table = testTable;
};

Table.prototype.getUuidObjectMap = function() {
    return objectApplyIf((this.colAxis ? this.colAxis.uuidObjectMap || {} : {}), (this.rowAxis ? this.rowAxis.uuidObjectMap || {} : {}));
};
