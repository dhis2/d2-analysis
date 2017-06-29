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

import { ResponseRowIdCombination } from '../api/ResponseRowIdCombination';

import { toRow,
         deleteRow,
         deleteColumn } from './PivotTableUtils';

import { ValueSubTotalCell,
         ValueGrandTotalCell,
         RowAxisCell,
         ColumnAxisCell,
         DimensionSubTotalCell,
         DimensionGrandTotalCell,
         DimensionEmptyCell,
         DimensionLabelCell,
         PaddingCell } from './PivotTableCells';


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
    let currentTable,
        getEmptyHtmlArray,
        getRoundedHtmlValue,
        getTdHtml,
        buildHtmlRows,
        getTopBarSpan,
        getFilterHtmlArray,
        buildHtmlTable,
        renderTable,

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

        // table transformations
        hideEmptyColumns,
        hideEmptyRows,
        transformColPercentage,
        transformRowPercentage,

        // utils
        getValue,
        roundIf,
        recursiveReduce,
        getUniqueFactor,
        getTableColumnSize,
        getTableRowSize,
        getHtmlValue,

    // global variables
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
        return layout.numberType === optionConfig.getNumberType().percentofcolumn.id;
    };

    doRowPercentage = function() {
        return layout.numberType === optionConfig.getNumberType().percentofrow.id;
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
    };

    doDynamicTableUpdate = function() {
        return true;
    };

    /** @description
     *  @param   {any} xAxis 
     *  @returns {number}
     */
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

    /** @description collapses parents of given object.
     *  @param {object} obj 
     */
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

    /** @description returns the rounded value of the given float.
     *  @param   {number} value 
     *  @param   {number} [dec=2] 
     *  @returns {number}
     */
    getRoundedHtmlValue = function(value, dec=2) {
        return parseFloat(roundIf(value, 2)).toString();
    };

    /** @description get percentage representation of value.
     *  @param   {number} value 
     *  @param   {number} total 
     *  @returns {string}
     */
    const getPercentageHtml = (value, total) => {
        return getRoundedHtmlValue((value / total) * 100) + '%';
    };
    
    /** @description returns the size of the column axis not including the corner cell.
     *  @returns {number}
     */
    getTableColumnSize = function() {
        let size = colAxis.size;
        if (doRowSubTotals()) size += colAxis.size / colUniqueFactor;
        if (doRowTotals()) size += 1;
        return size;
    };

    /** @description returns the size of the row axis not including the corner cell.
     *  @returns {number}
     */
    getTableRowSize = function() {
        let size = rowAxis.size;
        if (doColSubTotals()) size += rowAxis.size / rowUniqueFactor;
        if (doColTotals()) size += 1;
        return size;
    };

    /** @description
     *  @param   {number} columnIndex 
     *  @param   {number} rowStart 
     *  @returns {array} 
     */
    const buildCornerColumnAxis = (columnIndex, rowStart) => {
        let column = new Array(colAxis.dims - columnIndex);

        for (let i=0; i < column.length; i++) {
            column[i] = getEmptyHtmlArray(rowStart++)[columnIndex];
        }

        return column;
    };

    /** @description
     *  @param   {number} i 
     *  @returns {array}
     */
    getEmptyHtmlArray = function(i) {
        var html = [],
            isIntersectionCell = i < colAxis.dims - 1;

        if (rowAxis.type && rowAxis.dims) {
            for (var j = 0; j < rowAxis.dims - 1; j++) {
                html.push(DimensionLabelCell(!isIntersectionCell ? response.getNameById(rowDimensionNames[j]) : '',));
            }
        }
        
        var cellValue = isIntersectionCell ? response.getNameById(columnDimensionNames[i]) :
                response.getNameById(rowDimensionNames[j]) + 
                (colAxis.type && rowAxis.type ? '&nbsp;/&nbsp;' : '') + 
                response.getNameById(columnDimensionNames[i]);

        html.push(DimensionLabelCell(cellValue));

        return html;
    };


    const buildCornerAxisRow = (rowIndex, columnStart) => {
        const cornerAxis = [];

        for (let i=0,; x < rowAxis.dims - columnStart; i++) {
            cornerAxis[i] = DimensionLabelCell(response.getNameById(rowDimensionNames[i]))
        }

        return cornerAxis;
    };

    const buildCornerAxisColumn = (columnIndex, rowStart) => {
        const cornerAxis = [];

        for (let i=0; y < colAxis.dims - rowStart; i++) {
            cornerAxis[i] = DimensionLabelCell(response.getNameById(rowDimensionNames[i]))
        }

        return cornerAxis;
    }

    const buildCornerAxis = () => {
        const cornerAxis = [];

        return cornerAxis;
    }

    const getDimensionColArray = function() {
        const dimensionColArray = [];
        // show row dimension labels
        if (rowAxis.type && layout.showDimensionLabels) {
            dimensionColArray[i] = new Array(rowDimensionNames.length);
            // colAxisArray from row object names
            for (var i = 0; i < rowDimensionNames.length; i++) {
                dimensionColArray[i][j] = DimensionLabelCell(response.getNameById(rowDimensionNames[i]));
            }
        }
        return dimensionColArray;
    };

    /** @description gets the html value of given object.
     *  @param   {object} config 
     *  @param   {bool} isValue 
     *  @returns {string}
     */
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
    
    /** @description Builds a 2D array with the given dimensions
     *  @param   {number} rows
     *  @param   {number} columns
     *  @returns {array}  
     */ 
    const buildTable2D = (rows, columns, fill) => {
        let table2D = new Array(rows);
        
        for (let i=0; i < rows; i++) {
            table2D[i] = new Array(columns);
            if (typeof fill !== 'undefined') table2D[i].fill(fill);
        }

        return table2D;
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

    /** @description gets integer representation of given string.
     *  @param   {string} str 
     *  @returns {number}
     */
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

    /** @description round number if needed.
     *  @param   {number} number 
     *  @param   {number} precision 
     *  @returns {number}
     */
    roundIf = function(number, precision) {
        number = parseFloat(number);
        precision = parseFloat(precision);

        if (isNumber(number) && isNumber(precision)) {
            var numberOfDecimals = getNumberOfDecimals(number);
            return numberOfDecimals > precision ? numberToFixed(number, precision) : number;
        }

        return number;
    };

    /** @description
     *  @param {number} number 
     *  @returns {number}
     */
    const getNumberOfDecimals = (number) => {
        var str = new String(number);
        return (str.indexOf('.') > -1) ? (str.length - str.indexOf('.') - 1) : 0;
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
    };

    const createValueLookup = function(yDimensionSize, xDimensionSize) {

        const lookup = buildTable2D(yDimensionSize, xDimensionSize, 0);

        for (var i=0, y=0; i < rowAxis.size; i++, y++) {

            if (doColSubTotals() && (y + 1) % (rowUniqueFactor + 1) === 0) y++;

            for (var j=0, x=0, value; j < colAxis.size; j++, x++) {

                if (doRowSubTotals() && (x + 1) % (colUniqueFactor + 1) === 0) x++;

                value = gerResponseValue(i, j);

                lookup[y][x] = value;

                // calculate sub totals
                if (doColSubTotals())                     lookup[nextSubRowIndex(i)][x]     += value;
                if (doRowSubTotals())                     lookup[y][nextSubColumnIndex(j)]  += value;

                // calculate grand totals
                if (doColTotals())                        lookup[nextTotalRowIndex()][x]    += value;
                if (doRowTotals())                        lookup[y][nextTotalColumnIndex()] += value;

                // calculate intersection totals
                if (doRowTotals() && doColTotals())       lookup[nextTotalRowIndex()][nextTotalColumnIndex()] += value;
                if (doColSubTotals() && doRowSubTotals()) lookup[nextSubRowIndex(i)][nextSubColumnIndex(j)]   += value;

                if (doRowTotals() && doRowSubTotals())    lookup[nextTotalRowIndex()][nextSubColumnIndex(j)]  += value;
                if (doColSubTotals() && doColTotals())    lookup[nextSubRowIndex(i)][nextTotalColumnIndex()]  += value;

            }
        }
        return lookup;
    };

    const createTypeLookup = function(yDimensionSize, xDimensionSize) {
        const lookup = buildTable2D(yDimensionSize, xDimensionSize, 0);
        for (var y = 0; y < yDimensionSize; y++) {
            for (var x = 0, type; x < xDimensionSize; x++) {

                // calculate sub totals
                if (isRowSubTotal(y))                                  lookup[y][x] = 1;
                if (isColumnSubTotal(x))                               lookup[y][x] = 2;

                // calculate grand totals
                if (isRowGrandTotal(y))                                lookup[y][x] = 3;
                if (isColumnGrandTotal(x))                             lookup[y][x] = 4;
                
                // calculate intersection totals
                if (isColumnSubTotal(x) && isRowSubTotal(y))           lookup[y][x] = 5;
                if (isColumnGrandTotal(x) && isRowGrandTotal(y))       lookup[y][x] = 6;
            }
        }
        return lookup;
    };

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
    };
    
    /** @description 
     *  @param {number} columnIndex 
     *  @param {number} rowIndex 
     *  @returns {object}
     */
    const getValueCell = (columnIndex, rowIndex) => {

        let value = valueLookup[rowIndex][columnIndex];
        switch(typeLookup[rowIndex][columnIndex]) {
            case 0:                 return createValueCell(value, rowIndex, columnIndex);
            case 1: case 2: case 5: return ValueSubTotalCell(value);
            case 3: case 4: case 6: return ValueGrandTotalCell(value);
            default: return null;;
        }
    };

    /** @description hides emprt columns in table
     *  @param {array} table 
     */
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
    };

    /** @description hides emprt rows in table
     *  @param {array} table 
     */
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
    };

    /** @description transforms values in columns to percentages.
     *  @param {array} table 
     */
    transformColPercentage = function(table) {
        for(var i = 0; i < table.length; i++) {
            for (var j = 0; j < table[i].length; j++) {
                if(!table[i][j].empty) {
                    table[i][j].htmlValue = getPercentageHtml(table[i][j].value, valueLookup[getTableRowSize() - 1][j]);
                }
                if (valueLookup[getTableRowSize() - 1][j] === 0) {
                    table[i][j].empty = true;
                    table[i][j].htmlValue = '&nbsp;';
                }
            }
        }
    };

    /** @description transforms values in rows to percentages.
     *  @param {array} table 
     */
    transformRowPercentage = function(table) {
        for(var i = 0; i < table.length; i++) {
            for (var j = 0; j < table[i].length; j++) {
                if (!table[i][j].empty) {
                    table[i][j].htmlValue = getPercentageHtml(table[i][j].value, valueLookup[i][getTableColumnSize() - 1]);
                }
                if (valueLookup[i][getTableColumnSize() - 1] === 0) {
                    table[i][j].empty = true;
                    table[i][j].htmlValue = '&nbsp;';
                }
            }
        }
    };

    /** @description gets the index of the next column sub total from the given column index.
     *  @param   {number} columnIndex 
     *  @returns {number}
     */
    const nextSubColumnIndex = (columnIndex) => {
        return columnIndex + Math.floor(columnIndex / colUniqueFactor) + (colUniqueFactor - (columnIndex % colUniqueFactor));
    };

    /** @description gets the index of the next row sub total from the given row index.
     *  @param   {number} rowIndex 
     *  @returns {number}
     */
    const nextSubRowIndex = (rowIndex) => {
        return rowIndex + Math.floor(rowIndex / (rowUniqueFactor)) + (rowUniqueFactor - (rowIndex % rowUniqueFactor));
    };

    /** @description gets the next column grand total cell.
     *  @returns {number}
     */
    const nextTotalColumnIndex = () => {
        return getTableColumnSize() - 1;
    };

    /** @description gets the next row grand total cell.
     *  @returns {number}
     */
    const nextTotalRowIndex = () => {
        return getTableRowSize() - 1;
    };

    /** @description checks if the cell at the given column index is a column sub total cell.
     *  @param {number} columnIndex 
     *  @returns {bool}
     */
    const isColumnSubTotal = (columnIndex) => {
        return doRowSubTotals() && (columnIndex + 1) % (colUniqueFactor + 1) === 0;
    };

    /** @description checks if the cell at the given column index is a column total cell.
     *  @param {number} columnPosition 
     *  @returns {bool}
     */
    const isColumnGrandTotal = (columnIndex) => {
        return doRowTotals() && columnIndex === getTableColumnSize() - 1;
    };

    /** @description checks if the cell at the given row index is a row sub total cell.
     *  @param {number} rowIndex 
     *  @returns {bool}
     */
    const isRowSubTotal = (rowIndex) => {
        return doColSubTotals() && (rowIndex + 1) % (rowUniqueFactor + 1) === 0;
    };

    /** @description checks if the cell at the given row index is a row total cell.
     *  @param {nubmer} rowIndex 
     *  @returns {bool}
     */
    const isRowGrandTotal = (rowIndex) => {
        return doColTotals() && rowIndex === getTableRowSize() - 1;
    };

    /** @description checks if given row index is empty.
     *  @param   {any} rowIndex 
     *  @returns {bool}
     */
    const isRowEmpty = (rowIndex) => {
        return valueLookup[rowIndex][getTableColumnSize() - 1] === 0;
    };

    /** @description checks if given column index is empty.
     *  @param   {any} columnIndex 
     *  @returns {bool}
     */
    const isColumnEmpty = (columnIndex) => {
        return valueLookup[getTableRowSize() - 1][columnIndex] === 0;
    };

    /** @description finds the last row to render based on the start row and table render size.
     *  @param {number} rowStart 
     *  @returns {number}
     */
    const getRowEnd = (rowStart) => { 
        return Math.min(getTableRenderHeight() + rowStart, getTableRowSize() + colAxis.dims - 1);
    };

    /** @description finds the last column to render based on the start column and table render size.
     *  @param {number} columnStart 
     *  @returns {number} 
     */
    const getColumnEnd = (columnStart) => { 
        return Math.min(getTableRenderWidth() + columnStart, getTableColumnSize() + rowAxis.dims - 1);
    };

    /** @description gets the total sum of all cells in given column index.
     *  @param   {any} columnIndex 
     *  @returns {number}
     */
    const getColumnTotal = (columnIndex) => {
        return valueLookup[getTableRowSize() - 1][columnIndex]; 
    };

    /** @description gets the total sum of all cells in given row index.
     *  @param   {any} rowIndex 
     *  @returns {number}
     */
    const getRowTotal = (rowIndex) => {
        return valueLookup[rowIndex][getTableColumnSize() - 1];
    };

    /** @description
     *  @returns {number}
     */
    const getTopPadding = () => {
        return t.rowStart * cellHeight;
    };

    /** @description
     *  @returns {number}
     */
    const getLeftPadding = () => {
        return t.columnStart * cellWidth;
    };

    /** @description
     *  @returns {number}
     */
    const getBottomPadding = () => {
        return (getTableRowSize() - t.rowEnd) * cellHeight;
    };

    /** @description
     *  @returns {number}
     */
    const getRightPadding = () => {
        return (getTableColumnSize() - t.columnEnd) * cellWidth;
    };

    /** @description
     *  @param   {number} span 
     *  @returns {number}
     */
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

     /** @description gets the number of horizontal cells that can be rendered within the current window size.
     *  @returns {number}
     */
    const getTableRenderWidth = () => {
        return Math.floor(t.renderWidth / cellWidth) + 1;
    };

    /** @description get the number of vertical cells that can be rendered within the current window size.
     *  @returns {number}
     */
    const getTableRenderHeight = () => {
        return Math.floor(t.renderHeight / cellHeight) + 1;
    };

    /** @description sets the width of current render area in pixels.
     *  @param {number} widthInPixels 
     */
    const setWindowRenderWidth = (widthInPixels) => {
        t.renderWidth = widthInPixels;
    };

    /** @description sets the height of current render area in pixels.
     *  @param {number} heightInPixels 
     */
    const setWindowRenderHeight = (heightInPixels) => {
        t.renderHeight = heightInPixels;
    };

    /** @description places a new column at the right side of the table.
     *  @param {number} columnIndex
     *  @param {number} rowStart 
     *  @param {number} rowEnd 
     */
    const appendColumn = (columnIndex, rowStart, rowEnd) => {
        let column = buildTableColumn(columnIndex, rowStart, rowEnd);
        for (var i = 1; i < column.length + 1; i++) {
            currentTable[i].splice(currentTable[i].length - 1, 0, column[i - 1]);
        }
    };

    /** @description places a new column at the left side of the table.
     *  @param {number} columnIndex 
     *  @param {number} rowStart 
     *  @param {number} rowEnd 
     */
    const prependColumn = (columnIndex, rowStart, rowEnd) => {
        let column = buildTableColumn(columnIndex, rowStart, rowEnd);
        for (var i = 1; i < column.length + 1; i++) {
            currentTable[i].splice(1, 0, column[i - 1]);
        }
    };

    /** @description places a new row at the top of the table.
     *  @param {number} rowIndex 
     *  @param {number} columnStart 
     *  @param {number} columnEnd 
     */
    const prependRow = (rowIndex, columnStart, columnEnd) => {
        let row = buildTableRow(rowIndex, columnStart, columnEnd);
        addRowPaddingToRow(row);
        currentTable.splice(1, 0, row);
    };

    /** @description places a new row at the bottom of the table.
     *  @param {number} rowIndex 
     *  @param {number} columnStart 
     *  @param {number} columnEnd 
     */
    const appendRow = (rowIndex, columnStart, columnEnd) => {
        let row = buildTableRow(rowIndex, columnStart, columnEnd);
        addRowPaddingToRow(row);
        currentTable.splice(currentTable.length - 1, 0, row);
    };

    /** @description adds padding cells to given row.
     *  @param {any} row 
     */
    const addRowPaddingToRow = (row) => {
        let leftPad   = getLeftPadding(),
            rightPad  = getRightPadding(),
            leftCell  = PaddingCell(getLeftPadding(), 25, 1, 1, leftPad <= 0),
            rightCell = PaddingCell(getRightPadding(), 25, 1, 1, rightPad <= 0);

        row.push(rightCell);
        row.unshift(leftCell);
    };

    /** @description removes a column from the left side of the table
     */
    const deleteLeftColumn = () => {
        deleteColumn(currentTable, 1, 1);
    };

    /** @description removes a column from the right side of the table
     */
    const deleteRightColumn = () => {
        deleteColumn(currentTable, currentTable[1].length - 2);
    };

    /** @description removes a column from the bottom of the table
     */
    const deleteBottomRow = () => {
        deleteRow(currentTable, currentTable.length - 2);
    };

    /** @description removes a column from the top of the table
     */
    const deleteTopRow = () => {
        deleteRow(currentTable, 1);
    };

    /** @description
     *  @param   {number} span 
     *  @returns {array}
     */
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

    /** @description builds the title row of the table which will be placed at the top.
     *               It returns an array with a single element.
     *  @param {number} span 
     *  @returns {array}
     */
    const buildTableTitle = (span) => {
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

    /** @description builds a single column of the column axis.
     *  @param   {number} columnIndex 
     *  @param   {number} rowStart 
     *  @returns {array} 
     */
    const buildColumnAxisColumn = (columnIndex, rowStart) => {
        if (colAxis.dims < rowStart) return [];

        let column = new Array(colAxis.dims - rowStart),
            sort = null;

        if (columnIndex < rowAxis.dims) {
            for (let i=0, y=rowStart; y < colAxis.dims; i++, y++) {
                if (i === 0) column[i] = DimensionEmptyCell(rowAxis.dims - columnIndex, colAxis.dims - y, columnIndex !== t.columnStart);
                else         column[i] = DimensionEmptyCell(rowAxis.dims - columnIndex, colAxis.dims - y, true);
            }
            return column;
        }

        columnIndex -= rowAxis.dims

        if (isColumnSubTotal(columnIndex)) {
            for (let i=0, y=rowStart; y < colAxis.dims; i++, y++) {
                if (i === 0) column[i] = DimensionSubTotalCell('&nbsp;', 1, colAxis.dims - y, true, false);
                else         column[i] = DimensionSubTotalCell('&nbsp;', 1, colAxis.dims - y, true, true);
            }
            return column;
        }

        if (isColumnGrandTotal(columnIndex)) {
            for (let i=0, y=rowStart; y < colAxis.dims; i++, y++) {
                if (i === 0) column[i] = DimensionGrandTotalCell('Total', 1, colAxis.dims - y, doSortableColumnHeaders(), false);
                else         column[i] = DimensionSubTotalCell('&nbsp;', 1, colAxis.dims - y, true, true);
            }
            return column;
        }

        if (doRowSubTotals()) {
            columnIndex = Math.max(0, columnIndex - Math.floor(columnIndex / (colUniqueFactor + 1)));
        }

        if (doSortableColumnHeaders() && rowIndex === colAxis.dims - 1 ) {
            sort = colAxis.ids[columnIndex];
        }

        for (let i=0, y=rowStart; y < colAxis.dims; i++, y++) {
            let axisObject = colAxis.objects.all[y][columnIndex];
            column[i] = ColumnAxisCell(axisObject, response, layout.showHierarchy, !(axisObject.rowSpan || axisObject.colSpan), sort);
        }

        return column;
    };
    
    /** @description builds a single column of the row axis.
     *  @param   {number} x 
     *  @param   {number} rowStart 
     *  @param   {number} rowEnd 
     *  @returns {array}
     */
    const buildRowAxisColumn = (columnIndex, rowStart, rowEnd) => {
        if (rowAxis.dims < columnIndex) return [];

        // if (rowStart < colAxis.dims) rowEnd -= colAixs.dims - rowStart;

        let column = new Array(rowEnd - rowStart);

        for(var i = 0, y = rowStart; y < rowEnd; i++, y++) {

            if (isRowSubTotal(y)) {
                column[i] = DimensionSubTotalCell('&nbsp;', rowAxis.dims - columnIndex, 1, true, t.columnStart !== columnIndex);
                continue;
            }

            if (isRowGrandTotal(y)) {
                if (t.columnStart === columnIndex) column[i] = DimensionGrandTotalCell('Total', rowAxis.dims - columnIndex, 1, false, false);
                else                     column[i] = DimensionSubTotalCell('&nbsp;', rowAxis.dims - columnIndex, 1, true, true);
                continue;
            }

            let yd = y

            if (doColSubTotals()) {
                yd -= Math.floor(y / rowUniqueFactor);
            }

            let axisObject = rowAxis.objects.all[columnIndex][yd];

            column[i] = RowAxisCell(axisObject, response, layout.showHierarchy, !(axisObject.rowSpan || axisObject.colSpan));
        }
        return column;
    };

    /** @description builds a row of the column axis.
     *  @param   {number} rowIndex 
     *  @param   {number} columnStart 
     *  @param   {number} columnEnd 
     *  @returns {array}
     */
    const buildColumnAxisRow = (rowIndex, columnStart, columnEnd) => {
        if (colAxis.dims < rowIndex) return [];

        let row = new Array(columnEnd - columnStart),
            i = 0,
            x = columnStart;

        if (x < rowAxis.dims) {
            for (i, x; x < rowAxis.dims; i++, x++) {
                if (i === 0) row[i] = DimensionEmptyCell(rowAxis.dims - x, colAxis.dims - rowIndex, columnStart === t.columnStart);
                else         row[i] = DimensionEmptyCell(rowAxis.dims - x, colAxis.dims - rowIndex, true);
            }
        }

        x         -= rowAxis.dims;
        columnEnd -= rowAxis.dims;

        for(i, x; x < columnEnd; i++, x++) {

            if (isColumnSubTotal(x)) {
                if (i === 0) row[i] = DimensionSubTotalCell('&nbsp;', 1, colAxis.dims - rowIndex, true, false);
                else         row[i] = DimensionSubTotalCell('&nbsp;', 1, colAxis.dims - rowIndex, true, true);
                continue;
            }

            if (isColumnGrandTotal(x)) {
                if (rowIndex === t.rowStart) row[i] = DimensionGrandTotalCell('Total', 1, colAxis.dims - rowIndex, doSortableColumnHeaders(), false);
                else         row[i] = DimensionSubTotalCell('&nbsp;', 1, colAxis.dims - rowIndex, true, true);
                continue
            }

            let xd = x;

            if (doRowSubTotals()) {
                xd -= Math.floor(x / (colUniqueFactor + 1));
            }

            let sort = null;

            if (doSortableColumnHeaders() && rowIndex === colAxis.dims - 1 ) {
                sort = colAxis.ids[columnIndex];
            }

            let axisObject = colAxis.objects.all[rowIndex][xd];
            row[i] = ColumnAxisCell(axisObject, response, layout.showHierarchy, !(axisObject.rowSpan || axisObject.colSpan), sort);
        }
        return row;
    };

    /** @description builds a single row from the row axis
     *  @param   {number} rowIndex 
     *  @param   {number} columnStart 
     *  @returns {array}
     */
    const buildRowAxisRow = (rowIndex, columnStart) => {
        if (rowAxis.dims < columnStart) return [];

        let row = new Array(rowAxis.dims - columnStart);

        if (isRowSubTotal(rowIndex)) {
            for (let i=0, x=columnStart; x < rowAxis.dims; i++, x++) {
                if (i === 0) row[i] = DimensionSubTotalCell('&nbsp;', rowAxis.dims - x, 1, true, false);
                else         row[i] = DimensionSubTotalCell('&nbsp;', rowAxis.dims - x, 1, true, true);
            }
            return row;
        }

        if (isRowGrandTotal(rowIndex)) {
            for (let i=0, x=columnStart; x < rowAxis.dims; i++, x++) {
                if (i === 0) row[i] = DimensionGrandTotalCell('Total', rowAxis.dims - x, 1, false, false);
                else         row[i] = DimensionSubTotalCell('&nbsp;', rowAxis.dims - x, 1, true, true);
            }
            return row;
        }

        if (doColSubTotals()) {
            rowIndex = Math.max(0, rowIndex - Math.floor(rowIndex / (rowUniqueFactor + 1)));
        }

        for(var i = 0, x = columnStart; x < rowAxis.dims; i++, x++) {
            let axisObject = rowAxis.objects.all[x][rowIndex];
            row[i] = RowAxisCell(axisObject, response, layout.showHierarchy, !(axisObject.rowSpan || axisObject.colSpan));
        }

        return row;
    };

    /** @description Builds a single row from the value table, not including either dimension.
     *  @param   {number} rowIndex
     *  @param   {number} columnStart 
     *  @param   {number} columnEnd 
     *  @returns {array}
     */
    const buildValueRow = (rowIndex, columnStart, columnEnd) => {
        let row = new Array(columnEnd - columnStart);

        for (let i=0, x=columnStart; x < columnEnd; i++, x++) {
            row[i] = getValueCell(x, rowIndex);
        }

        return row;
    };

    /** @description Builds a single column from the value table, not including either dimension.
     *  @param   {number} columnIndex 
     *  @param   {number} rowStart 
     *  @param   {number} rowEnd 
     *  @returns {array}
     */
    const buildValueColumn = (columnIndex, rowStart, rowEnd) => {
        let column = new Array(rowEnd - rowStart);
        
        for (let i=0, y=rowStart; y < rowEnd; i++, y++) {
            column[i] = getValueCell(columnIndex, y);
        }

        return column; 
    };

    /** @description Builds a single column from the table, including both dimensions.
     *  @param   {number} columnIndex
     *  @param   {number} rowStart 
     *  @param   {number} rowEnd 
     *  @returns {array}
     *  TODO: This function needs closer inspection
     */
    const buildTableColumn = (columnIndex, rowStart, rowEnd) => {
        let columnAxis = buildColumnAxisColumn(columnIndex, rowStart);

        if (rowStart > colAxis.dims) {
            rowStart -= colAxis.dims;
        }
        
        rowEnd -= colAxis.dims - 1

        if (columnIndex < rowAxis.dims) {
            return columnAxis.concat(buildRowAxisColumn(columnIndex, rowStart, rowEnd));
        }

        columnIndex -= rowAxis.dims;

        let valueTable = buildValueColumn(columnIndex, rowStart, rowEnd),
            column = columnAxis.concat(valueTable);
    
        return column;
    };

    /** @description Builds a single row from the table, including both dimensions.
     *  @param   {number} rowIndex 
     *  @param   {number} columnStart 
     *  @param   {number} columnEnd 
     *  @returns {array}
     *  TODO: This function needs closer inspection
     */
    const buildTableRow = (rowIndex, columnStart, columnEnd) => { 
        let rowAxisRow = [];

        if (rowIndex < colAxis.dims) {
            return buildColumnAxisRow(rowIndex, columnStart, columnEnd + 1);
        }

        rowIndex -= colAxis.dims;

        if (columnStart < rowAxis.dims) {
            rowAxisRow = buildRowAxisRow(rowIndex, columnStart);
            columnStart = 0;
        } else {
            columnStart -= rowAxis.dims
        }

        let valueTable = buildValueRow(rowIndex, columnStart, columnEnd - 1),
            row = rowAxisRow.concat(valueTable);

        return row;
    };

    /** @description Builds the row axis dimension of the table.
     *  @param   {number} rowStart 
     *  @param   {number} rowEnd 
     *  @param   {number} columnStart
     *  @returns {array}  
     */ 
    const buildRowAxis = (rowStart, rowEnd, columnStart) => {

        rowEnd -= colAxis.dims;

        let axis = new Array(rowEnd - rowStart);

        if(!rowAxis.type) {
            if (layout.showDimensionLabels) {
                axis[0] = [{ type: 'transparent', cls: 'pivot-transparent-row' }];
            }
            return axis;
        }
        
        for (let i=0,y=rowStart; y <= rowEnd; i++, y++) {
            axis[i] = buildRowAxisRow(y, columnStart);
        }

        return axis;
    };

    /** @description Builds the column axis dimension of the table.
     *  @param   {number} columnStart 
     *  @param   {number} columnEnd 
     *  @param   {number} rowStart
     *  @returns {array}
     */ 
    const buildColumnAxis = (columnStart, columnEnd, rowStart) => {
        if (!colAxis.type) return getDimensionColArray();

        let axis = new Array(columnEnd - columnStart);

        for (let i=0, x=columnStart; x <= columnEnd; i++, x++) {
            axis[i] = buildColumnAxisColumn(x, rowStart);
        }

        return axis;
    };
    
    /** @description Builds the value table of the table.
     *  @param   {number} rowStart 
     *  @param   {number} rowEnd 
     *  @param   {number} columnStart 
     *  @param   {number} columnEnd 
     *  @returns {array}
     */
    const buildValueTable = function(rowStart, rowEnd, columnStart, columnEnd) {
        rowEnd    -= colAxis.dims;
        columnEnd -= rowAxis.dims;

        let table = buildTable2D(rowEnd - rowStart + 1, columnEnd - columnStart + 1);

        for (let i=0, y=rowStart; i < table.length; i++, y++) {
            for (let j=0, x=columnStart; j < table[i].length; j++, x++) {

                if (doSortableColumnHeaders()) {
                    let totalIdComb = new ResponseRowIdCombination(refs, ['total', rowAxis.ids[y]]);
                    idValueMap[totalIdComb.get()] = isRowEmpty(y) ? null : getRowTotal(y);
                }

                table[i][j] = getValueCell(x, y);
            }
        }
        
        if (doRowPercentage()) transformRowPercentage(table);
        if (doColPercentage()) transformColPercentage(table);

        return table;
    };

    /** @description Builds the pivot table, combining row dimension, column dimension and value table.
     *  @param   {number} rowStart 
     *  @param   {number} rowEnd 
     *  @param   {number} columnStart 
     *  @param   {number} columnEnd 
     *  @returns {array}
     */
    const buildTable = (rowStart, rowEnd, columnStart, columnEnd) => {
        let rowAxis = buildRowAxis(rowStart, rowEnd, columnStart),
            colAxis = buildColumnAxis(columnStart, columnEnd, rowStart),
            values  = buildValueTable(rowStart, rowEnd, columnStart, columnEnd);

        for (let i = 0; i < rowAxis.length; i++) {
            rowAxis[i].push(...values[i]);
        }
        
        return toRow(colAxis).concat(rowAxis);
    };

    /** @description turns a table of objects into a table of html strings.
     *  @param   {array} objectArray 
     *  @returns {array}
     */
    buildHtmlRows = function(objectArray) {
        const html = [];
        for (let i=0; i < objectArray.length; i++) {
            for (var j=0, htmlRow=[]; j < objectArray[i].length; j++) {
                htmlRow.push(getTdHtml(objectArray[i][j]));
            }
            html.push(htmlRow);
        }
        return html;
    };

    /** @description builds an html array from a table of html strings.
     *  @param   {array} htmlArray 
     *  @returns {array}
     */
    buildHtmlTable = function(htmlArray) {
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

    /** @description scans over the row axis, updaring the row span to reflect the current table size.
     */
    const updateRowAxisDimensionSpan = () => {
        let rowSpanLimit = t.rowEnd - t.rowStart + 1,
            yStart = Math.max(0, t.rowStart - colAxis.dims),
            rowSpanValue = 0,
            cell;

        if (doColSubTotals()) {
            yStart -= Math.floor(Math.max(0, t.rowStart - colAxis.dims) / (rowUniqueFactor + 1));
        }

        for (let i=1; i < rowAxis.dims - t.columnStart + 1; i++) {
            for (let j=1, y=yStart, rowSpanCounter=0; j < currentTable.length - 1; j++) {

                cell = currentTable[j][i];
                cell.hidden = true;

                switch (cell.type) {
                    case 'empty': {
                        rowSpanValue = 1;
                    } break;
                    
                    case 'dimension': {
                        let rowSpan = cell.children * rowAxis.span[i];
                        cell.rowSpan = cell.children   ? rowSpan - (y % rowSpan) : 1;
                        cell.hidden  = cell.children  ?  rowSpan !== cell.rowSpan : false;
                        if  (j === 1 && i !== rowAxis.dims) cell.hidden = false;
                        rowSpanValue = cell.hidden ? 0 : cell.rowSpan;
                        y++;
                    } break;

                    case 'dimensionSubtotal':
                    case 'valueTotalSubgrandtotal': {
                        cell.hidden = i !== 1;
                        rowSpanValue = 1;
                    } break;
                    default: continue;
                }

                if (rowSpanCounter >= rowSpanLimit) {
                    cell.hidden = true;
                    continue;
                }

                if  (j === 1 && i !== rowAxis.dims) {
                    cell.hidden = false;
                }

                if (rowSpanValue + rowSpanCounter > rowSpanLimit) {
                    cell.rowSpan = rowSpanLimit - rowSpanCounter;
                    rowSpanValue = cell.rowSpan;
                }

                rowSpanCounter += rowSpanValue;

                cell = null;
            }
        }
    };

    /** @description scans over the column axis, updaring the column span to reflect the current table size.
     */
    const updateColumnAxisDimensionSpan = () => {
        let colSpanLimit = t.columnEnd - t.columnStart + 1,
            xStart = Math.max(0, t.columnStart - rowAxis.dims),
            colSpanValue = 0,
            cell;

        if (doRowSubTotals()) {
            xStart -=  Math.floor(Math.max(0, t.columnStart - rowAxis.dims) / (colUniqueFactor + 1));
        }

        for (let i=1; i < colAxis.dims - t.rowStart + 1; i++) {
            for (let j=1, x=xStart, colSpanCounter=0; j < currentTable[i].length - 1; j++) {

                cell = currentTable[i][j];
                cell.hidden = true;

                switch (cell.type) {
                    case 'empty': {
                        colSpanValue = 1;
                    } break;
                    
                    case 'dimension': {
                        let colSpan = cell.children * colAxis.span[i]
                        cell.colSpan = cell.children ? colSpan - (x % colSpan) : 1;
                        cell.hidden =  cell.children ? colSpan !== cell.colSpan : false;
                        if  (j === 1 && i !== colAxis.dims) cell.hidden = false;
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

                if (colSpanCounter >= colSpanLimit) {
                    cell.hidden = true;
                    continue;
                }

                if  (j === 1 && i !== colAxis.dims) {
                    cell.hidden = false;
                }

                if (colSpanValue + colSpanCounter > colSpanLimit) {
                    cell.colSpan = colSpanLimit - colSpanCounter;
                    colSpanValue = cell.colSpan;
                }

                colSpanCounter += colSpanValue;
            }
        }
    };

    /** @description updates the table given a start row and start column.
     *  @param   {number} columnStart 
     *  @param   {number} rowStart 
     *  @returns {array}
     */
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
            options.skipTitle ? [] : buildTableTitle(currentTable[1].length) || [],
            getFilterHtmlArray(currentTable[1].length) || [],
            buildHtmlRows(currentTable)
        ));

        return buildHtmlTable(htmlArray);
    };

    /** @description updates padding cells of current table.
     */
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
    };

    /** @description adds padding cells to given table.
     *  @param {array} table 
     *  @param {number} columnStart 
     *  @param {number} columnEnd 
     *  @param {number} rowStart 
     *  @param {number} rowEnd 
     */
    const addPaddingCells = (table, columnStart, columnEnd, rowStart, rowEnd) => {

        let leftPadding   = getLeftPadding(),
            rightPadding  = getRightPadding(),
            topPadding    = getTopPadding(),
            bottomPadding = getBottomPadding(),
            leftCell      = PaddingCell(leftPadding, 25, 1, 1, leftPadding <= 0),
            rightCell     = PaddingCell(rightPadding, 25, 1, 1, rightPadding <= 0),
            topCell       = PaddingCell(120, topPadding, (columnEnd - columnStart) + 1, 1, topPadding <= 0),
            bottomCell    = PaddingCell(120, bottomPadding, (columnEnd - columnStart) + 1, 1, bottomPadding <= 0);

        for (let i=0; i < table.length; i++) {
            table[i].push(rightCell);
            table[i].unshift(leftCell);
        }

        table.push([bottomCell]);
        table.unshift([topCell]);
    };

    /** @description
     *  @param {number} columnStart 
     *  @param {number} columnEnd 
     *  @param {number} rowStart 
     *  @param {number} rowEnd 
     */
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
    };

    /** @description renders table given a rowstart and column start.
     *  @param   {number} [rowStart=0]
     *  @param   {number} [columnStart=0]
     *  @returns {array}
     */
    renderTable = (rowStart=0, columnStart=0) => {

        t.columnStart = columnStart;
        t.columnEnd = getColumnEnd(columnStart);

        t.rowStart = rowStart;
        t.rowEnd = getRowEnd(rowStart);

        // build initial state of table
        currentTable = buildTable(t.rowStart, t.rowEnd, t.columnStart, t.columnEnd);

        // add padding cells to each side of table
        addPaddingCells(currentTable, t.columnStart, t.columnEnd, t.rowStart, t.rowEnd);
        
        // resize column axis span to fit current table layout
        updateColumnAxisDimensionSpan();

        // resize row axis span to fit current table layout
        updateRowAxisDimensionSpan();

        // create html array
        let htmlArray = arrayClean([].concat(
            options.skipTitle ? [] : buildTableTitle(currentTable[1].length) || [],
            getFilterHtmlArray(currentTable[1].length) || [],
            buildHtmlRows(currentTable)
        ));

        return buildHtmlTable(htmlArray);
    };

    (function() {
        valueLookup = createValueLookup(getTableRowSize(), getTableColumnSize());
        typeLookup  = createTypeLookup(getTableRowSize(), getTableColumnSize());
    }());

    // constructor
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

    t.setWindowWidth = setWindowRenderWidth;
    t.setWindowHeight = setWindowRenderHeight;
};

PivotTable.prototype.getUuidObjectMap = function() {
    return objectApplyIf((this.colAxis ? this.colAxis.uuidObjectMap || {} : {}), (this.rowAxis ? this.rowAxis.uuidObjectMap || {} : {}));
};
