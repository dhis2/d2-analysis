import isString from 'd2-utilizr/lib/isString';
import isNumber from 'd2-utilizr/lib/isNumber';
import isArray from 'd2-utilizr/lib/isArray';
import isObject from 'd2-utilizr/lib/isObject';
import isBoolean from 'd2-utilizr/lib/isBoolean';
import isDefined from 'd2-utilizr/lib/isDefined';
import clone from 'd2-utilizr/lib/clone';
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

    // inititalize global variables/functions
    
    // global functions

        // table builder
    let getEmptyHtmlArray,
        getRoundedHtmlValue,
        getTdHtml,
        getTableHtml,
        getColAxisObjectArray,
        getRowAxisObjectArray,
        getValueObjectArray,
        getTopBarSpan,
        getFilterHtmlArray,
        getTitle,
        getHtml,
        renderTable,
        combineTable,
        resizeRow,
        addColumn,

        // table options
        doColTotals,
        doRowTotals,
        doColSubTotals,
        doRowSubTotals,
        doColPercentage,
        doRowPercentage,
        doHideEmptyRows,
        doHideEmptyColumns,
        doShowDimensionLabels, 
        doSortableColumnHeaders,

        // cell creation
        createSubTotalCell,
        createTotalCell,
        createSubDimCell,
        createGrandTotalCell,
        createPaddingCell,
        createEmptyCell,

        // utils
        getValue,
        roundIf,
        getNumberOfDecimals,
        recursiveReduce,
        getUniqueFactor,
        tableLogger,

    // global variables

        // table holders
        testTable = { rows: [], columns: [], total: 0 },
        completeTableObjects,
        valueAllObjects = [],
        htmlArray,

        // row axis
        rowAxisAllObjects = [],
        rowUniqueFactor,
        rowDimensionNames,

        // col axis
        colAxisAllObjects = [],
        columnDimensionNames,
        colUniqueFactor,

        // uid
        uuidDimUuidsMap = {},

        // legend set
        legendSet = isObject(layout.legendSet) ? appManager.getLegendSetById(layout.legendSet.id) : null,
        legendDisplayStyle = layout.legendDisplayStyle,

        // utils
        tdCount = 0,
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

    tableLogger = function(table, colStart, colEnd, rowStart, rowEnd) {
        console.log(`colstart: ${colStart} colend: ${colEnd}`);
        console.log(`rowstart: ${rowStart} rowend: ${rowEnd}`);
    }

    colUniqueFactor = getUniqueFactor(colAxis);
    rowUniqueFactor = getUniqueFactor(rowAxis);
    columnDimensionNames = colAxis.type ? layout.columns.getDimensionNames(response) : [];
    rowDimensionNames = rowAxis.type ? layout.rows.getDimensionNames(response) : [];

    getRoundedHtmlValue = function(value, dec = 2) {
        return parseFloat(roundIf(value, 2)).toString();
    };

    getEmptyHtmlArray = function(i) {
        var html = [],
            isIntersectionCell = i < colAxis.dims - 1;

        if (rowAxis.type && rowAxis.dims) {
            for (var j = 0; j < rowAxis.dims - 1; j++) {
                html.push(createEmptyCell('pivot-dim-label', !isIntersectionCell ? response.getNameById(rowDimensionNames[j]) : ''));
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
        if (isString(config.sort)) {
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
                html += 'style="' + (config.width ? 'width:' + config.width + 'px!important;' : '') + 
                                    (config.width ? 'min-width:' + config.width + 'px!important;' : '') +
                                    (config.height ? 'height:' + config.height + 'px!important;' : '') + 
                                    (config.height ? 'min-height:' + config.height + 'px!important;' : '') +
                                    (bgColor && isValue ? 'background-color:' + bgColor + '; color: ' + color + '; '  : '') + '">' + htmlValue + '</td>';
            } else {
                html += 'style="' + (config.width ? 'width:' + config.width + 'px!important;' : '') +
                                    (config.width ? 'min-width:' + config.width + 'px!important;' : '') +
                                    (config.height ? 'height:' + config.height + 'px!important;' : '') + 
                                    (config.height ? 'min-height:' + config.height + 'px!important;' : '') +
                                    (bgColor && isValue ? 'background-color:' + bgColor + '; ' : '') + '">' + htmlValue + '</td>';
            }
        }

        if (legendDisplayStyle === optionConfig.getLegendDisplayStyle('text').id) {
            html += 'style="' + (config.width ? 'width:' + config.width + 'px!important;' : '') +
                                (config.width ? 'min-width:' + config.width + 'px!important;' : '') +
                                (config.height ? 'height:' + config.height + 'px!important;' : '') + 
                                (config.height ? 'min-height:' + config.height + 'px!important;' : '') +
                                (bgColor && isValue ? 'color:' + bgColor + '; ' : '') + '">' + htmlValue + '</td>';
        }

        return html;
    };

    // TODO: rename to something more usefull
    addColumn = function(position, total, empty) {
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

    doRowSubTotals = function() {
        return !!layout.showRowSubTotals && colAxis.type && colAxis.dims > 1;
    };

    doColPercentage = function() {
        return layout.displayType === 'PERCENTCOLUMN';
    };

    doRowPercentage = function() {
        return layout.displayType === 'PERCENTROW';
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

    doShowDimensionLabels = function() {
        return layout.showDimensionLabels;
    }

    createSubTotalCell = function(value, empty, collapsed = false, colSpan = 1, rowSpan = 1) {
        return {
            type: 'valueSubtotal',
            cls: 'pivot-value-subtotal' + (empty ? ' cursor-default' : ''),
            htmlValue: empty ? '&nbsp;' : getRoundedHtmlValue(value),
            collapsed,
            empty,
            value,
            colSpan,
            rowSpan
        };
    };

    createTotalCell = function(value, empty, collapsed = false, colSpan = 1, rowSpan = 1) {
        return {
            type: 'valueTotalSubgrandtotal',
            cls: 'pivot-value-total-subgrandtotal' + (empty ? ' cursor-default' : ''),
            htmlValue: empty ? '&nbsp;' : getRoundedHtmlValue(value),
            collapsed,
            empty,
            value,
            colSpan,
            rowSpan
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

    createGrandTotalCell = function (colSpan = 1, rowSpan = 1) {
        return {
            type: 'dimensionSubtotal',
            cls: 'pivot-dim-total',
            htmlValue: 'Total',
            colSpan,
            rowSpan,
        };
    };

    createEmptyCell = function (cls='pivot-empty', htmlValue='&nbsp;', colSpan = 1, rowSpan = 1, hidden = false)  {
        return {
            type: 'empty',
            cls,
            colSpan,
            htmlValue,
            rowSpan,
            hidden,
        };
    };

    createPaddingCell = function (width='', height='', colSpan=1, cls='pivot-empty', htmlValue='&nbsp;', rowSpan = 1) {
        return {
            type: 'padding',
            width,
            height,
            colSpan
        };
    };

    recursiveReduce = function(obj) {
        if (!obj.children) {
            obj.collapsed = true;

            if (obj.parent && obj.parent.oldestSibling) {
                obj.parent.oldestSibling.children--;
            }
        }

        if (obj.parent && obj.parent.oldestSibling) {
            recursiveReduce(obj.parent.oldestSibling);
        }
    };

    getRowAxisObjectArray = function() {
        const rowAxisArray = [];

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

                rowAxisArray.push(row);

                if(doColSubTotals() && (i + 1) % rowUniqueFactor === 0) {
                    var axisRow = [];
                    axisRow.push(createSubDimCell('&nbsp;', false, rowAxis.dims, 1));

                    for(var j = 1; j < rowAxis.dims; j++) {
                        axisRow.push(createSubDimCell('', false, 1, 1, true));
                    }
                    
                    rowAxisArray.push(axisRow);
                }

                if(doColTotals() && i === rowAxis.size - 1) {
                    var axisRow = [];
                    axisRow.push(createGrandTotalCell(rowAxis.dims));

                    for(var j = 1; j < rowAxis.dims; j++) {
                        axisRow.push(createSubDimCell('', false, 1, 1, true));
                    }

                    rowAxisArray.push(axisRow);
                }
            }
        }
        else {
            if (layout.showDimensionLabels) {
                rowAxisArray.push([{
                    type: 'transparent',
                    cls: 'pivot-transparent-row'
                }]);
            }
        }

        return rowAxisArray;
    }

    getColAxisObjectArray = function() {
        var colAxisArray = []
        if (!colAxis.type) {
            // show row dimension labels
            if (rowAxis.type && layout.showDimensionLabels) {
                colAxisArray.push([]);
                // colAxisArray from row object names
                for (var i = 0; i < rowDimensionNames.length; i++) {
                    colAxisArray[i].push(createEmptyCell('pivot-dim-label', response.getNameById(rowDimensionNames[i])));
                }
            }
            return colAxisArray;
        }

        // for each col dimension
        for (var i = 0; i < colAxis.dims; i++) {
            colAxisArray.push([]);

            if (layout.showDimensionLabels) {
                colAxisArray[i] = colAxisArray[i].concat(getEmptyHtmlArray(i))
            }
            
            else if (colAxis.type && rowAxis.type) {
                if(i === 0) {
                    colAxisArray[i].push(createEmptyCell('pivot-empty', '&nbsp;', rowAxis.dims, colAxis.dims));
                    for (var j = 0; j < rowAxis.dims - 1; j++) colAxisArray[i].push(createEmptyCell('', '', 1, 1, true));
                } else {
                    for (var j = 0; j < rowAxis.dims; j++) colAxisArray[i].push(createEmptyCell('', '', 1, 1, true));
                }
            }

            for (var j = 0, obj, spanCount = 0; j < colAxis.size; j++) {
                spanCount++;

                obj = colAxis.objects.all[i][j];
                obj.type = 'dimension';
                obj.cls = 'pivot-dim';
                obj.sort = doSortableColumnHeaders() && i === colAxis.dims - 1 ? colAxis.ids[j] : null; 
                obj.noBreak = false;
                obj.hidden = !(obj.rowSpan || obj.colSpan);
                obj.htmlValue = response.getItemName(obj.id, layout.showHierarchy, true);

                colAxisArray[i].push(obj);

                if (spanCount === colAxis.span[0] && doRowSubTotals() ) {
                    if(i === 0) {
                        colAxisArray[i].push(createSubDimCell('&nbsp;', false, 1, colAxis.dims));
                    }

                    else {
                        colAxisArray[i].push(createSubDimCell('', false, 1, 1, true));
                    }

                    spanCount = 0;
                }

                if ((j === colAxis.size - 1) && doRowTotals()) {
                    var totalCell;
                    if(i === 0) {
                        totalCell = {
                            uuid: uuid(),
                            type: 'dimensionTotal',
                            cls: 'pivot-dim-total',
                            rowSpan: colAxis.dims,
                            colSpan: 1,
                            htmlValue: 'Total',
                            sort: doSortableColumnHeaders() ? 'total' : null
                        }
                    }

                    else {
                        totalCell = createSubDimCell('', false, 1, 1, true);
                    }
                    
                    colAxisArray[i].push(totalCell);
                }
            }
        }

        return colAxisArray;
    };

    getValueObjectArray = function() {
        var valueObjects = [],
            colAxisSize = colAxis.type ? colAxis.size : 1,
            rowAxisSize = rowAxis.type ? rowAxis.size : 1,
            rowTotalValueArray = new Array(rowAxisSize).fill(0),
            rowSubValueArray = new Array(rowAxisSize).fill(0),
            emptyCellsSubRowArray = new Array(rowAxisSize).fill(0),
            emptyCellsTotalRowArray = new Array(colAxisSize).fill(0);

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

            for (var j = 0, rric, value, responseValue, htmlValue, empty, _uuid, uuids, empty, totalIdComb; j < colAxisSize; j++) {
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
                    rowSpan: 1,
                    colSpan: 1,
                }

                var emptySubRow = emptyCellsSubRowArray[j] % rowUniqueFactor === 0 && emptyCellsSubRowArray[j] !== 0,
                    emptySubCol = colEmptyCellsSub % colUniqueFactor === 0 && colEmptyCellsSub !== 0,
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
                    colshift += 1;
                    row.values.push(createSubTotalCell(columnSubTotal, emptySubCol));
                    addColumn(j + colshift, columnSubTotal, emptySubCol);
                    columnSubTotal = 0;
                }

                // do row totals
                if(i === rowAxisSize - 1 && doColTotals()) {
                    grandTotalRowValues += rowTotalValueArray[j];
                    grandTotalRowSubValues += rowTotalValueArray[j];

                    totalValueRow.values.push(createTotalCell(rowTotalValueArray[j], emptyTotalRow));

                    if((j + 1) % colUniqueFactor === 0 && doRowSubTotals()) {
                        totalValueRow.values.push(createTotalCell(grandTotalRowSubValues, emptySubCol));
                        grandTotalRowSubValues = 0;
                    }

                    if(j === colAxisSize - 1 && doRowTotals()) {
                        colshift += 1;
                        totalValueRow.values.push(createTotalCell(grandTotalRowValues, emptyTotalCol));
                        addColumn(j + colshift, grandTotalRowValues, emptyTotalCol)
                    }

                    if (doSortableColumnHeaders()) {
                        totalIdComb = new ResponseRowIdCombination(['total', rowAxis.ids[i]]);
                        idValueMap[totalIdComb.get()] = emptyTotalRow ? null : rowTotalValueArray[j];
                    }

                    rowTotalValueArray[j] = 0;
                }

                // do column totals
                if(j === colAxisSize - 1 && doRowTotals()) {
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
            }

            // push total value row
            if(doColTotals() && totalValueRow.values.length > 0) {
                totalValueRow.total = testTable.total;
                testTable.rows.push(totalValueRow);
            }
        }
        
        // display col percentages TODO: Split into own function
        if(doColPercentage()) {
            for(var i = 0; i < testTable.rows.length; i++) {
                for (var j = 0; j < testTable.rows[i].values.length; j++) {
                    testTable.rows[i].values[j].htmlValue = getRoundedHtmlValue((testTable.rows[i].values[j].value / testTable.columns[j].total) * 100) + '%';
                }
            }
        }

        // display row percentages TODO: Split into own function
        if(doRowPercentage()) {
            for(var i = 0; i < testTable.rows.length; i++) {
                for (var j = 0; j < testTable.rows[i].values.length; j++) {
                    testTable.rows[i].values[j].htmlValue = getRoundedHtmlValue((testTable.rows[i].values[j].value / testTable.rows[i].total) * 100) + '%';
                }
            }
        }

        // hide empty columns TODO: Split into own function
        if(doHideEmptyColumns()) {
            for(var i = 0, dimLeaf; i < testTable.columns.length; i++) {
                if(testTable.columns[i].isEmpty) {
                    for(var j = 0; j < testTable.rows.length; j++) {
                        testTable.rows[j].values[i].collapsed = true;
                    }
                    dimLeaf = colAxisAllObjects[colAxis.dims-1][i + rowAxis.dims];
                    if (dimLeaf) {
                        recursiveReduce(dimLeaf);
                        colAxisAllObjects[0][i + rowAxis.dims].collapsed = true;
                    }
                }
            }
        }

        // hide empty rows TODO: Split into own function
        if(doHideEmptyRows()) {
            for(var i = 0, dimLeaf; i < testTable.rows.length; i++) {
                if(testTable.rows[i].isEmpty) {
                    for(var j = 0; j < testTable.rows[i].values.length; j++) {
                        testTable.rows[i].values[j].collapsed = true;
                    }
                    dimLeaf = rowAxisAllObjects[i][rowAxis.dims-1];
                    if (dimLeaf) {
                        recursiveReduce(dimLeaf);
                        rowAxisAllObjects[i][0].collapsed = true;
                    }
                }
            }
        }

        for(var i = 0; i < testTable.rows.length; i++) {
            for(var j = 0, valueRow = []; j < testTable.rows[i].values.length; j++) {
                valueRow.push(testTable.rows[i].values[j]);
            }
            valueObjects.push(valueRow);
        }

        return valueObjects;
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

    combineTable = function(rowAxisComb, colAxisComb, values) {
        const combinedTable = [];
        for (let i = 0; i < values.length; i++) {
            combinedTable.push(rowAxisComb[i].concat(values[i]));
        }
        return colAxisComb.concat(combinedTable);
    };

    getTableHtml = function(combiTable) {
        const html = [];
        for (let i=0; i < combiTable.length; i++) {
            for (var j=0, htmlRow=[]; j < combiTable[i].length; j++) {
                htmlRow.push(getTdHtml(combiTable[i][j]));
            }
            html.push(htmlRow);
        }
        return html;
    };

    getHtml = function() {
        var cls = 'pivot user-select',
            table;

        cls += layout.displayDensity ? ' displaydensity-' + layout.displayDensity : '';
        cls += layout.fontSize ? ' fontsize-' + layout.fontSize : '';

        table = '<table class="' + cls + '">';

        for (var i = 0; i < htmlArray.length; i++) {
            table += '<tr>' + htmlArray[i].join('') + '</tr>';
        }

        return table += '</table>';
    };

    resizeRow = function(row, maxColSpan) {
        var colSpanCounter = 0;
        for (var i = 0; i < row.length; i++) {
            var currentCell = row[i];
            if(currentCell.colSpan && colSpanCounter + currentCell.colSpan > maxColSpan && !currentCell.hidden) {
                row[i] = clone(row[i]);
                row[i].colSpan = maxColSpan - colSpanCounter;
            }
            if(colSpanCounter !== maxColSpan && !currentCell.hidden) {
                colSpanCounter += currentCell.colSpan ? row[i].colSpan : 0;
            }
        }        
    }

    renderTable = function(rowStart=0, colStart=0, cellWidth=120, cellHeight=25) {

        const rowEnd = Math.floor((document.body.clientHeight / cellHeight) + rowStart),
              colEnd = Math.floor((document.body.clientWidth / cellWidth) + colStart),
              topPad = rowStart * cellHeight,
              botPad = (completeTableObjects.length - rowEnd) * cellHeight,
              table = completeTableObjects.slice(rowStart, rowEnd);
      
        for(let i = 0, rightPad, leftPad; i < table.length; i++) {
            
            // define amount of right padding to simulate scrolling
            rightPad = (completeTableObjects[i].length - colEnd) * cellWidth;

            // define amount of left padding to simulate scrolling
            leftPad = colStart * cellWidth;

            // slice viewable column cells
            if(colStart < rowAxis.dims && table[i][0].colSpan > 1) {
                table[i] = table[i].slice(0, colEnd);
                table[i][0] = clone(table[i][0]);
                table[i][0].colSpan = rowAxis.dims - colStart;
            } else {
                table[i] = table[i].slice(colStart, colEnd);
            }

            // resize colspan of col axis
            if(i < colAxis.dims && table[i][0].children > 1 && table[i][0].hidden && rowStart < colAxis.dims) {
                let counter = 1, next = table[i][counter];
                while(next && table[i][0].id === next.id) {
                    counter++;
                    next = table[i][counter];
                }
                // clone object to not modify original object
                table[i][0] = clone(table[i][0]);
                table[i][0].hidden = false;
                table[i][0].colSpan = counter;
            }

            // resize rowspan of row axis TODO: Find a better way to do this
            if(rowStart >= colAxis.dims) {
                for(let j=0; j < rowAxis.dims; j++) {
                    if(table[0][j].children > 1 && table[0][j].hidden) {
                        let counter = 1, next = table[colAxis.dims - 1 + counter][j];
                        while(next && table[colAxis.dims - 1][j].id === next.id) {
                            counter++;
                            next = table[colAxis.dims - 1 + counter][j];
                        }
                        // clone object to not modify original object
                        table[0][j] = clone(table[0][j]);
                        table[0][j].hidden = false;
                        table[0][j].rowSpan = counter;
                    }
                }
            }
            
            // resize row to keep table size consistent
            resizeRow(table[i], colEnd - colStart);

            // add left pad to table to start of array
            if(colStart > 0) {
                table[i].unshift(createPaddingCell(leftPad, cellHeight));
            }

            // add right pad to table to end of array
            if(rightPad > 0) {
                table[i].push(createPaddingCell(rightPad, cellHeight));
            }
        }

        // add top pad to table to start of array
        if(rowStart > 0) {
            table.unshift([createPaddingCell(cellWidth, topPad, (colEnd - colStart) + 1)]);
        }

        // add bottom pad to table to end of array
        if(botPad > 0) {
            table.push([createPaddingCell(cellWidth, botPad, (colEnd - colStart) + 1)]);
        }

        htmlArray = arrayClean([].concat(
            // options.skipTitle ? [] : getTitle(table[0].length) || [],
            // getFilterHtmlArray(table[0].length) || [],
            getTableHtml(table)
        ));

        return getHtml();
    };

    // get html
    (function() {
        // build col axis
        colAxisAllObjects = getColAxisObjectArray();

        // build row axis
        rowAxisAllObjects = getRowAxisObjectArray();

        // build value table
        valueAllObjects = getValueObjectArray();

        // combine axes with value table
        completeTableObjects = combineTable(rowAxisAllObjects, colAxisAllObjects, valueAllObjects);

        // render html
        renderTable();
    }());
    
    // constructor
    t.html = getHtml();
    t.render = renderTable;
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
