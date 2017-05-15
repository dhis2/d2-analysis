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

    console.log(response);

    var t = this,
        klass = Table,

        appManager = klass.appManager,
        uiManager = klass.uiManager,
        dimensionConfig = klass.dimensionConfig,
        optionConfig = klass.optionConfig;

    options = options || {};

    // constant variables
    const cellWidth = 120,
          cellHeight = 25;

    // cell type enum
    const cellType = {
        'value-row-subtotal':           1,
        'value-column-subtotal':        2,
        'value-intersect-subtotals':    3,
        'value-row-total':              4,
        'value-row-intersect-total':    5,
        'value-column-total':           6,
        'value-column-intersect-total': 7,
        'value-intersect-total':        8,
    };

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
        createValueMatrix,
        createLookupTable,

    // global variables

        // table info
        previousColumnStart,
        previousColumnEnd,
        previousRowStart,
        previousRowEnd,
        previousTopScrollPosition,
        previousLeftScrollPosition,
        currentTable,

        // row axis
        rowUniqueFactor,
        rowDimensionNames,

        // col axis
        columnDimensionNames,
        colUniqueFactor,

        // uid
        uuidDimUuidsMap = {},

        // lookups
        valueLookuptable,
        typeLookupTable,
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
        if (doRowSubTotals()) size += colAxis.size / colUniqueFactor;
        if (doRowTotals()) size += 1;
        return size;
    }

    getTableRowSize = function() {
        let size = rowAxis.size;
        if (doColSubTotals()) size += rowAxis.size / rowUniqueFactor;
        if (doColTotals()) size += 1;
        return size;
    }

    createLookupTable = function(xDimensionSize, yDimensionSize, fill=0) {
        let table = new Array(yDimensionSize);
        for (let i = 0; i < x; i++) {
            table[i] = new Array(xDimensionSize).fill(fill);
        }
        return table;
    }

    createMatrix = function(x, y) {
        let matrix = new Array(x);
        for (let i = 0; i < x; i++) matrix[i] = new Array(y).fill(0);
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

    const getDimensionColArray = function() {
        const dimensionColArray = [];
        // show row dimension labels
        if (rowAxis.type && layout.showDimensionLabels) {
            dimensionColArray[i] = new Array(rowDimensionNames.length);
            // colAxisArray from row object names
            for (var i = 0; i < rowDimensionNames.length; i++) {
                dimensionColArray[i][j] = createCell(response.getNameById(rowDimensionNames[i]), 'pivot-dim-label', 'empty',  {});
            }
        }
        return dimensionColArray;
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

        
    const gerResponseValue = function(x, y) {
        empty = false;

        rric = new ResponseRowIdCombination();
        rric.add(colAxis.type ? colAxis.ids[x] : '');
        rric.add(rowAxis.type ? rowAxis.ids[y] : '');

        responseValue = idValueMap[rric.get()];

        if (isDefined(responseValue)) {
            value = getValue(responseValue);
        } else {
            value = -1;
        }

        return value;
    }

    const createValueLookup = function(xDimensionSize, yDimensionSize) {
        const lookup = createLookupTable(xDimensionSize, yDimensionSize);
        for (var y = 0; i < rowAxis.size; y++) {
            for (var x = 0, value; j < colAxis.size; x++) {

                const value = getResponseValue(y, x);

                // calculate sub totals
                if (doColTotals())                        lookup[y][x] += value;
                if (doRowTotals())                        lookup[y][x] += value;

                // calculate grand totals
                if (doColSubTotals())                     lookup[y][x] += value;
                if (doRoWSubTotals())                     lookup[y][x] += value;
                
                // calculate intersection totals
                if (doColTotals() && doRowTotals())       lookup[y][x] += value;
                if (doColSubTotals() && doRowSubTotals()) lookup[y][x] += value;

                lookup[y][x] = value;
            }
        }
        return lookup;
    }

    const createTypeLookup = function(xDimensionSize, yDimensionSize) {
        const lookup = createLookupTable(xDimensionSize, yDimensionSize);
        for (var y = 0; i < rowAxis.size; y++) {
            for (var x = 0, type; j < colAxis.size; x++) {

                const type = 'sometype';

                // calculate sub totals
                if (doColTotals())                        lookup[y][x] = type;
                if (doRowTotals())                        lookup[y][x] = type;

                // calculate grand totals
                if (doColSubTotals())                     lookup[y][x] = type;
                if (doRoWSubTotals())                     lookup[y][x] = type;
                
                // calculate intersection totals
                if (doColTotals() && doRowTotals())       lookup[y][x] = type;
                if (doColSubTotals() && doRowSubTotals()) lookup[y][x] = type;

                lookup[y][x] = type;
            }
        }
        return lookup;
    }

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

    const getPercentageHtml = function(value, total) {
        return getRoundedHtmlValue((value / total) * 100) + '%';
    }

    const getRowPosition = function(position) {
        return doColSubTotals() ? position - Math.floor(position / rowUniqueFactor) : position
    }

    const getColumnPosition = function(position) {
        return doRowSubTotals() ? position - Math.floor(position / colUniqueFactor) : position
    }
    
    const createSubTotalCell = function(value) {
        return createCell(value, 'pivot-value-subtotal', 'valueSubtotal', {empty: value <= 0, numeric: true});
    }

    const createGrandTotalCell = function(value) {
        return createCell(value, 'pivot-value-total-subgrandtotal', 'valueTotalSubgrandtotal', {empty: value <= 0, numeric: true})
    }

    const createDimensionSubTotalCell = function(value, colSpan, rowSpan, empty, hidden) {
        return createCell(value, 'pivot-dim-subtotal', 'dimensionSubtotal', {colSpan, rowSpan, empty, hidden});
    }

    const createDimensionGrandTotalCell = function(value, colSpan, rowSpan, sort, generateUuid) {
        return createCell(value, 'pivot-dim-total', 'dimensionSubtotal', {colSpan, rowSpan, sort: doSortableColumnHeaders() && sort ? 'total' : null, generateUuid});
    }

    const createDimensionEmptyCell = function(colSpan, rowSpan, hidden) {
        return createCell('&nbsp;', 'pivot-empty', 'empty', {colSpan, rowSpan, hidden});
    }

    const isColumnSubTotal = function(columnPosition) {
        return doRowSubTotals() && (columnPosition + 1) % (colUniqueFactor + 1) === 0;
    }

    const isColumnGrandTotal = function(columnPosition) {
        return doRowTotals() && columnPosition === getTableColumnSize() - 1;
    }

    const isRowSubTotal = function(rowPosition) {
        return doColSubTotals() && (rowPosition + 1) % (rowUniqueFactor + 1) === 0;
    }

    const isRowGrandTotal = function(rowPosition) {
        return doColTotals() && rowPosition === getTableRowSize() - 1;
    }
    
    const getColumnAxisColumn = function(rowStart, columnIndex) {
        return getColAxisObjectArray(columnIndex, columnIndex + 1, rowStart);
    }

    const getColumnAxisRow = function(columnStart, columnEnd, rowIndex) {
        return getColAxisObjectArray(columnStart, columnEnd, rowIndex);   
    }

    const getTopPadding = function(rowStart) {
        return rowStart * cellHeight;
    }

    const getBottomPadding = function(rowEnd) {
        return (getTableRowSize() - rowEnd) * cellHeight;
    }

    const getLeftPadding = function(columnStart) {
        return columnStart * cellWidth;
    }

    const getRightPadding = function(columnEnd) {
        return (getTableColumnSize() - columnEnd) * cellWidth;
    }

    const getRowEnd = function (rowStart) { 
        return Math.min(getTableRenderHeight() + rowStart, getTableRowSize());
    }

    const getColumnEnd = function (colStart) { 
        return Math.min(getTableRenderWidth() + colStart, getTableColumnSize());
    }

    const addColumnToRightOfTable = function(rowStart, rowEnd, columnIndex) {
        insertColumn(currentTable, getTableColumn(rowStart, rowEnd, columnIndex), currentTable[1].length - 1);
    }

    const addColumnToLeftOfTable = function (rowStart, rowEnd, columnIndex) {
        insertColumn(currentTable, getTableColumn(rowStart, rowEnd, columnIndex), 1);
    }

    const removeColumnFromLeftOfTable = function (rowStart, rowEnd, columnIndex) {
        deleteColumn(currentTable, 1, 2);
        insertColumn(currentTable, getTableColumn(rowStart, rowEnd, columnIndex), 1);
    }

    const removeColumnFromRightOfTable = function () {
        deleteColumn(currentTable, currentTable[1].length - 2);
    }

    const addRowToBottomOfTable = function(columnStart, columnEnd, rowIndex) {
        insertRow(currentTable, getTableRow(columnStart, columnEnd, rowIndex), currentTable.length - 1);
    }

    const addRowToTopOfTable = function(columnStart, columnEnd, rowIndex) {
        insertRow(currentTable, getTableRow(columnStart, columnEnd, rowIndex), 1);
    }

    const removeRowFromStartOfTable = function() {
        deleteRow(currentTable, currentTable.length - 2);
    }

    const RemoveRowFromStartOfTable = function() {
        deleteRow(currentTable, 1);
    }

    const deleteRow = function(table, rowIndex) {
        table.splice(rowIndex, 1);
    }

    const deleteColumn = function(table, columnIndex, quantity=1) {
        for (var i = 1; i < table.length - 1; i++) table[i].splice(columnIndex, quantity);
    }

    const insertRow = function(table, row, rowIndex) {
        table.splice(rowIndex, 0, row);
    }

    const insertColumn = function(table, column, columnIndex) {
        for (var i = 0; i < table.length - 2; i++) table[i + 1].splice(columnIndex, 0, column[i][0]);
    }

    const getNumberOfVerticalUpdates = function(currentTopScrollPosition) {
        return Math.floor(Math.abs(previousTopScrollPosition - currentTopScrollPosition) / cellHeight);
    }

    const getNumberOfHorizontalUpdates = function(currentLeftScrollPosition) {
        return Math.floor(Math.abs(previousLeftScrollPosition - currentLeftScrollPosition) / cellWidth);
    }

    const getTableRenderWidth = function() {
        return Math.floor((document.body.clientWidth - 418) / cellWidth);
    }

    const getTableRenderHeight = function() {
        return Math.floor(document.body.clientHeight / cellHeight);
    }

    const getRowAxisColumn = function(rowStart, rowEnd, columnIndex) {

        // correct for column dimension shifty
        rowStart = Math.max(0, rowStart - colAxis.dims);

        return getRowAxisObjectArray(rowStart, rowEnd, columnIndex)[0];
    }
    const getRowAxisRow = function(columnStart, columnEnd, rowIndex) { return ; }
    const updateRowAxisRowSpan = function() { return ; }


    //TODO: have all cell creation go through this function
    createCell = function(value, cls, type, {collapsed=false, hidden=false, empty=false, colSpan=1, rowSpan=1, generateUuid=false, numeric=false, title, width, height, sort, noBreak, dxId, uuids, htmlValue}) {
        var cell = {}

        cell.uuid = generateUuid ? uuid() : null;

        if (numeric) value = Math.max(0, value);

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

    hideEmptyColumns = function(table) {
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

    hideEmptyRows = function(table) {
        for(var i = 0, dimLeaf; i < table.length; i++) {
            if(table[i].isEmpty) {
                for(var j = 0; j < table[i].length; j++) {
                    table[i][j].collapsed = true;
                }
                dimLeaf = table[i][rowAxis.dims-1];
                if (dimLeaf) {
                    recursiveReduce(dimLeaf);
                    axisObjects[i][0].collapsed = true;
                }
            }
        }
    }

    changeToColPercentage = function(table) {
        for(var i = 0; i < table.length; i++) {
            for (var j = 0; j < table[i].length; j++) {
                if(!table[i][j].empty) {
                    table[i][j].htmlValue = getPercentageHtml(table[i][j].value, valueMatrix[getTableRowSize() - 1][j]);
                }
            }
        }
    }

    changeToRowPercentage = function(table) {
        for(var i = 0; i < table.length; i++) {
            for (var j = 0; j < table[i].length; j++) {
                if(!table[i][j].empty) {
                    table[i][j].htmlValue = getPercentageHtml(table[i][j].value, valueMatrix[i][getTableColumnSize() - 1]);
                }    
            }
        }
    }

    const createValueCell = function(value, columnIndex, rowIndex) {
        const rric  = new ResponseRowIdCombination(),
              _uuid = uuid(),
              uuids = [];

        let cell;
        
        rric.add(colAxis.type ? colAxis.ids[columnIndex] : '');
        rric.add(rowAxis.type ? rowAxis.ids[rowIndex] : '');

        if (colAxis.type) uuids.push(...colAxis.objects.all[colAxis.dims - 1][columnIndex].uuids);
        if (rowAxis.type) uuids.push(...rowAxis.objects.all[rowAxis.dims - 1][rowIndex].uuids);

        // TODO: Update
        // uuidDimUuidsMap[_uuid] = uuids;

        // cell.uuid       = _uuid;
        // cell.uuids      = uuids;
        // cell.value      = value;
        // cell.empty      = empty;
        // cell.htmlValue  = htmlValue;
        // cell.type       = 'value';
        // cell.cls        = 'pivot-value' + (empty ? ' cursor-default' : '');
        // cell.dxId       = rric.getIdByIds(response.metaData.dimensions.dx);
        // cell.peId       = rric.getIdByIds(response.metaData.dimensions.pe);
        // cell.ouId       = rric.getIdByIds(response.metaData.dimensions.ou);

        cell = createCell(value, 'pivot-value', 'value', {generateUuid: true, uuids: uuids, empty: value < 0, dxId: rric.getDxIdByIds(response.metaData.dx), numeric: true});
        
        uuidDimUuidsMap[cell.uuid] = uuids;

        return cell;
    }
    
    const getValueCell = function(x, y) {
        let value = valueMatrix[y][x];
        switch(typeMatrix[y][x]) {
            case 0: return createValueCell(value, getRowPosition(x), getColumnPosition(y));
            case 1: case 2: case 3: return createSubTotalCell(value);
            case 4: case 5: case 6: return createGrandTotalCell(value);
            default: return null;;
        }
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

    const createColumnAxisCell = function(columnPosition, rowPosition) {
        let obj = clone(colAxis.objects.all[rowPosition][columnPosition]);

        obj.type = 'dimension';
        obj.cls = 'pivot-dim';
        obj.sort = doSortableColumnHeaders() && rowPosition === colAxis.dims - 1 ? colAxis.ids[columnPosition] : null; 
        obj.noBreak = false;
        obj.hidden = !(obj.rowSpan || obj.colSpan);
        obj.width = doDynamicTableUpdate() ? cellWidth : null,
        obj.height = doDynamicTableUpdate() ? cellHeight : null,
        obj.htmlValue = response.getItemName(obj.id, layout.showHierarchy, true);

        return obj;
    }

    const getColumnAxisCell = function(columnPosition, rowPosition, firstRow = false) {

        if (columnPosition < rowAxis.dims && layout.showDimensionLabels) {
            colAxisArray[i][j] = dimLabelArray[x];
            colSpanCounter++;
        }

        // create left corner cell
        if (columnPosition < rowAxis.dims && !layout.showDimensionLabels) {
            if (firstRow) colAxisArray[i][j] = createDimensionEmptyCell(rowAxis.dims - rowPosition, colAxis.dims - rowPosition, x !== columnStart);
            else         colAxisArray[i][j] = createDimensionEmptyCell(rowAxis.dims - rowPosition, colAxis.dims - rowPosition, true);
            colSpanCounter++;
        }

        // create sub row total space cell
        if (isColumnSubTotal(xd)) {
            if (firstRow) colAxisArray[i][j] = createDimensionSubTotalCell('&nbsp;', 1, colAxis.dims- rowPosition, true, false);
            else          colAxisArray[i][j] = createDimensionSubTotalCell('&nbsp;', 1, colAxis.dims- rowPosition, true, true);
            colSpanCounter++;
        }

        // cereate total row space cell
        if (isColumnGrandTotal(xd)) {
            if (firstRow) colAxisArray[i][j] = createDimensionGrandTotalCell('Total', 1, colAxis.dims - rowPosition, true, true);
            else          colAxisArray[i][j] = createDimensionSubTotalCell('&nbsp;', 1, 1, true, true);
        }
    }

    getColAxisObjectArray = function(columnStart=0, columnEnd=0, rowStart=0, colSpanStart) {   
        
        if (!colAxis.type) {
            return getDimensionColArray();
        }

        let arraySize = colAxis.dims - Math.min(rowStart, colAxis.dims),
            colAxisArray = new Array(arraySize),
            maxColSpan = columnEnd - columnStart - rowAxis.dims;

        for (var i = 0, y = rowStart, dimLabelArray; i < colAxisArray.length; i++, y++) {;
            colAxisArray[i] = new Array(columnEnd - columnStart);

            if (layout.showDimensionLabels && columnStart < rowAxis.dims && y < colAxis.dims) {
                dimLabelArray = getEmptyHtmlArray(y);
            }
            
            for (var j = 0, x = columnStart, xd = columnStart, colSpanCounter = colSpanStart ? colSpanStart : 0, colPos, obj; j < colAxisArray[i].length; j++, x++) {

                xd = Math.max(0, x - rowAxis.dims);
                
                // create left corner cell with dimension labeling
                if (x < rowAxis.dims && layout.showDimensionLabels) {
                    colAxisArray[i][j] = dimLabelArray[x];
                    colSpanCounter++;
                    continue;
                }

                // create left corner cell
                if (x < rowAxis.dims && !layout.showDimensionLabels) {
                    if (i === 0) colAxisArray[i][j] = createDimensionEmptyCell(rowAxis.dims - x, colAxis.dims - y, x !== columnStart);
                    else         colAxisArray[i][j] = createDimensionEmptyCell(rowAxis.dims - x, colAxis.dims - y, true);
                    colSpanCounter++;
                    continue;
                }

                // create sub row total space cell
                if (isColumnSubTotal(xd)) {
                    if (i === 0) colAxisArray[i][j] = createDimensionSubTotalCell('&nbsp;', 1, colAxis.dims- y, true, false);
                    else         colAxisArray[i][j] = createDimensionSubTotalCell('&nbsp;', 1, colAxis.dims- y, true, true);
                    colSpanCounter++;
                    continue;
                }

                // cereate total row space cell
                if (isColumnGrandTotal(xd)) {
                    if (i === 0) colAxisArray[i][j] = createDimensionGrandTotalCell('Total', 1, colAxis.dims - y, true, true)
                    else         colAxisArray[i][j] = createDimensionSubTotalCell('&nbsp;', 1, 1, true, true)
                    continue;
                }

                colPos = getColumnPosition(xd);
                
                obj = createColumnAxisCell(colPos, y);

                // if(obj.hidden && xd === Math.max(0, columnStart - rowAxis.dims)) {
                //     obj.hidden = false;
                //     obj.colSpan = obj.oldestSibling.children - ((doRowSubTotals() ? colPos : xd) % obj.oldestSibling.children);
                // }

                // if (colSpanCounter === maxColSpan) obj.hidden = true;

                // if (obj.colSpan && colSpanCounter + obj.colSpan > maxColSpan && !obj.hidden) {
                //     obj.colSpan = Math.max(maxColSpan - colSpanCounter, 1);
                // }

                // if (colSpanCounter !== maxColSpan && !obj.hidden) {
                //     colSpanCounter += obj.colSpan ? obj.colSpan : 0;
                // }

                colAxisArray[i][j] = obj;
            }
        }

        // updateColumnAxisColSpan(colAxisArray, columnStart, rowStart, maxColSpan);

        return colAxisArray;
    };
    
    // return getRowAxisObjectArray(rowPosition, rowPosition, columnPosition);
    getRowAxisObjectArray = function(rowStart=0, rowEnd, columnStart=0, columnEnd) {
        
        rowStart = Math.max(0, rowStart - colAxis.dims);
        
        // initiate axis array
        const rowAxisArray = new Array(rowEnd - rowStart),
              maxRowSpan = rowEnd - rowStart;

        if(!rowAxis.type) {
            if (layout.showDimensionLabels) {
                rowAxisArray[0] = [{ type: 'transparent', cls: 'pivot-transparent-row' }];
            }
            return rowAxisArray;
        }

        for (var i = 0, y = rowStart; i < rowAxisArray.length; i++, y++) {
            rowAxisArray[i] = new Array(rowAxis.dims - Math.min(columnStart, rowAxis.dims));
            for (var j = 0, x = columnStart, rowSpanCounter = 0, obj, rowPos; j < rowAxisArray[i].length; j++, x++) {

                if(isRowSubTotal(y)) {
                    if (j === 0) rowAxisArray[i][j] = createDimensionSubTotalCell('&nbsp;', rowAxis.dims - x, 1, true, false);
                    else         rowAxisArray[i][j] = createDimensionSubTotalCell('&nbsp;', rowAxis.dims - x, 1, true, true);
                    rowSpanCounter++;
                    continue;
                }

                if(isRowGrandTotal(y)) {
                    if (j === 0) rowAxisArray[i][j] = createDimensionGrandTotalCell('Total', rowAxis.dims - y, 1, false, false);
                    else         rowAxisArray[i][j] = createDimensionSubTotalCell('&nbsp;', rowAxis.dims - x, 1, true, false);
                    continue;
                }

                rowPos = getRowPosition(y);

                obj = createRowAxisCell(x, rowPos);

                if(obj.hidden && y === rowStart) {
                    obj.hidden = false;
                    obj.rowSpan = obj.oldestSibling.children - (rowPos % obj.oldestSibling.children);
                }

                if(obj.rowSpan && rowSpanCounter + obj.rowSpan > maxRowSpan && !obj.hidden) {
                    obj.rowSpan = Math.max(maxRowSpan - rowSpanCounter, 1);
                }

                if(rowSpanCounter !== maxRowSpan && !obj.hidden) {
                    rowSpanCounter += obj.rowSpan ? obj.rowSpan : 0;
                }

                rowAxisArray[i][j] = obj;
            }
        }
        return rowAxisArray;
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
                
                if (doColSubTotals() && i % rowUniqueFactor === 0 && i !== 0 && j === 0) rowShift += 1;
                if (doRowSubTotals() && j % colUniqueFactor === 0 && j !== 0) columnShift += 1;

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
                    matrix[getTableRowSize() - 1][ getTableColumnSize() - 1] += value;
                    typeMatrix[getTableRowSize() - 1][ getTableColumnSize() - 1] = 6;
                }

                if(doRowTotals()) {
                    matrix[getTableRowSize() - 1][j + columnShift] += value;
                    typeMatrix[getTableRowSize() - 1][j + columnShift] = 5;
                }

                if(doColTotals()) {
                    matrix[i + rowShift][getTableColumnSize() - 1] += value;
                    typeMatrix[i + rowShift][getTableColumnSize() - 1] = 4;
                }

                matrix[i + rowShift][j + columnShift] = empty ? -1 : value;
                typeMatrix[i + rowShift][j + columnShift] = 0;
            }
        }
        return matrix;
    }
    

    getValueObjectArray = function(columnStart = 0, rowStart = 0, columnEnd, rowEnd) {

        rowStart = Math.max(0, rowStart - colAxis.dims);
        columnStart = Math.max(0, columnStart - rowAxis.dims);

        const rowArraySize = rowEnd - rowStart,
              columnArraySize = columnEnd - columnStart,
              table = createMatrix(rowArraySize, columnArraySize);

        for (var i = 0, y = rowStart; i < table.length; i++, y++) {
            for (var j = 0, x = columnStart, value, cell, totalIdComb; j < table[i].length; j++, x++) {

                // TODO: FIX THIS
                // if (doSortableColumnHeaders()) {
                //     totalIdComb = new ResponseRowIdCombination(['total', rowAxis.ids[y]]);
                //     // idValueMap[totalIdComb.get()] = false ? null : cellCounter['totalRowAllCells' + x];
                // }
                
                table[i][j] = getValueCell(x, y);
            }
        }

        if (doRowPercentage()) changeToRowPercentage(table);
        if (doColPercentage()) changeToColPercentage(table);

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
        if (!layout.filters) return;

        var text = layout.filters.getRecordNames(false, layout.getResponse(), true),
            row = new Array(1);

        row[0] = getTdHtml({
            type: 'filter',
            cls: 'pivot-filter cursor-default',
            colSpan: getTopBarSpan(span),
            title: text,
            htmlValue: text
        });

        return [row];
    };

    getTitle = function(span) {
        if (!layout.title) return;

        var text = layout.title,
            row = new Array(1);

        row[0] = getTdHtml({
            type: 'filter',
            cls: 'pivot-filter cursor-default',
            colSpan: getTopBarSpan(span),
            title: text,
            htmlValue: text,
        });

        return [row];
    };

    combineTable = function(rowAxisComb, colAxisComb, values) {
        const table = [];
        for (let i = 0; i < values.length; i++) {
            table.push(rowAxisComb[i].concat(values[i]));
        }
        return colAxisComb.concat(table);
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

    const getRowAxisCell = function(columnPosition, rowPosition, firstColumn = false) {

        if(isColumnSubTotal(y)) {
            if (firstRow) return createDimensionSubTotalCell('&nbsp;', rowAxis.dims - x, 1, true, false); 
            else          return createDimensionSubTotalCell('&nbsp;', rowAxis.dims - x, 1, true, true);
        }

        if(isColumnGrandTotal(y)) {
            if (firstRow) return createDimensionGrandTotalCell('Total', rowAxis.dims - x, 1, false, false);
            else          return createDimensionSubTotalCell('&nbsp;', rowAxis.dims - x, 1, true, true);
        }

        return createRowAxisCell(x, rowPos);
    }

    const createRowAxisCell = function(columnPosition, rowPosition) {
        
        let obj = clone(rowAxis.objects.all[columnPosition][rowPosition]);

        obj.type = 'dimension';
        obj.cls = 'pivot-dim td-nobreak' + (layout.showHierarchy ? ' align-left' : '');
        obj.noBreak = true;
        obj.width = doDynamicTableUpdate() ? cellWidth : null,
        obj.height = doDynamicTableUpdate() ? cellHeight : null,
        obj.htmlValue = response.getItemName(obj.id, layout.showHierarchy, true);
        obj.hidden = !(obj.rowSpan || obj.colSpan);

        return obj;
    }

    const getSingleRowAxisRow = function(y, columnStart) {
        const row = new Array(rowAxis.dims - columnStart);
        for(var i = 0, x = columnStart; x < rowAxis.dims; i++, x++) {
            row[i] = getRowAxisCell(x, getRowPosition(y), i===0);
        }
        return row;
    }

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

    const updateTable = function(columnStart, rowStart) {
        
        const numberOfHorizontalUpdates = Math.abs(columnStart - previousColumnStart),
              numberOfVerticalUpdates = Math.abs(rowStart - previousRowStart),
              columnEnd = getColumnEnd(columnStart),
              rowEnd = getRowEnd(rowStart);

        let prs = previousRowStart,
            pre = previousRowEnd,
            pcs = previousColumnStart,
            pce = previousColumnEnd;

        for(let i = 0; i < numberOfVerticalUpdates; i++) {
            if (rowStart < previousRowStart) {
                if (rowStart < prs) --prs;
                if (rowEnd < pre) --pre;
            } else {
                if (rowStart > prs) ++prs;
                if (rowEnd > pre) ++pre;
            }
            applyChangesToTable(pcs, pce, prs, pre);
        }

        for(let i = 0; i < numberOfHorizontalUpdates; i++) {
            if (columnStart < previousColumnStart) {
                if (columnStart < pcs) --pcs;
                if (columnEnd < pce) --pce
            } else {
                if (columnStart > pcs) ++pcs;
                if (columnEnd > pce) ++pce;
            }
            applyChangesToTable(pcs, pce, prs, pre);
        }

        let htmlArray = arrayClean([].concat(
            // options.skipTitle ? [] : getTitle(table[0].length) || [],
            // getFilterHtmlArray(table[0].length) || [],
            getTableHtml(currentTable)
        ));

        return getHtml(htmlArray);
    }

    const buildTable = function(columnStart, columnEnd, rowStart, rowEnd) {
        return combineTable(
            getRowAxisObjectArray(rowStart, rowEnd, columnStart),
            getColAxisObjectArray(columnStart, columnEnd, rowStart),
            getValueObjectArray(columnStart, rowStart, columnEnd, rowEnd)
        );
    }

    const getValueObjectRow = function(rowPosition, columnPosition, size) {
        const row = new Array(size);
        for(let i=0, x=columnPosition ; i < row.length; i++, x++) {
            row[i] = getValueCell(x, rowPosition);
        }
        return row;
    }

    const getValueObjectColumn = function(rowPosition, columnPosition, size) {
        const column = new Array(size);
        for(let i=0, y=rowPosition ; i < column.length; i++, y++) {
            column[i] = [getValueCell(columnPosition, y)];
        }
        return column;
    }

    const getTableRow = function(columnStart, columnEnd, rowIndex) {
        rowIndex = Math.max(0, rowIndex - colAxis.dims);
        columnStart = Math.max(0, columnStart - rowAxis.dims);

        let row = [];

        if (rowIndex < colAxis.dims) {
            row = row.concat(getColAxisObjectArray(columnStart, columnEnd, rowIndex)[0]);
        } else {
            if (columnStart < rowAxis.dims) row = row.concat(getSingleRowAxisRow(rowIndex, columnStart));
            row = row.concat(getValueObjectRow(rowIndex, columnStart, columnEnd - columnStart));
        }

        addHorizontalPaddingCellsToRow(row, columnStart, columnEnd);

        return row;
    };

    const getTableColumn = function(rowStart, rowEnd, columnIndex) { 

        if (columnIndex < rowAxis.dims) {
            return getColumnAxisColumn(columnIndex, rowStart).concat(getRowAxisColumn(rowStart, rowEnd, columnIndex));
        }

        const column = [];

        if (rowStart < colAxis.dims) {
            column.push(...getColAxisObjectArray(columnIndex, columnIndex + 1, rowStart));
        }

        column.push(...getValueObjectColumn(rowStart, Math.max(0, columnIndex - rowAxis.dims), rowEnd - rowStart));

        return column;
    };

    const updatePreviousPosition = function (columnStart, columnEnd, rowStart, rowEnd) {
        previousRowEnd = rowEnd;
        previousRowStart = rowStart;
        previousColumnEnd = columnEnd;
        previousColumnStart = columnStart;
    }

    const updateTablePadding = function(table, columnStart, columnEnd, rowStart, rowEnd) {
        const leftPadding   = getLeftPadding(columnStart),
              rightPaddings = getRightPadding(columnEnd),
              topPadding    = getTopPadding(rowStart),
              bottomPadding = getBottomPadding(rowEnd);

        // apply top pad
        table[0][0].width = topPad;
        table[0][0].hidden = topPad <= 0;

        // apply bottom pad
        table[table.length - 1][0].width = bottomPad;
        table[table.length - 1][0].hidden = bottomPad <= 0;

        for(var i=1; i < table.length - 1; i++) {
            // apply left pad
            table[i][0].width  = leftPad;
            table[i][0].hidden = leftPad <= 0;

            // apply right pad
            table[i][table[i].length - 1].width = rightPad;
            table[i][table[i].length - 1].hidden = rightPad <= 0;
        }
    }
    
    const updateColumnAxisColSpan = function(table, columnStart, rowStart, maxColSpan) {
        maxColSpan = table[1].length - 2;
        let skipping = 0;
        for (var i = rowStart; i < colAxis.dims; i++) {
            for (var j, x = columnStart, xd, currentColspan, colSpanCounter = 0, obj; j < table[i].length; j++, x++) {
                
                obj = table[i][j];

                if (obj.type === 'padding') continue; 

                if (skipping > 0) {
                    obj.hidden = true;
                }

                if (obj.type !== 'dimension') {
                    colSpanCounter += obj.colSpan;
                    skipping = obj.colSpan - 1;
                    continue;
                }
                
                xd = Math.max(0, x - rowAxis.dims);

                if (obj.oldestSibling) {
                    currentColspan = obj.oldestSibling.children - ((doRowSubTotals() ? xd -  Math.floor(xd / (colUniqueFactor + 1)) : xd) % obj.oldestSibling.children);
                } else {
                    currentColspan = obj.children;
                }

                if(colSpanCounter + currentColspan > maxColSpan && !obj.hidden) {
                    currentColspan = maxColSpan - colSpanCounter;
                }
                
                if(colSpanCounter !== maxColSpan && !obj.hidden) {
                    colSpanCounter += obj.colSpan ? obj.colSpan : 0;
                }

                obj.colSpan = currentColspan === 0 ? 1 : currentColspan

                skipping = obj.colSpan - 1;
            }
        }
    }

    const updateDimensionSpan = function() {

        let cell = null;

        // update colAxis colSpan
        for (let i=rowStart; i < colAxis.dims; i++) {
            for (let j=columnStart, colSpanCounter=0; j < getTableColumnSize(); j++) {

                cell = tabel[i][j];

                if (colSpanCounter === colSpanLimit) {
                    cell.hidden = true;
                }

                if (cell.colSpan + colSpanCounter > colSpanLimit) {
                    cell.colSpan = cell.colSpan + colSpanCounter - colSpanLimit;
                }

                colSpanCounter += cell.colSpan;
            }
        }

        // update rowAxis rowSpan
        for (let j=0; j < rowAxis.dims, j++) {
            for (let i=0, rowSpanCounter=0; i < getTableRowSize(); i++) {

                cell = tabel[i][j];

                if (rowSpanCounter === rowSpanLimit) {
                    cell.hidden = true;
                }

                if (cell.rowSpan - rowSpanCoutner > rowSpanLimit) {
                    cell.colSpan = cell.colSpan + colSpanCounter - colSpanLimit;
                }

                rowSpanCoutner += cell.rowSpan;
            }
        }








    }

    const applyChangesToTable = function(currentColumnStart, currentColumnEnd, currentRowStart, currentRowEnd) {

        if (previousColumnStart > currentColumnStart) {
            addColumnToLeftOfTable(currentRowStart, currentRowEnd, currentColumnStart);
        }

        if (previousColumnEnd < currentColumnEnd) {
            addColumnToRightOfTable(currentRowStart, currentRowEnd, currentColumnEnd + 1)
        }

        if (previousColumnStart < currentColumnStart) {
            removeColumnFromLeftOfTable(currentRowStart, currentRowEnd, currentColumnStart);
        } 

        if (previousColumnEnd > currentColumnEnd) {
            removeColumnFromRightOfTable();
        }

        if (previousRowStart > currentRowStart) {
            addRowToTopOfTable(currentColumnStart, currentColumnEnd, currentRowStart);
        }

        if (previousRowEnd < currentRowEnd) {
            addRowToBottomOfTable(currentColumnStart, currentColumnEnd, currentRowStart);
        }

        if (previousRowStart < currentRowStart) {
            removeRowFromStartOfTable();
        }

        if (previousRowEnd > currentRowEnd) {
            removeRowFromStartOfTable();
        }

        updateTablePadding(currentTable, currentColumnStart, currentColumnEnd, currentRowStart, currentRowEnd);
        // udpateTableDimesionSpan();

        // setCurrentPosition();

        updateColumnAxisColSpan(currentTable, currentColumnStart, currentRowStart, currentColumnEnd - currentColumnStart);
        // updateRowAxisRowSpan(currentTable, currentRowStart, currentColumnStart, currentRowEnd - currentRowStart);

        updatePreviousPosition(currentColumnStart, currentColumnEnd, currentRowStart, currentRowEnd);
    }

















    const addHorizontalPaddingCellsToRow = function (row, columnStart, columnEnd) {
        row.unshift(createCell(null, 'pivot-padding', 'padding', {width: getLeftPadding(columnStart), hidden: columnStart <= 0}));
        row.push(createCell(null, 'pivot-padding', 'padding', {width: getRightPadding(columnEnd), hidden: getRightPadding(columnEnd) <= 0}));
    }

    const addVerticalPaddingCells = function(table, rowStart, rowEnd, columnStart, columnEnd) {
        table.unshift([createCell(null, 'pivot-padding', 'padding', {height: getTopPadding(rowStart), colSpan: (columnEnd - columnStart) + 1, hidden: rowStart <= 0})]);
        table.push([createCell(null, 'pivot-padding', 'padding', {height: getBottomPadding(rowEnd), colSpan: (columnEnd - columnStart) + 1, hidden: true})]);
    }

    const addHorizontalPaddingCellsToTable = function (table, columnStart, columnEnd) {
        for (let i = 0; i < table.length; i++) {
            addHorizontalPaddingCellsToRow(table[i], columnStart, columnEnd);
        }
    }

    const addPaddingCells = function (table, columnStart, columnEnd, rowStart, rowEnd) {
        addHorizontalPaddingCellsToTable(table, columnStart, columnEnd);
        addVerticalPaddingCells(table, rowStart, rowEnd, columnStart, columnEnd);
    }

    renderTable = function(rowStart=0, columnStart=0) {

        // calculate end positions based on width/height and start positions
        let rowEnd = getRowEnd(rowStart),
            columnEnd = getColumnEnd(columnStart);

        // build initial state of table
        currentTable = buildTable(columnStart, columnEnd, rowStart, rowEnd);

        // add padding cells to each side of table
        addPaddingCells(currentTable, columnStart, columnEnd, rowStart, rowEnd);
        
        // update previous table positions
        updatePreviousPosition(columnStart, columnEnd, rowStart, rowEnd);

        // create html array
        let htmlArray = arrayClean([].concat(
            // options.skipTitle ? [] : getTitle(table[0].length) || [],
            // getFilterHtmlArray(table[0].length) || [],
            getTableHtml(currentTable)
        ));

        return getHtml(htmlArray);
    };

    // get html
    (function() {

        // setup lookup tables
        // valueTableLookup = createValueLookupTable();
        // typeTableLookup  = createTypeLookupTable();

        valueMatrix = createValueMatrix(getTableRowSize(), getTableColumnSize());
    }());

    // constructor
    t.dynamic = doDynamicTableUpdate();
    t.render = renderTable;
    t.update = updateTable;
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
