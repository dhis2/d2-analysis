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


    const cellWidth = 120,
          cellHeight = 25;

    // inititalize global variables/functions
    
    // global functions

    console.log(response);

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
        compressTable,

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
        doDynamicTableUpdate,
        doRenderLargeTables,

        // table transformations
        hideEmptyColumns,
        hideEmptyRows,
        changeToColPercentage,
        changeToRowPercentage,

        // cell creation
        createCell,

        // utils
        getValue,
        roundIf,
        getNumberOfDecimals,
        recursiveReduce,
        getUniqueFactor,
        tableLogger,
        getTableColumnSize,
        getTableRowSize,
        createMatrix,
        defaultReturnProxy,
        createValueMatrix,

    // global variables

        // table holders
        completeTableObjects,
        valueAllObjects = [],

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
        valueMatrix,
        typeMatrix,

        // legend set
        legendSet = isObject(layout.legendSet) ? appManager.getLegendSetById(layout.legendSet.id) : null,
        legendDisplayStyle = layout.legendDisplayStyle,

        // utils
        dimensionNameMap = dimensionConfig.getDimensionNameMap(),
        objectNameMap = dimensionConfig.getObjectNameMap(),
        idValueMap = response.getIdValueMap(layout),
        sortableIdObjects = [], //todo
        tdCount = 0;

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

    getRoundedHtmlValue = function(value, dec = 2) {
        return parseFloat(roundIf(value, 2)).toString();
    };

    getTableColumnSize = function() {
        let size = colAxis.size;

        if(doRowSubTotals()) size += colAxis.size / colUniqueFactor;
        if(doRowTotals()) size += 1

        return size;
    }

    getTableRowSize = function() {
        let size = rowAxis.size;

        if(doColSubTotals()) size += rowAxis.size / rowUniqueFactor;
        if(doColTotals()) size += 1

        return size;
    }

    createMatrix = function(x, y) {
        let matrix = new Array(x);
        for(let i = 0; i < x; i++) matrix[i] = new Array(y).fill(0);
        return matrix;
    }

    getEmptyHtmlArray = function(i) {
        var html = [],
            isIntersectionCell = i < colAxis.dims - 1;

        if (rowAxis.type && rowAxis.dims) {
            for (var j = 0; j < rowAxis.dims - 1; j++) {
                html.push(createCell(!isIntersectionCell ? response.getNameById(rowDimensionNames[j]) : '', 'pivot-dim-label', 'empty', {}));
            }
        }
        
        var cellValue = isIntersectionCell ? response.getNameById(columnDimensionNames[i]) :
                response.getNameById(rowDimensionNames[j]) + 
                (colAxis.type && rowAxis.type ? '&nbsp;/&nbsp;' : '') + 
                response.getNameById(columnDimensionNames[i]);

        html.push(createCell(cellValue, 'pivot-dim-label', 'empty', {}));

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
        tdCount += 1;

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
                                    (config.width ? 'max-width:' + config.width + 'px;' : '') +
                                    (config.height ? 'height:' + config.height + 'px!important;' : '') + 
                                    (config.height ? 'min-height:' + config.height + 'px!important;' : '') +
                                    (config.height ? 'max-height:' + config.height + 'px!important;' : '') +
                                    (doDynamicTableUpdate() ? 'overflow: hidden;' : '') +
                                    (doDynamicTableUpdate() ? 'text-overflow: ellipsis;' : '') +
                                    (doDynamicTableUpdate() ? 'white-space: nowrap;' : '') +
                                    (bgColor && isValue ? 'background-color:' + bgColor + '; color: ' + color + '; '  : '') + '">' + htmlValue + '</td>';
            } else {
                html += 'style="' + (config.width ? 'width:' + config.width + 'px!important;' : '') +
                                    (config.width ? 'min-width:' + config.width + 'px!important;' : '') +
                                    (config.width ? 'max-width:' + config.width + 'px;' : '') +
                                    (config.height ? 'height:' + config.height + 'px!important;' : '') + 
                                    (config.height ? 'min-height:' + config.height + 'px!important;' : '') +
                                    (config.height ? 'max-height:' + config.height + 'px!important;' : '') +
                                    (doDynamicTableUpdate() ? 'overflow: hidden;' : '') +
                                    (doDynamicTableUpdate() ? 'text-overflow: ellipsis;' : '') +
                                    (doDynamicTableUpdate() ? 'white-space: nowrap;' : '') +
                                    (bgColor && isValue ? 'background-color:' + bgColor + '; ' : '') + '">' + htmlValue + '</td>';
            }
        }

        if (legendDisplayStyle === optionConfig.getLegendDisplayStyle('text').id) {
            html += 'style="' + (config.width ? 'width:' + config.width + 'px!important;' : '') +
                                (config.width ? 'min-width:' + config.width + 'px!important;' : '') +
                                (config.width ? 'max-width:' + config.width + 'px!important;' : '') +
                                (config.height ? 'height:' + config.height + 'px!important;' : '') + 
                                (config.height ? 'min-height:' + config.height + 'px!important;' : '') +
                                (config.height ? 'max-height:' + config.height + 'px!important;' : '') +
                                (doDynamicTableUpdate() ? 'overflow: hidden;' : '') +
                                (doDynamicTableUpdate() ? 'text-overflow: ellipsis;' : '') +
                                (doDynamicTableUpdate() ? 'white-space: nowrap;' : '') +
                                (bgColor && isValue ? 'color:' + bgColor + '; ' : '') + '">' + htmlValue + '</td>';
        }

        return html;
    };

    // TODO: rename to something more usefull
    addColumn = function(valueTable, position, total, empty) {
        if(!valueTable.columns[position]) {
            valueTable.columns.push({ values: [], total: 0, empty: 0 });
        }
        // valueTable.columns[position].total += total;
        // valueTable.columns[position].isEmpty = empty;
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

    doDynamicTableUpdate = function() {
        return true;
    }

    doRenderLargeTables = function() {
        return false;
    }

    //TODO: have all cell creation go through this function
    createCell = function(value, cls, type, {collapsed=false, hidden=false, empty=false, colSpan=1, rowSpan=1, generateUuid=false, numeric=false, title, width, height, sort, noBreak, dxId, uuids, htmlValue}) {
            var cell = {}

            cell.uuid = generateUuid ? uuid() : null;

            value = Math.max(0, value);

            cell.cls = cls;
            cell.value = value ? value : '';
            cell.cls += (empty ? ' cursor-default' : '');
            cell.colSpan = colSpan;
            cell.rowSpan = rowSpan;
            cell.empty = empty;
            cell.hidden = hidden;
            cell.type = type;

            cell.width = width ?  width : doDynamicTableUpdate() ? cellWidth : null;
            cell.height = height ? height : doDynamicTableUpdate() ? cellHeight : null;
            
            cell.dxId = dxId;
            cell.uuids = uuids;

            if(numeric && !htmlValue) {
                cell.htmlValue = empty ? '&nbsp;' : getRoundedHtmlValue(value);
            } 
            else if (!htmlValue) {
                cell.htmlValue = value ? value : '';
            }
            else {
                cell.htmlValue = htmlValue;
            }

            return cell;
    }

    hideEmptyColumns = function(valueTable, axisObjects) {
        for(var i = 0, dimLeaf; i < valueTable.columns.length; i++) {
            if(valueTable.columns[i].isEmpty) {
                for(var j = 0; j < valueTable.rows.length; j++) {
                    valueTable.rows[j].values[i].collapsed = true;
                }
                dimLeaf = axisObjects[colAxis.dims-1][i + rowAxis.dims];
                if (dimLeaf) {
                    recursiveReduce(dimLeaf);
                    axisObjects[0][i + rowAxis.dims].collapsed = true;
                }
            }
        }
    }

    hideEmptyRows = function(valueTable, axisObjects) {
        for(var i = 0, dimLeaf; i < valueTable.rows.length; i++) {
            if(valueTable.rows[i].isEmpty) {
                for(var j = 0; j < valueTable.rows[i].values.length; j++) {
                    valueTable.rows[i].values[j].collapsed = true;
                }
                dimLeaf = axisObjects[i][rowAxis.dims-1];
                if (dimLeaf) {
                    recursiveReduce(dimLeaf);
                    axisObjects[i][0].collapsed = true;
                }
            }
        }
    }

    changeToColPercentage = function(valueTable) {
        for(var i = 0; i < valueTable.rows.length; i++) {
            for (var j = 0; j < valueTable.rows[i].values.length; j++) {
                if(!valueTable.rows[i].values[j].empty) {
                    valueTable.rows[i].values[j].htmlValue = getRoundedHtmlValue((valueTable.rows[i].values[j].value / valueTable.columns[j].total) * 100) + '%';
                }
                
            }
        }
    }

    changeToRowPercentage = function(valueTable) {
        for(var i = 0; i < valueTable.rows.length; i++) {
            for (var j = 0; j < valueTable.rows[i].values.length; j++) {
                if(!valueTable.rows[i].values[j].empty) {
                    valueTable.rows[i].values[j].htmlValue = getRoundedHtmlValue((valueTable.rows[i].values[j].value / valueTable.rows[i].total) * 100) + '%';
                }    
            }
        }
    }

    compressTable = function(valueTable) {
        const valueObjects = [];
        for(var i = 0; i < valueTable.rows.length; i++) {
            for(var j = 0, valueRow = []; j < valueTable.rows[i].values.length; j++) {
                valueRow.push(valueTable.rows[i].values[j]);
            }
            valueObjects.push(valueRow);
        }
        return valueObjects;
    }

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
                    obj.width = doDynamicTableUpdate() ? cellWidth : null,
                    obj.height = doDynamicTableUpdate() ? cellHeight : null,
                    obj.hidden = !(obj.rowSpan || obj.colSpan);
                    obj.htmlValue = response.getItemName(obj.id, layout.showHierarchy, true);

                    row.push(obj);
                }

                rowAxisArray.push(row);

                if(doColSubTotals() && (i + 1) % rowUniqueFactor === 0) {
                    var axisRow = [];
                    axisRow.push(createCell('&nbsp;', 'pivot-dim-subtotal', 'dimensionSubtotal', {colSpan: rowAxis.dims, empty: true}));

                    for(var j = 1; j < rowAxis.dims; j++) {
                        axisRow.push(createCell(null, 'pivot-dim-subtotal', 'dimensionSubtotal', {colSpan: rowAxis.dims - j, hidden: true}));
                    }
                    
                    rowAxisArray.push(axisRow);
                }

                if(doColTotals() && i === rowAxis.size - 1) {
                    var axisRow = [];
                    axisRow.push(createCell('Total', 'pivot-dim-total', 'dimensionSubtotal', {colSpan: rowAxis.dims, empty: true}));
                    for(var j = 1; j < rowAxis.dims; j++) {
                        axisRow.push(createCell(null, 'pivot-dim-subtotal', 'dimensionSubtotal', {colSpan: rowAxis.dims - j, hidden: true}));
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

    getColAxisObjectArray = function(startCell, endCell) {

        startCell = startCell ? startCell : 0;
        endCell = endCell ? endCell : colAxis.size;

        var colAxisArray = []
        if (!colAxis.type) {
            // show row dimension labels
            if (rowAxis.type && layout.showDimensionLabels) {
                colAxisArray.push([]);
                // colAxisArray from row object names
                for (var i = 0; i < rowDimensionNames.length; i++) {
                    colAxisArray[i].push(createCell(response.getNameById(rowDimensionNames[i]), 'pivot-dim-label', 'empty',  {}));
                }
            }
            return colAxisArray;
        }

        for (var i = 0; i < colAxis.dims; i++) {
            colAxisArray.push([]);

            if (layout.showDimensionLabels && startCell === 0) {
                colAxisArray[i] = colAxisArray[i].concat(getEmptyHtmlArray(i))
            }
            
            else if (colAxis.type && rowAxis.type) {
                if(i === 0) {
                    colAxisArray[i].push(createCell('&nbsp;', 'pivot-empty', 'empty', {colSpan: rowAxis.dims, rowSpan: colAxis.dims}));
                    for (var j = 0; j < rowAxis.dims - 1; j++) colAxisArray[i].push(createCell('', 'pivot-empty', 'empty', {hidden: true}));
                } else {
                    for (var j = 1; j <= rowAxis.dims; j++) colAxisArray[i].push(createCell(null, 'pivot-empty', 'empty', {hidden: true, colSpan: rowAxis.dims, rowSpan: colAxis.dims - j}));
                }
            }

            for (var j = startCell, obj; j < endCell; j++) {

                obj = colAxis.objects.all[i][j];
                obj.type = 'dimension';
                obj.cls = 'pivot-dim';
                obj.sort = doSortableColumnHeaders() && i === colAxis.dims - 1 ? colAxis.ids[j] : null; 
                obj.noBreak = false;
                obj.hidden = !(obj.rowSpan || obj.colSpan);
                obj.width = doDynamicTableUpdate() ? 120 : null,
                obj.height = doDynamicTableUpdate() ? 25 : null,
                obj.htmlValue = response.getItemName(obj.id, layout.showHierarchy, true);

                colAxisArray[i].push(obj);

                if ((j + 1) % colUniqueFactor === 0 && doRowSubTotals() ) {
                    if(i === 0) {
                        colAxisArray[i].push(createCell('&nbsp;', 'pivot-dim-subtotal', 'dimensionSubtotal', {rowSpan: colAxis.dims, empty: true}));
                    }

                    else {
                        colAxisArray[i].push(createCell('&nbsp;', 'pivot-dim-subtotal', 'dimensionSubtotal', {rowSpan: colAxis.dims - i, empty: true, hidden: true}));
                    }
                } else if (j !== 0 && startCell === j && (startCell - 1) % colUniqueFactor && doRowSubTotals()) {
                    if(i === 0) {
                        colAxisArray[i].unshift(createCell('&nbsp;', 'pivot-dim-subtotal', 'dimensionSubtotal', {rowSpan: colAxis.dims, empty: true}));
                    }

                    else {
                        colAxisArray[i].unshift(createCell('&nbsp;', 'pivot-dim-subtotal', 'dimensionSubtotal', {rowSpan: colAxis.dims - i, empty: true, hidden: true}));
                    }
                }

                if ((j === colAxis.size - 1) && doRowTotals()) {
                    var totalCell;
                    if(i === 0) {
                        totalCell = createCell('Total', 'pivot-dim-total', 'dimensionTotal', {sort: doSortableColumnHeaders() ? 'total' : null, rowSpan: colAxis.dims, generateUuid: true})
                    }

                    else {
                        totalCell = createCell(null, 'pivot-dim-subtotal cursor-default', 'dimensionSubtotal', {hidden: true});
                    }
                    
                    colAxisArray[i].push(totalCell);
                }
            }
        }

        return colAxisArray;
    };

    defaultReturnProxy = function(target, returnValue) {
        return new Proxy(target, {
            get: (obj, prop) => {
                return obj.hasOwnProperty(prop) ? target[prop] : returnValue;
            }
        });
    };

    const createTypeMatrix = function(rows, columns) {
        const matrix = createMatrix(rows, columns);
        for(var i = 0; i < matrix.length; i++) {
            for(var j = 0; j < matrix[i].lenght; j) {


                if(doRowSubTotals() && i % rowUniqueFactor !== 0) {
                    matrix[i][j] = 1;
                }

                if(doColSubTotals() && i % rowUniqueFactor === 0) {
                    matrix[i][j] = 2;
                }

                if(doColSubTotals() && doRowSubTotals() && i % rowUniqueFactor === 0 && j % colUniqueFactor === 0) {
                    matrix[i][j] = 3;
                }

                if(doColTotals() && i === matrix.length - 1) {
                    matrix[i][j] = 4;
                }

                if(doRowTotals() && j === matrix[i].length - 1) {
                    matrix[i][j] = 5;
                }

                if(doColTotals() && doRowTotals() && i === matrix.length - 1 && j === matrix[i].length - 1) {
                    matrix[i][j] = 6;
                }

                if(i % rowUniqueFactor === 0 || !doColSubTotals()) {
                    j += 1;
                } else {
                    j += colUniqueFactor;
                }

            }
        }
        return matrix;
    }

    createValueMatrix = function(rows, columns) {

        const matrix = createMatrix(rows, columns);
        typeMatrix = createMatrix(rows, columns);

        for (var i = 0, rowShift=0; i < rowAxis.size; i++) {
            for (var j = 0, columnShift=0, rric, empty, value, responseValue; j < colAxis.size; j++) {

                empty = false;

                rric = new ResponseRowIdCombination();
                rric.add(colAxis.type ? colAxis.ids[j] : '');
                rric.add(rowAxis.type ? rowAxis.ids[i] : '');

                responseValue = idValueMap[rric.get()];

                if (isDefined(responseValue)) {
                    value = getValue(responseValue);
                } else {
                    value = 0;
                    empty = true;
                }

                if (doRowSubTotals() && i % rowUniqueFactor === 0 && i !== 0 && j === 0) rowShift += 1;
                if (doColSubTotals() && j % colUniqueFactor === 0 && j !== 0) columnShift += 1;

                if(doColSubTotals() && doRowSubTotals()) {
                    matrix[i + rowShift + (rowUniqueFactor - (i % rowUniqueFactor))][j + columnShift + (colUniqueFactor - (j % colUniqueFactor))] += value;
                    typeMatrix[i + rowShift + (rowUniqueFactor - (i % rowUniqueFactor))][j + columnShift + (colUniqueFactor - (j % colUniqueFactor))] = 3;
                }

                if(doColSubTotals()) {
                    matrix[i + rowShift + (rowUniqueFactor - (i % rowUniqueFactor))][j + columnShift] += value;
                    typeMatrix[i + rowShift + (rowUniqueFactor - (i % rowUniqueFactor))][j + columnShift] = 1;
                    if (doRowTotals()) {
                        matrix[i + rowShift + (rowUniqueFactor - (i % rowUniqueFactor))][getTableColumnSize() - 1] += value;
                        typeMatrix[i + rowShift + (rowUniqueFactor - (i % rowUniqueFactor))][getTableColumnSize() - 1] = 4;
                    }
                }

                if(doRowSubTotals()) {
                    matrix[i + rowShift][j + columnShift + (colUniqueFactor - (j % colUniqueFactor))] += value;
                    typeMatrix[i + rowShift][j + columnShift + (colUniqueFactor - (j % colUniqueFactor))] = 2;
                    if (doRowTotals()) {
                        matrix[getTableRowSize() - 1][j + columnShift + (colUniqueFactor - (j % colUniqueFactor))] += value;
                        typeMatrix[getTableRowSize() - 1][j + columnShift + (colUniqueFactor - (j % colUniqueFactor))] = 5;
                    }
                }

                if(doRowTotals() && doColTotals()) {
                    matrix[getTableRowSize() - 1][ getTableColumnSize() - 1] = value;
                    typeMatrix[getTableRowSize() - 1][ getTableColumnSize() - 1] = 6;
                }

                if(doRowTotals()) {
                    matrix[getTableRowSize() - 1][j + columnShift] = value;
                    typeMatrix[getTableRowSize() - 1][j + columnShift] = 5;
                }

                if(doColTotals()) {
                    matrix[i + rowShift][getTableColumnSize() - 1] = value;
                    typeMatrix[i + rowShift][getTableColumnSize() - 1] = 4;
                }

                matrix[i + rowShift][j + columnShift] = empty ? -1 : value;
                typeMatrix[i + rowShift][j + columnShift] = 0;
            }
        }
        return matrix;
    }

    const isRowEmpty = function(index) {
        return valueMatrix[index][getTableColumnSize() - 1] <= 0;
    };

    const isSubRowEmpty = function(rowIndex, columnIndex) {
        return valueMatrix[rowIndex][columnIndex + (colUniqueFactor - (colUniqueFactor % columnIndex))] <= 0;
    };

    const isSubColumnEmpty = function(rowIndex, columnIndex) {
        return valueMatrix[rowIndex + (rowUniqueFactor - (rowIndex % rowUniqueFactor))][columnIndex] <= 0;
    };

    const isColumnEmpty = function(index) {
        return valueMatrix[getTableColumnSize() - 1][index] <= 0;
    };

    getValueObjectArray = function(startCell = 0, startRow = 0, endCell, endRow) {

        console.log(startCell, startRow, endCell, endRow);

        const table = [];
        for (var i = startRow, rowShift = 0, columnShift; i < endRow; i++) {
            columnShift = 0;
            table[i] = [];
            for (var j = startCell, rric, value, cell, uuids, totalIdComb; j < endCell; j++) {

                value = valueMatrix[i][j];

                switch(typeMatrix[i][j]) {
                    
                    // value cell
                    case 0: {
                        rric = new ResponseRowIdCombination();
                        uuids = [];

                        rric.add(colAxis.type ? colAxis.ids[j] : '');
                        rric.add(rowAxis.type ? rowAxis.ids[i] : '');

                        if (colAxis.type) {
                            uuids = uuids.concat(colAxis.objects.all[colAxis.dims - 1][j - rowShift].uuids);
                        }
                        if (rowAxis.type) {
                            uuids = uuids.concat(rowAxis.objects.all[rowAxis.dims - 1][i - rowShift].uuids);
                        }

                        cell = createCell(value, 'pivot-value', 'value', {generateUuid: true, uuids: uuids, empty: value < 0, dxId: rric.getDxIdByIds(response.metaData.dx), numeric: true});

                        uuidDimUuidsMap[cell.uuid] = uuids;
                    } break;
                    
                    // column sub total cell
                    case 1: {
                        cell = createCell(value, 'pivot-value-subtotal', 'valueSubtotal', {empty: isSubColumnEmpty(i, j), numeric: true})
                    } break;

                    // row sub total cell
                    case 2: {
                        cell = createCell(value, 'pivot-value-subtotal', 'valueSubtotal', {empty: isSubRowEmpty(i, j), numeric: true})
                    } break;
                    
                    // intersection sub total cell
                    case 3: {
                        cell = createCell(value, 'pivot-value-subtotal', 'valueSubtotal', {empty: isSubColumnEmpty(i, j) && isSubRowEmpty(i, j), numeric: true})
                    } break;

                    // column total cell
                    case 4: {
                        cell = createCell(value, 'pivot-value-total-subgrandtotal', 'valueTotalSubgrandtotal', {empty: isColumnEmpty(j), numeric: true})
                    } break;

                    // row total cell
                    case 5: {
                        cell = createCell(value, 'pivot-value-total-subgrandtotal', 'valueTotalSubgrandtotal', {empty: isRowEmpty(i), numeric: true})
                    } break;

                    // intersection total cell
                    case 6: {
                        cell = createCell(value, 'pivot-value-total-subgrandtotal', 'valueTotalSubgrandtotal', {empty: isColumnEmpty(j) && isRowEmpty(i), numeric: true})
                    } break;

                }

                if (doSortableColumnHeaders()) {
                    totalIdComb = new ResponseRowIdCombination(['total', rowAxis.ids[i]]);
                    idValueMap[totalIdComb.get()] = emptyTotalRow ? null : cellCounter['totalRowAllCells' + j];
                }

                table[i].push(cell);
            }
        }

        // // do row percentages
        // if(doRowPercentage()) {
        //     changeToRowPercentage(table);
        // }

        // // do column percentages
        // if(doColPercentage()) {
        //     changeToColPercentage(table);
        // }

        // // hide empty columns
        // if(doHideEmptyColumns()) {
        //     hideEmptyColumns(table, colAxisAllObjects);
        // }

        // // hide empty rows
        // if(doHideEmptyRows()) {
        //     hideEmptyRows(table, rowAxisAllObjects);
        // }

        return table;
    }

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

        var text = layout.filters.getRecordNames(false, layout.getResponse(), true),
            row = [];

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

        var text = layout.title, row = [];

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

    getHtml = function(htmlArray) {
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

    // resize row to colspan
    resizeRow = function(row, maxColSpan) {
        var colSpanCounter = 0;
        for (var i = 0; i < row.length; i++) {
            var currentCell = row[i];
            if(currentCell.colSpan && colSpanCounter + currentCell.colSpan > maxColSpan && !currentCell.hidden) {
                row[i] = clone(row[i]);
                row[i].colSpan = Math.max(maxColSpan - colSpanCounter, 1);
            }
            if(colSpanCounter !== maxColSpan && !currentCell.hidden) {
                colSpanCounter += currentCell.colSpan ? row[i].colSpan : 0;
            }
        }
    }

    renderTable = function(rowStart=0, colStart=0, cellWidth=120, cellHeight=25) {

        if(!doDynamicTableUpdate()) {
            // create html array
            var htmlArray = arrayClean([].concat(
                options.skipTitle ? [] : getTitle(completeTableObjects[0].length) || [],
                getFilterHtmlArray(completeTableObjects[0].length) || [],
                getTableHtml(completeTableObjects)
            ));

            // turn html array into html string;
            return getHtml(htmlArray);
        }  

        const rowEnd = Math.min(Math.floor((document.body.clientHeight / cellHeight) + rowStart), getTableRowSize()),
              colEnd = Math.min(Math.floor((document.body.clientWidth / cellWidth) + colStart), colAxis.size),
              topPad = rowStart * cellHeight,
              botPad = (rowAxis.size - rowEnd) * cellHeight;


        // combine axes with value table
        const table = combineTable(getRowAxisObjectArray(), getColAxisObjectArray(Math.max(0, colStart - rowAxis.dims), colEnd), getValueObjectArray(Math.max(0, colStart - rowAxis.dims), rowStart, colEnd, rowEnd));
        // loop through each row of table

        for(let i = 0, rightPad, leftPad; i < table.length; i++) {
            
            // define amount of right padding to simulate scrolling
            rightPad = (colAxis.size - colEnd) * cellWidth;

            // define amount of left padding to simulate scrolling
            leftPad = colStart * cellWidth;

            // slice viewable column cells
            if(colStart < rowAxis.dims && table[i][0].colSpan > 1) {
                table[i] = table[i].slice(0, colEnd);
                table[i][0] = clone(table[i][0]);
                table[i][0].colSpan = rowAxis.dims - colStart;  
                if(i === 0 && table[i][0].hidden) {
                    table[i][0].hidden = false;
                }
            } else {
                table[i] = table[i].slice(Math.min(rowAxis.dims, colStart), colEnd);
            }

            // deal with top left empty cell
            if(rowStart < colAxis.dims) {
                for (var j = 0; j < table[0].length; j++) {
                    if(table[0][j].hidden && table[0][j].type !== 'dimension' && j > rowAxis.dims + 1) {
                        table[0][j] = clone(table[0][j]);
                        table[0][j].hidden = false;
                    }
                }
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
                        let counter = 0, next = table[colAxis.dims - 1 + counter][j];
                        while(next && table[counter][j].id === next.id) {
                            counter++;
                            next = table[colAxis.dims - 1 + counter][j];
                        }
                        // clone object to not modify original object
                        table[0][j] = clone(table[0][j]);
                        table[0][j].hidden = false;
                        table[0][j].rowSpan = counter + 1;
                    }
                }
            }

            // resize row to keep table size consistent
            resizeRow(table[i], colEnd - colStart + rowAxis.dims);

            // add left pad to table to start of array
            if(colStart > 0) {
                table[i].unshift(createCell(null, 'pivot-padding', 'padding', {width: leftPad}));
            }

            // add right pad to table to end of array
            if(rightPad > 0) {
                table[i].push(createCell(null, 'pivot-padding', 'padding', {width: rightPad}));
            }
        }

        // add top pad to table to start of array
        if(rowStart > 0) {
            table.unshift([createCell(null, 'pivot-padding', 'padding', {height: topPad, colSpan: (colEnd - colStart) + 1})]);
        }

        // add bottom pad to table to end of array
        if(botPad > 0) {
            table.push([createCell(null, 'pivot-padding', 'padding', {height: botPad, colSpan: (colEnd - colStart) + 1})]);
        }

        // create html array
        var htmlArray = arrayClean([].concat(
            // options.skipTitle ? [] : getTitle(table[0].length) || [],
            // getFilterHtmlArray(table[0].length) || [],
            getTableHtml(table)
        ));

        // turn html array into html string;
        return getHtml(htmlArray);
    };

    // get html
    (function() {
        valueMatrix = createValueMatrix(getTableRowSize(), getTableColumnSize());
    }());
    
    // constructor
    t.dynamic = doDynamicTableUpdate();
    t.render = renderTable;
    t.uuidDimUuidsMap = uuidDimUuidsMap;
    t.sortableIdObjects = sortableIdObjects;
    t.idValueMap = idValueMap;
    t.tdCount = tdCount;
    t.layout = layout;
    t.response = response;
    t.colAxis = colAxis;
    t.rowAxis = rowAxis;
};

Table.prototype.getUuidObjectMap = function() {
    return objectApplyIf((this.colAxis ? this.colAxis.uuidObjectMap || {} : {}), (this.rowAxis ? this.rowAxis.uuidObjectMap || {} : {}));
};
