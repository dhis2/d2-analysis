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
import numberDecimals from 'd2-utilizr/lib/uuid';

import {ResponseRowIdCombination} from '../api/ResponseRowIdCombination';

export var PivotTable;

PivotTable = function(refs, layout, response, colAxis, rowAxis, options = {}) {

    console.log(response);

    var t = this;

    var { appManager, uiManager, dimensionConfig, optionConfig } = refs;

    var { ResponseRowIdCombination } = refs.api;

    var { unclickable } = options;

    options = options || {};

    // constant variables
    const cellWidth = 120,
          cellHeight = 25;

    // cell type enum
    const cellType = {
        'value':                        0,
        'value-row-subtotal':           1,
        'value-column-subtotal':        2,
        'value-row-total':              3,
        'value-column-total':           4,
        'value-intersect-subtotals':    5,
        'value-intersect-total':        6,
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
        transformColPercentage,
        transformRowPercentage,

        // cell creation
        createCell,

        // utils
        getValue,
        roundIf,
        recursiveReduce,
        getUniqueFactor,
        tableLogger,
        getTableColumnSize,
        getTableRowSize,
        createMatrix,
        createValueMatrix,
        createLookupTable,
        getHtmlValue,
        buildTable2D,

    // global variables

        // table info
        previousColumnStart,
        previousColumnEnd,
        previousRowStart,
        previousRowEnd,
        previousTopScrollPosition,
        previousLeftScrollPosition,
        currentStartColumn,
        currentEndColumn,
        currentStartRow,
        currentEndRow,
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
        valueLookup,
        typeLookup,

        // legend set
        legendSet = isObject(layout.legendSet) ? appManager.getLegendSetById(layout.legendSet.id) : null,
        legendDisplayStyle = layout.legendDisplayStyle,
        legendDisplayStrategy = layout.legendDisplayStrategy,

        // utils
        dimensionNameMap = dimensionConfig.getDimensionNameMap(),
        objectNameMap = dimensionConfig.getObjectNameMap(),
        idValueMap = response.getIdValueMap(layout),
        sortableIdObjects = [], //todo
        tdCount = 0,
        ignoreDimensionIds = ['dy'];

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
        for (let i = 0; i < yDimensionSize; i++) {
            table[i] = new Array(xDimensionSize).fill(fill);
        }
        return table;
    }

    const buildCornerColumnAxis = (x, rowStart) => {
        let column = new Array(colAxis.dims - x);

        for (let i=0; i < column.length; i++) {
            column[i] = getEmptyHtmlArray (rowStart++)[x];
        }

        return column;
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

    getHtmlValue = function(config, isValue) {
        if (config.collapsed) {
            return '';
        }

        var str = config.htmlValue,
            n = parseFloat(config.htmlValue);

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
    };

    getTdHtml = function(config, metaDataId) {
        var isNumeric = isObject(config) && isString(config.type) && config.type.substr(0,5) === 'value' && !config.empty;
        var isValue = isNumeric && config.type === 'value';
        var bgColor;
        var legends = [];

        // validation
        if (!isObject(config)) {
            return '';
        }

        if (config.hidden || config.collapsed) {
            return '';
        }

        // count number of cells
        tdCount = tdCount + 1;

        var attributes = [];
        var cls = [];
        var style = [];

        // html value
        var htmlValue = getHtmlValue(config, isValue);
        var ppHtmlValue = !arrayContains(['dimension', 'filter'], config.type) ? optionConfig.prettyPrint(htmlValue, layout.digitGroupSeparator) : htmlValue;

        // cls
        cls.push(...(config.cls ? config.cls.split(' ') : []));
        cls.push(config.hidden ? 'td-hidden' : null);
        cls.push(config.collapsed ? 'td-collapsed' : null);
        cls.push(isValue && !unclickable ? 'pointer' : null);
        cls.push(isString(config.sort) ? 'td-sortable' : null);

        if (isString(config.sort)) {
            sortableIdObjects.push({
                id: config.sort,
                uuid: config.uuid
            });
        }

        if (isValue) {
            var value = parseFloat(config.value);

            if (legendDisplayStrategy === optionConfig.getLegendDisplayStrategy('by_data_item').id) {
                if (config.dxId && response.metaData.items[config.dxId].legendSet) {
                    var legendSetId = response.metaData.items[config.dxId].legendSet,
                        _legendSet = appManager.getLegendSetById(legendSetId);

                    legends = _legendSet.legends;
                }
            } else {
                legends = legendSet ? legendSet.legends || [] : [];
            }

            for (var i = 0; i < legends.length; i++) {
                if (numberConstrain(value, legends[i].startValue, legends[i].endValue) === value) {
                    bgColor = legends[i].color;
                }
            }
        }

        if (legendDisplayStyle === optionConfig.getLegendDisplayStyle('fill').id) {
            if(bgColor) {
                var rgb = uiManager.hexToRgb(bgColor),
                    color = uiManager.isColorBright(rgb) ? 'black' : 'white';

                style.push(bgColor && isValue ? 'background-color:' + bgColor + '; color: ' + color + '; '  : '');
            } else {
                style.push(bgColor && isValue ? 'background-color:' + bgColor + '; ' : '');
            }
        }

        if (legendDisplayStyle === optionConfig.getLegendDisplayStyle('text').id) {
            style.push(bgColor && isValue ? 'color:' + bgColor + '; ' : '');
        }
        
        style.push(`min-width:${config.width}px!important;`);
        style.push(`min-height:${config.height}px!important;`);
        style.push(`max-width:${config.width}px!important;`);
        style.push(`max-height:${config.height}px!important;`);
        style.push(`width:${config.width}px!important;`);
        style.push(`height:${config.height}px!important;`);

        style.push(`white-space: nowrap!important;`);
        style.push(`overflow: hidden!important;`);
        style.push(`text-overflow: ellipsis!important;`);
        

        // attributes
        cls = arrayClean(cls);
        style = arrayClean(style);

        attributes.push('data-ou-id="' + (config.ouId || '') + '"');
        attributes.push('data-period-id="' + (config.peId || '') + '"');
        attributes.push(cls.length ? 'class="' + cls.join(' ') + '"' : null);
        attributes.push(style.length ? 'style="' + style.join(' ') + '"' : null);
        attributes.push(config.uuid ? 'id="' + config.uuid + '"' : null);
        attributes.push(config.colSpan ? 'colspan="' + config.colSpan + '"' : null);
        attributes.push(config.rowSpan ? 'rowSpan="' + config.rowSpan + '"' : null);
        attributes.push(config.title ? 'title="' + config.title + '"' : null);

        return '<td ' + arrayClean(attributes).join(' ') + '>' + ppHtmlValue + '</td>';
    };

    const setRenderSize = (numberOfRows, numberOfColumns) => {

    }

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

        if (!isNumber(n) || n != str) {
            return 0;
        }

        return n;
    };

    roundIf = function(number, precision) {
        number = parseFloat(number);
        precision = parseFloat(precision);

        if (isNumber(number) && isNumber(precision)) {
            var numberOfDecimals = numberDecimals(number);
            return numberOfDecimals > precision ? numberToFixed(number, precision) : number;
        }

        return number;
    };

        
    const gerResponseValue = function(y, x) {
        var empty = false,
            rric,
            responseValue,
            value;

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

    const isColumnSubTotalPosition = (x) => {
        return doColSubTotals() && (x + 1) % (colUniqueFactor + 1) === 0
    }

    const isColumnTotalPosition = (x) => {
        return doColTotals() && x === getTableColumnSize() - 1;
    }

    const isRowSubTotalPosition = (y) => {
        return doRowSubTotals() && (y + 1) % (rowUniqueFactor + 1) === 0
    }

    const isRowTotalPosition = (y) => {
        return doRowTotals() && y === getTableRowSize() - 1;
    }

    const nextSubColumnIndex = (x) => {
        return x + Math.floor(x / colUniqueFactor) + (colUniqueFactor - (x % colUniqueFactor));
    }

    const nextSubRowIndex = (y) => {
        return y + Math.floor(y / rowUniqueFactor) + (rowUniqueFactor - (y % rowUniqueFactor));
    }

    const nextTotalColumnIndex = () => {
        return getTableColumnSize() - 1;
    }

    const nextTotalRowIndex = () => {
        return getTableRowSize() - 1;
    }

    const createValueLookup = function(yDimensionSize, xDimensionSize) {
        const lookup = createLookupTable(xDimensionSize, yDimensionSize);
        for (var i=0, y=0; i < rowAxis.size; i++, y++) {
            if ((y + 1) % (rowUniqueFactor + 1) === 0) y++;
            for (var j=0, x=0, value; j < colAxis.size; j++, x++) {                
                if ((x + 1) % (colUniqueFactor + 1) === 0) x++;

                value = gerResponseValue(i, j);

                lookup[y][x] = value;

                // calculate sub totals
                if (doColSubTotals())                               lookup[y][nextSubColumnIndex(j)] += value;
                if (doRowSubTotals())                               lookup[nextSubRowIndex(i)][x]    += value;

                // calculate grand totals
                if (doColTotals())                                  lookup[y][nextTotalColumnIndex()] += value;
                if (doRowTotals())                                  lookup[nextTotalRowIndex()][x]    += value;
            }
        }
        return lookup;
    }

    const createTypeLookup = function(yDimensionSize, xDimensionSize) {
        const lookup = createLookupTable(xDimensionSize, yDimensionSize);
        for (var y = 0; y < yDimensionSize; y++) {
            for (var x = 0, type; x < xDimensionSize; x++) {

                // calculate sub totals
                if (isRowSubTotalPosition(y))                                lookup[y][x] = 1;
                if (isColumnSubTotalPosition(x))                             lookup[y][x] = 2;

                // calculate grand totals
                if (isRowTotalPosition(y))                                   lookup[y][x] = 3;
                if (isColumnTotalPosition(x))                                lookup[y][x] = 4;
                
                // calculate intersection totals
                if (isColumnSubTotalPosition(x) && isRowSubTotalPosition(y)) lookup[y][x] = 5;
                if (isColumnTotalPosition(x) && isRowTotalPosition(y))       lookup[y][x] = 6;
            }
        }
        return lookup;
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

    transformColPercentage = function(table) {
        for(var i = 0; i < table.length; i++) {
            for (var j = 0; j < table[i].length; j++) {
                if(!table[i][j].empty) {
                    table[i][j].htmlValue = getPercentageHtml(table[i][j].value, valueLookup[getTableRowSize() - 1][j]);
                }
            }
        }
    }

    transformRowPercentage = function(table) {
        for(var i = 0; i < table.length; i++) {
            for (var j = 0; j < table[i].length; j++) {
                if(!table[i][j].empty) {
                    table[i][j].htmlValue = getPercentageHtml(table[i][j].value, valueLookup[i][getTableColumnSize() - 1]);
                }    
            }
        }
    }

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

    const isColumnSubTotal = function(x) {
        return doRowSubTotals() && (x + 1) % (colUniqueFactor + 1) === 0;
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

    const getTopPadding = function() {
        return t.rowStart * cellHeight;
    }

    const getBottomPadding = function() {
        return (getTableRowSize() - t.rowEnd) * cellHeight;
    }

    const getLeftPadding = function() {
        return t.columnStart * cellWidth;
    }

    const getRightPadding = function() {
        return (getTableColumnSize() - t.columnEnd) * cellWidth;
    }

    const getRowEnd = function (rowStart) { 
        return Math.min(getTableRenderHeight() + rowStart, getTableRowSize() + colAxis.dims - 1);
    }

    const getColumnEnd = function (columnStart) { 
        return Math.min(getTableRenderWidth() + columnStart, getTableColumnSize() + rowAxis.dims - 1);
    }

    const appendColumn = (x, rowStart, rowEnd) => {
        let column = buildTableColumn(x, rowStart, rowEnd);
        for (var i = 0; i < column.length; i++) {
            currentTable[i + 1].splice(currentTable[i + 1].length - 1, 0, column[i]);
        }
    }

    const prependColumn = (x, rowStart, rowEnd) => {
        let column = buildTableColumn(x, rowStart, rowEnd);
        for (var i = 0; i < column.length; i++) {
            currentTable[i + 1].splice(1, 0, column[i]);
        }
    }

    const prependRow = (y, columnStart, columnEnd) => {
        let row = buildTableRow(y, columnStart, columnEnd);
        addRowPadding(row);
        currentTable.splice(1, 0, row);
    }

    const appendRow = (y, columnStart, columnEnd) => {
        let row = buildTableRow(y, columnStart, columnEnd);
        addRowPadding(row);
        currentTable.splice(currentTable.length - 1, 0, row);
    }

    const addRowPadding = (row) => {
        let leftPad   = getLeftPadding(),
            rightPad  = getRightPadding(),
            leftCell = createPaddingCell(getLeftPadding(), 25, 1, leftPad <= 0),
            rightCell = createPaddingCell(getRightPadding(), 25, 1, rightPad <= 0);

        row.push(rightCell);
        row.unshift(leftCell);
    }

    const deleteLeftColumn = (rowStart, rowEnd, columnIndex) => {
        deleteColumn(currentTable, 1, 1);
    }

    const deleteRightColumn = () => {
        deleteColumn(currentTable, currentTable[1].length - 2);
    }

    const deleteBottomRow = () => {
        deleteRow(currentTable, currentTable.length - 2);
    }

    const deleteTopRow = () => {
        deleteRow(currentTable, 1);
    }

    const deleteRow = function(table, rowIndex) {
        table.splice(rowIndex, 1);
    }

    const deleteColumn = function(table, columnIndex, quantity=1) {
        for (var i = 1; i < table.length - 1; i++) {
            table[i].splice(columnIndex, quantity);
        }
    }

    const getTableRenderWidth = function() {
        return Math.floor((document.body.clientWidth) / cellWidth);
    }

    const getTableRenderHeight = function() {
        return Math.floor(document.body.clientHeight / cellHeight);
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

    const createValueCell = function(value, columnIndex, rowIndex) {
        const rric  = new ResponseRowIdCombination(),
              _uuid = uuid(),
              uuids = [],
              cell = {},
              responseValue = gerResponseValue(columnIndex, rowIndex);
        
        rric.add(colAxis.type ? colAxis.ids[columnIndex] : '');
        rric.add(rowAxis.type ? rowAxis.ids[rowIndex] : '');

        // if (colAxis.type) uuids.push(...colAxis.objects.all[colAxis.dims - 1][columnIndex].uuids);
        // if (rowAxis.type) uuids.push(...rowAxis.objects.all[rowAxis.dims - 1][rowIndex].uuids);

        uuidDimUuidsMap[_uuid] = uuids;

        cell.value = value === -1 ? 0 : value;
        cell.htmlValue = value === -1 ? '&nbsp;' : value;
        cell.empty = value === -1;

        cell.uuid       = _uuid;
        cell.uuids      = uuids;
        cell.type       = 'value';
        cell.cls        = 'pivot-value' + (cell.empty ? ' cursor-default' : '');
        cell.dxId       = rric.getIdByIds(response.metaData.dimensions.dx);
        cell.peId       = rric.getIdByIds(response.metaData.dimensions.pe);
        cell.ouId       = rric.getIdByIds(response.metaData.dimensions.ou);

        return cell;
    }
    
    const getValueCell = function(x, y) {
        let value = valueLookup[y][x];
        switch(typeLookup[y][x]) {
            case 0: return createValueCell(value, y, x);
            case 1: case 2: case 5: return createSubTotalCell(value);
            case 3: case 4: case 6: return createGrandTotalCell(value);
            default: return null;;
        }
    }

    const createColumnAxisCell = function(columnPosition, rowPosition) {

        let obj = colAxis.objects.all[rowPosition][columnPosition];

        obj.type = 'dimension';
        obj.cls = 'pivot-dim';
        obj.sort = doSortableColumnHeaders() && rowPosition === colAxis.dims - 1 ? colAxis.ids[columnPosition] : null; 
        obj.noBreak = false;
        obj.hidden = !(obj.rowSpan || obj.colSpan);
        obj.width = doDynamicTableUpdate() ? cellWidth : null,
        obj.height = doDynamicTableUpdate() ? cellHeight : null,
        obj.htmlValue = response.getItemName(obj.id, layout.showHierarchy, true);
        obj.colSpan = obj.children ? obj.children - (columnPosition % obj.children) : 1;

        return obj;
    }

    const buildColumnAxisColumn = (x, rowStart) => {
        if (colAxis.dims < rowStart) return [];

        let column = new Array(colAxis.dims - rowStart);

        if (x < rowAxis.dims) {
            for (let i=0, y=rowStart; y < colAxis.dims; i++, y++) {
                if (i === 0) column[i] = createDimensionEmptyCell(rowAxis.dims - x, colAxis.dims - y, x !== t.columnStart);
                else         column[i] = createDimensionEmptyCell(rowAxis.dims - x, colAxis.dims - y, true);
            }
            return column;
        }

        x -= rowAxis.dims


        if (isColumnSubTotal(x)) {
            for (let i=0, y=rowStart; y < colAxis.dims; i++, y++) {
                if (i === 0) column[i] = createDimensionSubTotalCell('&nbsp;', 1, colAxis.dims - y, true, false);
                else         column[i] = createDimensionSubTotalCell('&nbsp;', 1, colAxis.dims - y, true, true);
            }
            return column;
        }

        if (isColumnGrandTotal(x)) {
            for (let i=0, y=rowStart; y < colAxis.dims; i++, y++) {
                if (i === 0) column[i] = createDimensionGrandTotalCell('Total', 1, colAxis.dims - y, true, true);
                else         column[i] = createDimensionSubTotalCell('&nbsp;', 1, colAxis.dims - y, true, true);
            }
            return column;
        }

        for (let i=0, y=rowStart; y < colAxis.dims; i++, y++) {
            let cell = createColumnAxisCell(Math.max(0, x - Math.floor((x + 1) / (colUniqueFactor + 1))), y);
            column[i] = cell;
        }

        return column;
    }
    
    const buildRowAxisColumn = (x, rowStart, rowEnd) => {
        if (rowAxis.dims < x) return [];

        let column = new Array(rowEnd - rowStart);

        for(var i = 0, y = rowStart; y < rowEnd; i++, y++) {

            if (isRowSubTotal(y)) {
                column[i] = createDimensionSubTotalCell('&nbsp;', rowAxis.dims - x, 1, true, t.columnStart !== x);
                continue;
            }

            if (isRowGrandTotal(y)) {
                if (t.columnStart === x) column[i] = createDimensionGrandTotalCell('Total', rowAxis.dims - x, 1, false, false);
                else                     column[i] = createDimensionSubTotalCell('&nbsp;', rowAxis.dims - x, 1, true, true);
                continue;
            }

            column[i] = createRowAxisCell(x, y - Math.floor(y / rowUniqueFactor));
        }

        return column;
    }

    const buildColumnAxisRow = (y, columnStart, columnEnd) => {
        if (colAxis.dims < y) return [];

        let row = new Array(columnEnd - columnStart),
            i = 0,
            x = columnStart;

        if (x < rowAxis.dims) {
            for (i, x; x < colAxis.dims; i++, x++) {
                if (i === 0) row[i] = createDimensionEmptyCell(rowAxis.dims - x, colAxis.dims - y, columnStart === t.columnStart);
                else         row[i] = createDimensionEmptyCell(rowAxis.dims - x, colAxis.dims - y, true);
            }
        }

        x -= rowAxis.dims;
        columnEnd -= rowAxis.dims;

        for(i, x; x < columnEnd; i++, x++) {

            if (isColumnSubTotal(x)) {
                if (i === 0) row[i] = createDimensionSubTotalCell('&nbsp;', 1, colAxis.dims - y, true, false);
                else         row[i] = createDimensionSubTotalCell('&nbsp;', 1, colAxis.dims - y, true, true);
                continue;
            }

            if (isColumnGrandTotal(x)) {
                if (i === 0) row[i] = createDimensionGrandTotalCell('Total', 1, colAxis.dims - y, true, false);
                else         row[i] = createDimensionSubTotalCell('&nbsp;', 1, colAxis.dims - y, true, true);
                continue
            }

            row[i] = createColumnAxisCell(x - Math.floor(x / colUniqueFactor), y);
        }

        // console.log(row);

        return row;
    }

    const buildRowAxisRow = (y, columnStart) => {
        if (rowAxis.dims < columnStart) return [];

        let row = new Array(rowAxis.dims - columnStart);

        if (isRowSubTotal(y)) {
            for (let i=0, x=columnStart; x < rowAxis.dims; i++, x++) {
                if (i === 0) row[i] = createDimensionSubTotalCell('&nbsp;', rowAxis.dims - x, 1, true, false);
                else         row[i] = createDimensionSubTotalCell('&nbsp;', rowAxis.dims - x, 1, true, true);
            }
            return row;
        }

        if (isRowGrandTotal(y)) {
            for (let i=0, x=columnStart; x < rowAxis.dims; i++, x++) {
                if (i === 0) row[i] = createDimensionGrandTotalCell('Total', rowAxis.dims - x, 1, false, false);
                else         row[i] = createDimensionSubTotalCell('&nbsp;', rowAxis.dims - x, 1, true, true);
            }
            return row;
        }

        y = Math.max(0, y - Math.floor(y / (rowUniqueFactor)));

        for(var i = 0, x = columnStart; x < rowAxis.dims; i++, x++) {
            row[i] = createRowAxisCell(x, y);
        }

        return row;
    }

    const buildRowAxis = (rowStart, rowEnd, columnStart) => {
        rowEnd -= colAxis.dims;

        let axis = new Array(rowEnd - rowStart);

        if(!rowAxis.type) {
            if (layout.showDimensionLabels) {
                axis[0] = [{ type: 'transparent', cls: 'pivot-transparent-row' }];
            }
            return axis;
        }
        
        for (let i=0,y=rowStart; y < rowEnd; i++, y++) {
            axis[i] = buildRowAxisRow(y, columnStart);
        }

        return axis;
    }

    const buildColumnAxis = (columnStart, columnEnd, rowStart) => {
        if (!colAxis.type) return getDimensionColArray();

        let axis = new Array(columnEnd - columnStart);

        for (let i=0,x=columnStart; x < columnEnd; i++, x++) {
            axis[i] = buildColumnAxisColumn(x, rowStart);
        }

        return axis;
    }

    buildTable2D = (rows, columns) => {
        let table2D = new Array(rows);
        
        for (let i=0; i < rows; i++) {
            table2D[i] = new Array(columns);
        }

        return table2D;
    } 

    const buildValueRow = (y, columnStart, columnEnd) => {
        let row = new Array(columnEnd - columnStart);

        for (let i=0, x=columnStart; x < columnEnd; i++, x++) {
            row[i] = getValueCell(x, y);
        }

        return row;
    }

    const buildValueColumn = (x, rowStart, rowEnd) => {

        let column = new Array(rowEnd - rowStart);
        
        for (let i=0, y=rowStart; y < rowEnd; i++, y++) {
            column[i] = getValueCell(x - Math.floor(x / rowUniqueFactor), y);
        }

        return column;
           
    }

    const buildTableColumn = (x, rowStart, rowEnd) => {
        
        let columnAxis = buildColumnAxisColumn(x, rowStart);
        
        if (x < rowAxis.dims) {
            return columnAxis.concat(buildRowAxisColumn(x, rowStart, rowEnd - colAxis.dims));
        }

        x -= rowAxis.dims;

        let valueTable = buildValueColumn(x, rowStart, rowEnd  - colAxis.dims);
        
        return columnAxis.concat(valueTable);
    };

    const buildTableRow = (y, columnStart, columnEnd) => { 
        if (y < colAxis.dims) {
            return buildColumnAxisRow(y, columnStart, columnEnd);
        }

        y -= colAxis.dims;

        if (columnStart < rowAxis.dims) columnEnd -= (rowAxis.dims - columnStart);

        let rowAxisRow = buildRowAxisRow(y, columnStart),
            valueTable = buildValueRow(y, columnStart, columnEnd),
            row = rowAxisRow.concat(valueTable);

        return row;
    };

    const buildValueTable = function(rowStart, rowEnd, columnStart, columnEnd) {
        rowEnd    -= colAxis.dims;
        columnEnd -= rowAxis.dims;

        let table = buildTable2D(rowEnd - rowStart + 1, columnEnd - columnStart);

        for (let i=0, y=rowStart; i < table.length; i++, y++) {
            for (let j=0, x=columnStart; j < table[i].length; j++, x++) {
                // TODO: FIX THIS
                // if (doSortableColumnHeaders()) {
                //     totalIdComb = new ResponseRowIdCombination(['total', rowAxis.ids[y]]);
                //     // idValueMap[totalIdComb.get()] = false ? null : cellCounter['totalRowAllCells' + x];
                // }

                table[i][j] = getValueCell(x, y);
            }
        }
        
        if (doRowPercentage()) transformRowPercentage(table);
        if (doColPercentage()) transformColPercentage(table);

        return table;
    }

    const buildTable = (rowStart, rowEnd, columnStart, columnEnd) => {
        let rowAxis = buildRowAxis(rowStart, rowEnd, columnStart),
            colAxis = buildColumnAxis(columnStart, columnEnd, rowStart),
            values = buildValueTable(rowStart, rowEnd, columnStart, columnEnd);

        for (let i = 0; i < rowAxis.length; i++) {
            rowAxis[i].push(...values[i]);
        }
        
        return toRow(colAxis).concat(rowAxis);
    }

    const createPaddingCell = (width, height, colSpan=1, hidden=true) => {
        return createCell(null, 'pivot-padding', 'padding', {height: height, width: width, colSpan: colSpan, hidden: hidden})
    };

    const addPaddingCells = (table, columnStart, columnEnd, rowStart, rowEnd) => {

        let leftCell = createPaddingCell(getLeftPadding(), 25),
            rightCell = createPaddingCell(getRightPadding(), 25, 1, false),
            topCell = createPaddingCell(120, getTopPadding(), (columnEnd - columnStart) + 1),
            bottomCell = createPaddingCell(120, getBottomPadding(), (columnEnd - columnStart) + 1, true);

        for (let i=0; i < table.length; i++) {
            table[i].push(rightCell);
            table[i].unshift(leftCell);
        }

        table.push([bottomCell]);
        table.unshift([topCell]);
    }

    const updatePaddingCells = () => {
        const leftPad   = getLeftPadding(),
              rightPad  = getRightPadding(),
              topPad    = getTopPadding(),
              bottomPad = getBottomPadding();

        // apply top pad
        currentTable[0][0].height = topPad;
        currentTable[0][0].hidden = topPad <= 0;

        // apply bottom pad
        currentTable[currentTable.length - 1][0].height = bottomPad;
        currentTable[currentTable.length - 1][0].hidden = bottomPad <= 0;

        for (let i=1; i < currentTable.length - 1; i++) {
            // apply left pad
            currentTable[i][0].width  = leftPad;
            currentTable[i][0].hidden = leftPad <= 0;

            // apply right pad
            currentTable[i][currentTable[i].length - 1].width = rightPad;
            currentTable[i][currentTable[i].length - 1].hidden = rightPad <= 0;
        }
    }

    const toRow = (array) => {
        let row = new Array(array[0].length);

        for(let i=0; i < row.length; i++) {
            row[i] = [];
        }

        for (let i=0; i < array.length; i++) {
            for (let j=0; j < array[i].length; j++) {
                row[j].push(array[i][j]);
            }
        }
        return row;
    }

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

    const createRowAxisCell = function(columnPosition, rowPosition) {
        
        let obj = rowAxis.objects.all[columnPosition][rowPosition];

        obj.type = 'dimension';
        obj.cls = 'pivot-dim td-nobreak' + (layout.showHierarchy ? ' align-left' : '');
        obj.noBreak = true;
        obj.width = doDynamicTableUpdate() ? cellWidth : null,
        obj.height = doDynamicTableUpdate() ? cellHeight : null,
        obj.htmlValue = response.getItemName(obj.id, layout.showHierarchy, true);
        obj.hidden = !(obj.rowSpan || obj.colSpan);
        // obj.rowSpan = obj.children ? obj.children - (rowPosition % obj.children) : 1;

        return obj;
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

        const columnEnd = getColumnEnd(columnStart),
              rowEnd = getRowEnd(rowStart),
              numberOfVerticalUpdates = Math.abs(rowStart - t.rowStart),
              numberOfHorizontalUpdatres = Math.abs(columnStart - t.columnStart);


        for (let i = 0; i < numberOfVerticalUpdates; i++) {
            applyChangesToTable(columnStart, columnEnd, rowStart, rowEnd);
        }

        for (let i = 0; i < numberOfHorizontalUpdatres; i++) {
            applyChangesToTable(columnStart, columnEnd, rowStart, rowEnd);
        }

        let htmlArray = arrayClean([].concat(
            // options.skipTitle ? [] : getTitle(table[0].length) || [],
            // getFilterHtmlArray(table[0].length) || [],
            getTableHtml(currentTable)
        ));

        return getHtml(htmlArray);
    }

    const updateRowAxisDimensionSpan = () => {
        let rowSpanLimit = t.rowEnd - t.rowStart,
            yStart = Math.max(0, t.rowStart - colAxis.dims) -  Math.floor(Math.max(0, t.rowStart - colAxis.dims) / rowUniqueFactor),
            rowSpanValue = 0,
            cell;

        for (let i=1; i < colAxis.dims - t.columnStart + 1; i++) {
            for (let j=1, y=yStart, rowSpanCounter=0; j < rowSpanLimit; j++) {

                cell = currentTable[j][i];
                cell.hidden = true;

                switch (cell.type) {
                    case 'empty': {
                        rowSpanValue = 1;
                    } break;
                    
                    case 'dimension': {
                        cell.rowSpan = cell.children  ? cell.children - (y % cell.children) : 1;
                        cell.hidden =  !cell.children ? false : cell.children !== cell.rowSpan;
                        rowSpanValue = cell.hidden    ? 0 : cell.rowSpan;
                        if(i === 1) console.log(cell.rowSpan, cell.hidden);
                        y++;
                    } break;
                    
                    case 'dimensionSubtotal': 
                    case 'valueTotalSubgrandtotal': {
                        cell.hidden = i !== 1;
                        rowSpanValue = 1;
                    } break;
                    default: continue;
                }

                if  (j === 1 && i !== rowAxis.dims) {
                    cell.hidden = false;
                }

                if (rowSpanCounter >= rowSpanLimit) {
                    cell.hidden = true;
                    continue;
                }

                if (rowSpanValue + rowSpanCounter > rowSpanLimit) {
                    cell.rowSpan = rowSpanLimit - rowSpanCounter;
                    rowSpanValue = cell.rowSpan;
                }

                rowSpanCounter += rowSpanValue;
            }
        }
    }

    const updateColumnAxisDimensionSpan = () => {

        let colSpanLimit = t.columnEnd - t.columnStart,
            xStart = Math.max(0, t.columnStart - rowAxis.dims) -  Math.floor(Math.max(0, t.columnStart - rowAxis.dims) / colUniqueFactor),
            colSpanValue = 0,
            cell;

        for (let i=1; i < rowAxis.dims - t.rowStart + 1; i++) {
            for (let j=1, x=xStart, colSpanCounter=0; j < currentTable[i].length - 1; j++) {

                cell = currentTable[i][j];
                cell.hidden = true;

                switch (cell.type) {
                    case 'empty': {
                        colSpanValue = 1;
                    } break;
                    
                    case 'dimension': {
                        cell.colSpan = cell.children ? cell.children - (x % cell.children) : 1;
                        cell.hidden =  cell.children ? cell.children !== cell.colSpan : false;
                        colSpanValue = cell.hidden   ? 0 : cell.colSpan;
                        x++;
                    } break;
                    
                    case 'dimensionSubtotal': 
                    case 'valueTotalSubgrandtotal': {
                        cell.hidden = i !== 1;
                        colSpanValue = 1;
                    } break;
                    default: continue;
                }

                if  (j === 1 && i !== colAxis.dims) {
                    cell.hidden = false;
                }

                if (colSpanCounter >= colSpanLimit) {
                    cell.hidden = true;
                    continue;
                }

                if (colSpanValue + colSpanCounter > colSpanLimit) {
                    cell.colSpan = colSpanLimit - colSpanCounter;
                    colSpanValue = cell.colSpan;
                }

                colSpanCounter += colSpanValue;

                // if (cell.type === "dimension") console.log(i, j, cell.htmlValue, cell.children, x, cell.colSpan, cell.hidden);
            }
        }
    }

    const applyChangesToTable = function(columnStart, columnEnd, rowStart, rowEnd) {

        if (t.columnStart > columnStart) {
            t.columnStart--;
            prependColumn(t.columnStart, t.rowStart, t.rowEnd);
        }

        if (t.columnEnd < columnEnd) {
            t.columnEnd++;
            appendColumn(t.columnEnd, t.rowStart, t.rowEnd);
        }

        if (t.rowStart > rowStart) {
            t.rowStart--;
            prependRow(t.rowStart, t.columnStart, t.columnEnd);
        }

        if (t.rowEnd < rowEnd) {
            t.rowEnd++;
            appendRow(t.rowEnd, t.columnStart, t.columnEnd);
        }

        if (t.rowStart < rowStart) {
            t.rowStart++;
            deleteTopRow();
        }

        if (t.rowEnd > rowEnd) {
            t.rowEnd--;
            deleteBottomRow();
        }
        
        if (t.columnStart < columnStart) {
            t.columnStart++;
            deleteLeftColumn();
        } 

        if (t.columnEnd > columnEnd) {
            t.columnEnd--;
            deleteRightColumn();
        }

        updatePaddingCells();

        updateColumnAxisDimensionSpan();
        updateRowAxisDimensionSpan();

        // console.log(currentTable);
    }

    renderTable = function(rowStart=0, columnStart=0) {

        t.columnStart = columnStart;
        t.columnEnd = getColumnEnd(columnStart);

        t.rowStart = rowStart;
        t.rowEnd = getRowEnd(rowStart);

        // console.log(t.rowStart, t.rowEnd, t.columnStart, t.columnEnd);

        // build initial state of table
        currentTable = buildTable(t.rowStart, t.rowEnd, t.columnStart, t.columnEnd);

        // add padding cells to each side of table
        addPaddingCells(currentTable, t.columnStart, t.columnEnd, t.rowStart, t.rowEnd);
        
        updateColumnAxisDimensionSpan();
        updateRowAxisDimensionSpan();

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
        valueLookup = createValueLookup(getTableRowSize(), getTableColumnSize());
        typeLookup  = createTypeLookup(getTableRowSize(), getTableColumnSize());
    }());

    // constructor
    t.html = renderTable();
    t.render = renderTable;
    t.update = updateTable;
    t.uuidDimUuidsMap = uuidDimUuidsMap;
    t.sortableIdObjects = sortableIdObjects;

    t.isDynamic = doDynamicTableUpdate();
    t.idValueMap = idValueMap;
    t.tdCount = tdCount;
    t.layout = layout;
    t.response = response;
    t.colAxis = colAxis;
    t.rowAxis = rowAxis;
};

PivotTable.prototype.getUuidObjectMap = function() {
    return objectApplyIf((this.colAxis ? this.colAxis.uuidObjectMap || {} : {}), (this.rowAxis ? this.rowAxis.uuidObjectMap || {} : {}));
};
