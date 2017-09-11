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

import { ResponseRowIdCombination } from '../api/ResponseRowIdCombination';

import { isColorBright } from '../util/colorUtils';

import { toRow,
         deleteRow,
         getPercentageHtml,
         buildTable2D } from './PivotTableUtils';

import { ValueSubTotalCell,
         ValueTotalCell,
         RowAxisCell,
         ColumnAxisCell,
         DimensionSubTotalCell,
         DimensionGrandTotalCell,
         DimensionEmptyCell,
         DimensionLabelCell,
         ValueCell,
         PlainValueCell,
         PaddingCell,
         FilterCell,
         HorizontalPaddingCell,
         VerticalPaddingCell } from './PivotTableCells';

export const PivotTable = function(refs, layout, response, colAxis, rowAxis, options = {}) {
    const t = this;

    const { appManager, uiManager, dimensionConfig, optionConfig } = refs;

    const { ResponseRowIdCombination } = refs.api;

    options = options || {};

    // cell type enum
    const cellType = {
        'value':         0,
        'valueSubtotal': 1,
        'valueTotal':    2,
    };

    // initialize constants
    const uuidDimUuidsMap = {},
    
          // legend set
          legendSet = isObject(layout.legendSet) ? appManager.getLegendSetById(layout.legendSet.id) : null,
          legendDisplayStyle = layout.legendDisplayStyle,
          legendDisplayStrategy = layout.legendDisplayStrategy,
    
          // utils
          idValueMap = response.getIdValueMap(layout),
          idNumeratorMap = response.getIdNumeratorMap(layout),
          idDenominatorMap = response.getIdDenominatorMap(layout),
          idFactorMap = response.getIdFactorMap(layout),
          sortableIdObjects = []; //todo

    // inititalize global variables
    let currentTable,

        // row axis
        rowUniqueFactor,
        rowDimensionNames,
        numberOfEmptyRows = 0,

        // col axis
        columnDimensionNames,
        colUniqueFactor,
        numberOfEmptyColumns = 0,


        // lookups
        valueLookup,
        typeLookup,
        rowTotalLookup,
        columnTotalLookup,

        // counteres
        visibleEmptyRows,
        visibleEmptyColumns,

        // size
        tableRowSize,
        tableColumnSize,

        tdCount = 0;

    /** @description checks if show column totals is enabled.
     *  @returns {boolean}
     */
    const doColTotals = () => {
        return !!layout.showColTotals;
    };

    /** @description checks if row totals is enabled.
     *  @returns {boolean}
     */
    const doRowTotals = () => {
        return !!layout.showRowTotals;
    };

    /** @description checks if column sub totals is enabled.
     *  @returns {boolean}
     */
    const doColSubTotals = () => {
        return !!layout.showColSubTotals && rowAxis.type && rowAxis.dims > 1;
    };

    /** @description checks if row sub totals is enabled.
     *  @returns {boolean}
     */
    const doRowSubTotals = () => {
        return !!layout.showRowSubTotals && colAxis.type && colAxis.dims > 1;
    };

    /** @description checks if column percentage is enabled.
     *  @returns {boolean}
     */
    const doColPercentage = () => {
        return layout.numberType === optionConfig.getNumberType().percentofcolumn.id;
    };

    /** @description checks if row percentage is enabled.
     *  @returns {boolean}
     */
    const doRowPercentage = () => {
        return layout.numberType === optionConfig.getNumberType().percentofrow.id;
    };

    /** @description checks if column headers are sortable.
     *  @returns {boolean}
     */
    const doSortableColumnHeaders = () => {
        return (rowAxis.type && rowAxis.dims === 1);
    };

    /** @description checks if hide empty rows is enabled.
     *  @returns {boolean}
     */
    const doHideEmptyRows = () => {
        return layout.hideEmptyRows && colAxis.type && rowAxis.type;
    };

    /** @description checks if hide empty columns is enabled.
     *  @returns {boolean}
     */
    const doHideEmptyColumns = () => {
        return layout.hideEmptyColumns && colAxis.type && rowAxis.type;
    };

    /** @description checks if dimension labels is enabled.
     *  @returns {boolean}
     */
    const doShowDimensionLabels = () => {
        return layout.showDimensionLabels
    };

    /** @description checks if clipping table is enabled.
     *  @returns {boolean}
     */
    const doTableClipping = () => {
        return !!options.dynamic || true;
    };

    /** @description checks if sticky columns is enabled.
     *  @returns {boolean}
     */
    const doStickyColumns = () => {
        return layout.stickyColumnDimension;
    };

    /** @description checks if sticky rows enabled.
     *  @returns {boolean}
     */
    const doStickyRows = () => {
        return layout.stickyRowDimension;
    };

    /** @description checks for show hierarchy.
     *  @returns {boolean}
     */
    const doShowHierarchy = () => {
        return !!layout.showHierarchy;
    };

    /** @description
     *  @returns {boolean}
     */
    const doLegendDisplayByDataItem = () => {
        return legendDisplayStrategy === optionConfig.getLegendDisplayStrategy('by_data_item').id;
    };

    /** @description
     *  @returns {boolean}
     */
    const doLegendDisplay = () => {
        return legendDisplayStrategy !== optionConfig.getLegendDisplayStrategy('fixed').id;
    };

    /** @description
     *  @returns {boolean}
     */
    const doLegendDisplayStyleFill = () => {
        return legendDisplayStyle === optionConfig.getLegendDisplayStyle('fill').id;
    };

    /** @description
     *  @returns {boolean}
     */
    const doLegendDisplayStyleText = () => {
        return legendDisplayStyle === optionConfig.getLegendDisplayStyle('text').id;
    };

    /** @description checks if the cell at the given column index is a column sub total cell.
     *  @param   {number} columnIndex 
     *  @returns {boolean}
     */
    const isColumnSubTotal = (columnIndex) => {
        return doRowSubTotals() && (columnIndex + 1) % (colUniqueFactor + 1) === 0;
    };

    /** @description checks if the cell at the given column index is a column total cell.
     *  @param   {number} columnPosition 
     *  @returns {boolean}
     */
    const isColumnGrandTotal = (columnIndex) => {
        return doRowTotals() && columnIndex === tableColumnSize - 1;
    };

    /** @description checks if the cell at the given row index is a row sub total cell.
     *  @param   {number} rowIndex 
     *  @returns {boolean}
     */
    const isRowSubTotal = (rowIndex) => {
        return doColSubTotals() && (rowIndex + 1) % (rowUniqueFactor + 1) === 0;
    };

    /** @description checks if the cell at the given row index is a row total cell.
     *  @param   {nubmer} rowIndex 
     *  @returns {boolean}
     */
    const isRowGrandTotal = (rowIndex) => {
        return doColTotals() && rowIndex === tableRowSize - 1;
    };

    /** @description checks if given row index is empty.
     *  @param   {number} rowIndex 
     *  @returns {boolean}
     */
    const isRowEmpty = (rowIndex) => {
        return valueLookup[rowIndex][tableColumnSize - 1] <= 0;
    };

    /** @description checks if given column index is empty.
     *  @param   {number} columnIndex 
     *  @returns {boolean}
     */
    const isColumnEmpty = (columnIndex) => {
        return valueLookup[tableRowSize - 1][columnIndex] <= 0;
    };

    /** @description gets the uniuqe factor for the axis (number of elements within highest level parent).
     *  @param   {object} xAxis 
     *  @returns {number}
     */
    const getUniqueFactor = (xAxis) => {
        if (xAxis.xItems && xAxis.xItems.unique) {
            return xAxis.xItems.unique.length < 2 ? 1 : (xAxis.size / xAxis.xItems.unique[0].length);
        }

        return null;
    };

    /** @description returns the size of the column axis.
     *  @param   {boolean} includeCorner 
     *  @returns {number}
     */
    const getTableColumnSize = (includeCorner=false) => {
        let size = colAxis.size;
        if (doRowSubTotals()) size += colAxis.size / colUniqueFactor;
        if (doRowTotals())    size += 1;
        if (includeCorner)    size += rowAxis.dims;
        return size;
    };

    /** @description returns the size of the row axis.
     *  @param   {boolean} includeCorner 
     *  @returns {number}
     */
    const getTableRowSize = (includeCorner=false) => {
        let size = rowAxis.size;
        if (doColSubTotals()) size += rowAxis.size / rowUniqueFactor;
        if (doColTotals())    size += 1;
        if (includeCorner)    size += colAxis.dims;
        return size;
    };

    /** @description gets the html value of given object.
     *  @param   {object} config 
     *  @param   {bool} isValue 
     *  @returns {string}
     */
    const getHtmlValue = ({collapsed, htmlValue, type, isValue}) => {
        htmlValue = collapsed || !htmlValue ? '' : htmlValue;
        return !arrayContains(['dimension', 'filter'], type) ? optionConfig.prettyPrint(htmlValue, layout.digitGroupSeparator) : htmlValue;
    };

    /** @description gets value cell based on its type.
     *  @param   {number} columnIndex 
     *  @param   {number} rowIndex 
     *  @returns {object}
     */
    const getValueCell = (columnIndex, rowIndex) => {
        let value = valueLookup[rowIndex][columnIndex];
        switch(typeLookup[rowIndex][columnIndex]) {
            case 0: return PlainValueCell(value);
            case 1: return ValueSubTotalCell(value);
            case 2: return ValueTotalCell(value);
            default: return null;
        }
    };

    /** @description finds the last row to render based on the start row and table render size.
     *  @param   {number} rowStart 
     *  @returns {number}
     */
    const getRowEnd = (rowStart) => { 
        return Math.min(getTableRenderHeight() + rowStart, tableRowSize + colAxis.dims - 1);
    };

    /** @description finds the last column to render based on the start column and table render size.
     *  @param   {number} columnStart 
     *  @returns {number} 
     */
    const getColumnEnd = (columnStart) => { 
        return Math.min(getTableRenderWidth() + columnStart, tableColumnSize + rowAxis.dims - 1);
    };

    /** @description gets the total sum of all cells in given column index.
     *  @param   {number} columnIndex 
     *  @returns {number}
     */
    const getColumnTotal = (columnIndex) => {
        return valueLookup[tableRowSize - 1][columnIndex]; 
    };

    /** @description gets the total sum of all cells in given row index.
     *  @param   {number} rowIndex 
     *  @returns {number}
     */
    const getRowTotal = (rowIndex) => {
        return valueLookup[rowIndex][tableColumnSize - 1];
    };

    /** @description
     *  @returns {number}
     */
    const getTopPadding = () => {

        if (t.rowStart > 0 && !options.skipTitle) {
            return (t.rowStart + 1) * t.cellHeight;
        }

        return t.rowStart * t.cellHeight;
    };

    /** @description
     *  @returns {number}
     */
    const getLeftPadding = () => {
        return t.columnStart * t.cellWidth;
    };

    /** @description
     *  @returns {number}
     */
    const getBottomPadding = () => {
        return (tableRowSize - t.rowEnd) * t.cellHeight;
    };

    /** @description
     *  @returns {number}
     */
    const getRightPadding = () => {
        return (tableColumnSize - t.columnEnd) * t.cellWidth;
    };

    /** @description gets the index of the next column sub total from the given column index.
     *  @param   {number} columnIndex 
     *  @returns {number}
     */
    const getNextSubColumnIndex = (columnIndex) => {
        return columnIndex + Math.floor(columnIndex / colUniqueFactor) + (colUniqueFactor - (columnIndex % colUniqueFactor));
    };

    /** @description gets the index of the next row sub total from the given row index.
     *  @param   {number} rowIndex 
     *  @returns {number}
     */
    const getNextSubRowIndex = (rowIndex) => {
        return rowIndex + Math.floor(rowIndex / (rowUniqueFactor)) + (rowUniqueFactor - (rowIndex % rowUniqueFactor));
    };

    /** @description gets the next column grand total cell.
     *  @returns {number}
     */
    const getNextTotalColumnIndex = () => {
        return tableColumnSize - 1;
    };

    /** @description gets the next row grand total cell.
     *  @returns {number}
     */
    const getNextTotalRowIndex = () => {
        return tableRowSize - 1;
    };

     /** @description gets the number of horizontal cells that can be rendered within the current window size.
     *  @returns {number}
     */
    const getTableRenderWidth = () => {
        return Math.floor(t.horizontalWindowSize / t.cellWidth) + 1;
    };

    /** @description get the number of vertical cells that can be rendered within the current window size.
     *  @returns {number}
     */
    const getTableRenderHeight = () => {
        return Math.floor(t.verticalWindowSize / t.cellHeight) + 1;
    };

    /** @description
     * @param   {number} rowStart 
     * @param   {number} rowEnd 
     * @returns {number}
     */
    const getVisibleEmptyRows = (rowStart, rowEnd) => {
        let counter = 0;
        for (let y = rowStart; y < rowEnd; y++) {
            counter += isRowEmpty(y) ? 1 : 0;
        }
        return counter;
    }

    /** @description
     *  @param   {number} columnStart 
     *  @param   {number} columnEnd 
     *  @returns {number}
     */
    const getVisibleEmptyColumns = (columnStart, columnEnd) => {
        let counter = 0;
        for (let y = columnStart; y < columnEnd; y++) {
            counter += isColumnEmpty(y) ? 1 : 0;
        }
        return counter;
    }

    /** @description
     *  @param   {any} id 
     *  @returns {number}
     */
    const getLegendSetId = (id) => {
        return response.metaData.items[id].legendSet;
    }

    /** @description gets integer representation cell.
     *  @param   {number} rowIndex 
     *  @param   {number} columnIndex 
     *  @returns {number}
     */
    const getValue = (rowIndex, columnIndex) => {

        const rric  = buildRRIC(columnIndex, rowIndex),
              value = idValueMap[rric.get()],
              n = parseFloat(value);

        if (isBoolean(value)) {
            return 1;
        }

        if (!isNumber(n) || n != value) {
            return  0;
        }

        return n;
    };

    /** @description
     * @param   {object} cell
     * @param   {number} y
     * @returns {object}
     */
    const getAdjustedColSpan = (cell, y) => {
        if (cell.children) {
            return cell.oldestSibling.children * colAxis.span[y + 1] - cell.siblingPosition;
        }

        return cell.colSpan;;
    };
    
    /** @description
     * @param   {object} cell
     * @param   {number} x
     * @returns {object}
     */
    const getAdjustedRowSpan = (cell, x) => {
        if (cell.children) {
            return cell.oldestSibling.children * rowAxis.span[x + 1] - cell.siblingPosition;
        }

        return cell.rowSpan;;
    };

    /** @description
     *  @param   {number} span 
     *  @returns {number}
     */
    const getTopBarSpan = (span) => {
        let rowDims = rowAxis.dims || 0;

        if (!doShowDimensionLabels()) {
            if (!colAxis.type && rowAxis.type) {
                return rowDims + 1;
            }
            else if (colAxis.type && rowAxis.type) {
                return span + (rowDims > 1 ? rowDims - 1 : rowDims);
            }
        }

        return span;
    };

    /** @description sets the height of current render area in pixels.
     *  @param {number} heightInPixels 
     */
    const setVerticalWindowSize = (heightInPixels) => {
        if (typeof heightInPixels !== 'number') {
            t.verticalWindowSize = window.innerHeight;
        } else {
            t.verticalWindowSize = heightInPixels;
        }
    };

    /** @description sets the width of current render area in pixels.
     *  @param {number} widthInPixels 
     */
    const setHorizontalWindowSize = (widthInPixels) => {
        if (typeof widthInPixels !== 'number') {
            t.horizontalWindowSize = window.innerWidth;
        } else {
            t.horizontalWindowSize = widthInPixels;
        }
    };

    /** @description
     *  @param {number} horizontal 
     *  @param {number} vertical 
     */
    const setWindowSize = (widthInPixels, heightInPixels) => {
        setHorizontalWindowSize(widthInPixels);
        setVerticalWindowSize(heightInPixels);
    };

    /** @description
     *  @param {number} position
     */
    const setColumnStart = (position) => {
        t.columnStart = Math.max(0, position);
    };

    /** @description
     *  @param {number} position
     */
    const setRowStart = (position) => {
        t.rowStart = Math.max(0, position);
    };

    /** @description
     *  @param {number} position
     */
    const setColumnEnd = (position) => {
        t.columnEnd = Math.min(tableColumnSize + rowAxis.dims - 1, position);
    };

    /** @description
     *  @param {number} position
     */
    const setRowEnd = (position) => {
        t.rowEnd = Math.min(tableRowSize + colAxis.dims - 1, position);
    };

    /** @description collapses parents of given object.
     *  @param {object} obj 
     */
    const recursiveReduce = (obj, span) => {
        if (!obj.children) {
            obj.collapsed = true;

            if (obj.parent && obj.parent.oldestSibling) {
                obj.parent.oldestSibling.children--;
                obj.parent.oldestSibling[span]--;
            }
        }

        if (obj.parent) {
            recursiveReduce(obj.parent);
        }
    };

    /** @description builds an rric object
     *  @param   {number} columnIndex 
     *  @param   {number} rowIndex 
     *  @returns {object}
     */
    const buildRRIC = (columnIndex, rowIndex) => {
        const rric = new ResponseRowIdCombination();

        // TODO: THIS NEEDS FIXING: PERFORMANCE BOTTLENECK
        rric.add(colAxis.type ? colAxis.ids[columnIndex] : '');
        rric.add(rowAxis.type ? rowAxis.ids[rowIndex] : '');

        return rric;
    }

    /** @description
     *  @param {any} yDimensionSize 
     *  @param {any} xDimensionSize 
     *  @returns 
     */
    const createValueLookup = (yDimensionSize, xDimensionSize) => {

        const lookup       = buildTable2D(yDimensionSize, xDimensionSize, 0);

        rowTotalLookup     = new Array(yDimensionSize).fill(0),
        columnTotalLookup  = new Array(xDimensionSize).fill(0);

        for (let i=0, y=0; i < rowAxis.size; i++, y++) {

            if (doColSubTotals() && (y + 1) % (rowUniqueFactor + 1) === 0) y++;

            for (let j=0, x=0, value; j < colAxis.size; j++, x++) {

                if (doRowSubTotals() && (x + 1) % (colUniqueFactor + 1) === 0) x++;

                value = getValue(i, j);

                lookup[y][x] = value;

                rowTotalLookup[y]    += value;
                columnTotalLookup[x] += value;

                // calculate sub totals
                if (doColSubTotals())                     lookup[getNextSubRowIndex(i)][x]     += value;
                if (doRowSubTotals())                     lookup[y][getNextSubColumnIndex(j)]  += value;

                // calculate grand totals
                if (doColTotals())                        lookup[getNextTotalRowIndex()][x]    += value;
                if (doRowTotals())                        lookup[y][getNextTotalColumnIndex()] += value;

                // calculate intersection totals
                if (doRowTotals() && doColTotals())       lookup[getNextTotalRowIndex()][getNextTotalColumnIndex()] += value;
                if (doColSubTotals() && doRowSubTotals()) lookup[getNextSubRowIndex(i)][getNextSubColumnIndex(j)]   += value;

                if (doRowTotals() && doRowSubTotals())    lookup[getNextTotalRowIndex()][getNextSubColumnIndex(j)]  += value;
                if (doColSubTotals() && doColTotals())    lookup[getNextSubRowIndex(i)][getNextTotalColumnIndex()]  += value;

            }
        }
        return lookup;
    };

    const createTypeLookup = (yDimensionSize, xDimensionSize) => {
        const lookup = buildTable2D(yDimensionSize, xDimensionSize, 0);
        for (let y = 0; y < yDimensionSize; y++) {
            for (let x = 0, type; x < xDimensionSize; x++) {

                // calculate sub totals
                if (isRowSubTotal(y))                                  lookup[y][x] = 1;
                if (isColumnSubTotal(x))                               lookup[y][x] = 1;

                // calculate grand totals
                if (isRowGrandTotal(y))                                lookup[y][x] = 2;
                if (isColumnGrandTotal(x))                             lookup[y][x] = 2;
                
                // calculate intersection totals
                if (isColumnSubTotal(x) && isRowSubTotal(y))           lookup[y][x] = 1;
                if (isColumnGrandTotal(x) && isRowGrandTotal(y))       lookup[y][x] = 2;
            }
        }
        return lookup;
    };

    /** @description creates value cell.
     *  @param   {number} columnIndex 
     *  @param   {number} rowIndex 
     *  @returns {object}
     */
    const createValueCell = (value, columnIndex, rowIndex) => {
        let rric,
            uuids = [];

        columnIndex -= Math.floor(columnIndex / (colUniqueFactor + 1));
        rowIndex    -= Math.floor(rowIndex / (rowUniqueFactor + 1));
        
        rric = buildRRIC(columnIndex, rowIndex);
        
        if (colAxis.type) uuids.push(...colAxis.objects.all[colAxis.dims - 1][columnIndex].uuids);
        if (rowAxis.type) uuids.push(...rowAxis.objects.all[rowAxis.dims - 1][rowIndex].uuids);

        let cell = ValueCell(value, response, rric, uuids);

        uuidDimUuidsMap[cell.uuid] = uuids;

        return cell;
    };

    const getRowValuePosition = (rowIndex) => {
        return rowIndex - Math.floor(rowIndex / (rowUniqueFactor + 1));
    }

    const getColumnValuePosition = (columnIndex) => {
        return columnIndex - Math.floor(columnIndex / (colUniqueFactor + 1));
    }

    /** @description hides empty columns in table
     *  @param {array} table 
     */
    const hideEmptyColumns = () => {

        visibleEmptyColumns = 0;

        for (let i = Math.max(0, rowAxis.dims - t.columnStart), dimLeaf; i < currentTable[1].length; i++) {
            if (isColumnEmpty(i - (rowAxis.dims - t.columnStart))) {

                visibleEmptyColumns += 1;
                
                if (t.rowStart < colAxis.dims) {
                    dimLeaf = currentTable[colAxis.dims - 1 - t.rowStart][i];
                    
                    if (dimLeaf.collapsed) continue;

                    if (dimLeaf.type === 'dimensionSubtotal') {
                        currentTable[0][i].collapsed = true;
                    }

                    if (dimLeaf) {
                        recursiveReduce(dimLeaf, 'colSpan');
                    }
                }
                
                currentTable[0][i].collapsed = true;
                for (let j = 0; j < currentTable.length; j++) {
                    currentTable[j][i].collapsed = true;
                }
            }
        }
    };

    /** @description hides emprt rows in table
     *  @param {array} table 
     */
    const hideEmptyRows = () => {

        visibleEmptyRows = 0;

        let offset = 0,
            hiddenRows = 0;

        for (let i = Math.max(0, colAxis.dims - t.rowStart), dimLeaf; i < currentTable.length; i++) {
            
            if (isRowEmpty(i - (colAxis.dims - t.rowStart))) {
                
                visibleEmptyRows += 1;

                if (t.columnStart < rowAxis.dims) {
                    dimLeaf = currentTable[i][rowAxis.dims - 1 - t.columnStart];

                    if (dimLeaf.collapsed) continue;

                    if (dimLeaf.type === 'dimensionSubtotal') {
                        currentTable[i][0].collapsed = true;
                    }

                    if (dimLeaf && !dimLeaf.knicked) {
                        dimLeaf.knicked = true;
                        recursiveReduce(dimLeaf, 'rowSpan');
                    }
                }

                currentTable[i][0].collapsed = true;
                for (let j = 0; j < currentTable[i].length; j++) {
                    currentTable[i][j].collapsed = true;
                }

                hiddenRows++;
            }
        }

        for (let i = 0; i < hiddenRows; i++) {
            appendTableRow(currentTable.length + hiddenRows, t.columnStart, t.columnEnd);
        }
    };

    /** @description transforms values in columns to percentages.
     *  @param {array} table 
     */
    const transformColPercentage = (table) => {
        for (let i = 0; i < table.length; i++) {
            for (let j = 0; j < table[i].length; j++) {
                if (!table[i][j].empty) {
                    table[i][j].htmlValue = getPercentageHtml(table[i][j].value, columnTotalLookup[j]);
                }
                if (valueLookup[tableRowSize - 1][j] === 0) {
                    table[i][j].empty = true;
                    table[i][j].htmlValue = '&nbsp;';
                }
            }
        }
    };

    /** @description transforms values in rows to percentages.
     *  @param {array} table 
     */
    const transformRowPercentage = (table) => {
        for (let i = 0; i < table.length; i++) {
            for (let j = 0; j < table[i].length; j++) {
                if (!table[i][j].empty) {
                    table[i][j].htmlValue = getPercentageHtml(table[i][j].value, rowTotalLookup[i]);
                }
                if (valueLookup[i][tableColumnSize - 1] === 0) {
                    table[i][j].empty = true;
                    table[i][j].htmlValue = '&nbsp;';
                }
            }
        }
    };

    /** @description places a new column at the right side of the table.
     *  @param {number} columnIndex
     *  @param {number} rowStart 
     *  @param {number} rowEnd 
     */
    const appendTableColumn = (columnIndex, rowStart, rowEnd) => {
        const column = buildTableColumn(columnIndex, rowStart, rowEnd);
        for (let i = 0; i < column.length; i++) {
            currentTable[i].push(column[i]);
        }
    };

    /** @description places a new column at the left side of the table.
     *  @param {number} columnIndex 
     *  @param {number} rowStart 
     *  @param {number} rowEnd 
     */
    const prependTableColumn = (columnIndex, rowStart, rowEnd) => {
        const column = buildTableColumn(columnIndex, rowStart, rowEnd);
        for (let i = 0; i < column.length; i++) {
            currentTable[i].unshift(column[i]);
        }
    };

    /** @description places a new row at the top of the table.
     *  @param {number} rowIndex 
     *  @param {number} columnStart 
     *  @param {number} columnEnd 
     */
    const prependTableRow = (rowIndex, columnStart, columnEnd) => {
        currentTable.unshift(buildTableRow(rowIndex, columnStart, columnEnd))
    };

    /** @description places a new row at the bottom of the table.
     *  @param {number} rowIndex 
     *  @param {number} columnStart 
     *  @param {number} columnEnd 
     */
    const appendTableRow = (rowIndex, columnStart, columnEnd) => {
        currentTable.push(buildTableRow(rowIndex, columnStart, columnEnd));
    };

    /** @description removes a column from the left side of the table
     */
    const deleteLeftColumn = () => {
        for (let i = 0; i < currentTable.length; i++) {
            currentTable[i].shift();
        }
    };

    /** @description removes a column from the right side of the table
     */
    const deleteRightColumn = () => {
        for (let i = 0; i < currentTable.length; i++) {
            currentTable[i].pop();
        }
    };

    /** @description removes a column from the bottom of the table
     */
    const deleteBottomRow = () => {
        currentTable.pop();
    };

    /** @description removes a column from the top of the table
     */
    const deleteTopRow = () => {
        currentTable.shift();
    };

    /** @description
     *  @param   {number} span 
     *  @returns {array}
     */
    const buildTableFilter = (span) => {
        if (!layout.filters) return;

        let text = layout.filters.getRecordNames(false, layout.getResponse(), true),
            row = new Array(1);

        row[0] = buildHtmlCell(FilterCell(text, getTopBarSpan(span)));

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

        row[0] = buildHtmlCell(FilterCell(text, getTopBarSpan(span)));

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
            return buildCornerAxisColumn(columnIndex, rowStart);
        }

        columnIndex -= rowAxis.dims

        if (isColumnSubTotal(columnIndex)) {
            column[0] = DimensionSubTotalCell('&nbsp;', 1, colAxis.dims - rowStart, true, false);
            for (let i=1, y=rowStart + 1; y < colAxis.dims; i++, y++) {
                column[i] = DimensionSubTotalCell('&nbsp;', 1, colAxis.dims - y, true, true);
            }
            return column;
        }

        if (isColumnGrandTotal(columnIndex)) {
            column[0] = DimensionGrandTotalCell('Total', 1, colAxis.dims - rowStart, doSortableColumnHeaders(), false);
            for (let i=1, y=rowStart + 1; y < colAxis.dims; i++, y++) {
                column[i] = DimensionSubTotalCell('&nbsp;', 1, colAxis.dims - y, true, true);
            }
            return column;
        }

        if (doRowSubTotals()) {
            columnIndex = Math.max(0, columnIndex - Math.floor(columnIndex / (colUniqueFactor + 1)));
        }

        if (doSortableColumnHeaders() && columnIndex === colAxis.dims - 1 ) {
            sort = colAxis.ids[columnIndex];
        }

        for (let i=0, y=rowStart; y < colAxis.dims; i++, y++) {
            let axisObject = colAxis.objects.all[y][columnIndex];
            column[i] = ColumnAxisCell(axisObject, response, doShowHierarchy(), !(axisObject.rowSpan || axisObject.colSpan), sort);
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

        for (let i = 0, y = rowStart; y < rowEnd; i++, y++) {

            if (isRowSubTotal(y)) {
                column[i] = DimensionSubTotalCell('&nbsp;', rowAxis.dims - columnIndex, 1, true, t.columnStart !== columnIndex);
                continue;
            }

            if (isRowGrandTotal(y)) {
                if (t.columnStart === columnIndex) column[i] = DimensionGrandTotalCell('Total', rowAxis.dims - columnIndex, 1, false, false);
                else                               column[i] = DimensionSubTotalCell('&nbsp;', rowAxis.dims - columnIndex, 1, true, true);
                continue;
            }

            let yd = y

            if (doColSubTotals()) {
                yd -= Math.floor(y / (rowUniqueFactor + 1));
            }

            let axisObject = rowAxis.objects.all[columnIndex][yd];

            column[i] = RowAxisCell(axisObject, response, doShowHierarchy(), !(axisObject.rowSpan || axisObject.colSpan));
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
            let corner = buildCornerAxisRow(rowIndex, columnStart);
            for (i, x; i < corner.length; i++, x++) {
                row[i] = corner[i];
            }
        }

        x         -= rowAxis.dims;
        columnEnd -= rowAxis.dims;

        for (i, x; x < columnEnd; i++, x++) {

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
                sort = colAxis.ids[rowIndex];
            }

            let axisObject = colAxis.objects.all[rowIndex][xd];
            row[i] = ColumnAxisCell(axisObject, response, doShowHierarchy(), !(axisObject.rowSpan || axisObject.colSpan), sort);
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

        for (var i = 0, x = columnStart; x < rowAxis.dims; i++, x++) {
            let axisObject = rowAxis.objects.all[x][rowIndex];
            row[i] = RowAxisCell(axisObject, response, doShowHierarchy(), !(axisObject.rowSpan || axisObject.colSpan));
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
            if (doShowDimensionLabels()) {
                axis[0] = [{ type: 'transparent', cls: 'pivot-transparent-row' }];
            }
            return axis;
        }
        
        for (let i=0,y=rowStart; y <= rowEnd; i++, y++) {
            axis[i] = buildRowAxisRow(y, columnStart);
        }

        return axis;
    };

    /** @description Builds the row axis dimension of the table.
     *  @param   {number} rowStart 
     *  @param   {number} rowEnd 
     *  @param   {number} columnStart
     *  @returns {array}  
     */ 
    const buildRowAxis2 = (rowStart, rowEnd, columnStart) => {

        rowEnd -= colAxis.dims;

        let axis = [];

        if(!rowAxis.type) {
            if (doShowDimensionLabels()) {
                axis.push([{ type: 'transparent', cls: 'pivot-transparent-row' }]);
            }
            return axis;
        }
        
        for (let i=0,y=rowStart; y <= rowEnd - rowStart; i++, y++) {
            if (doHideEmptyRows() && isRowEmpty(y)) {
                rowEnd++;
                continue;
            }
            axis.push(buildRowAxisRow(y, columnStart));
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
        if (!colAxis.type) return buildCornerAxisRow(0, 0);

        let axis = new Array(columnEnd - columnStart);

        for (let i=0, x=columnStart; x <= columnEnd; i++, x++) {
            axis[i] = buildColumnAxisColumn(x, rowStart);
        }

        return axis;
    };

    /** @description Builds the column axis dimension of the table.
     *  @param   {number} columnStart 
     *  @param   {number} columnEnd 
     *  @param   {number} rowStart
     *  @returns {array}
     */ 
    const buildColumnAxis2 = (columnStart, columnEnd, rowStart) => {
        if (!colAxis.type) return buildCornerAxisRow(0, 0);

        let axis = []

        for (let i=0, x=columnStart; x <= columnEnd - columnStart; i++, x++) {
            if (doHideEmptyColumns() && isColumnEmpty(x)) columnEnd++;
            axis.push(buildColumnAxisColumn(x, rowStart));
        }

        return axis;
    };

    /** @description builds a single row of the corner axis dimension of the table.
     *  @param   {number} rowIndex 
     *  @param   {number} columnStart 
     *  @returns {array}
     */
    const buildCornerAxisRow = (rowIndex, columnStart) => {
        const row = new Array(rowAxis.dims - columnStart);

        if (!doShowDimensionLabels()) {
            row[0] = DimensionEmptyCell(rowAxis.dims - columnStart, colAxis.dims - rowIndex, columnStart === t.columnStart);
            for (let i=1, x=columnStart + 1; x < rowAxis.dims; i++, x++) {
                row[i] = DimensionEmptyCell(rowAxis.dims - x, colAxis.dims - rowIndex, true);
            }
            return row;
        }

        if (rowIndex === colAxis.dims - 1) {
            let i = 0;

            for (let x=columnStart; x < rowAxis.dims - 1; i++, x++) {
                row[i] = DimensionLabelCell(response.getNameById(rowDimensionNames[i]));
            }

            let colAxisLabel = colAxis.type ? response.getNameById(columnDimensionNames[rowAxis.dims - 1]) : null,
                rowAxisLabel = rowAxis.type ? response.getNameById(rowDimensionNames[colAxis.dims - 1]) : null;

            row[i] = DimensionLabelCell(rowAxisLabel + (colAxisLabel ? '&nbsp;/&nbsp;' + colAxisLabel : ''));
        }

        else {
            let i = 0;
            for (let x=columnStart; x < rowAxis.dims - 1; i++, x++) {
                row[i] = DimensionLabelCell('&nbsp;');
            }
            row[i] = DimensionLabelCell(response.getNameById(columnDimensionNames[rowIndex]));
        }

        return row;
    };

    /** @description builds a single column of the corner axis dimension of the table.
     *  @param   {number} columnIndex 
     *  @param   {number} rowStart 
     *  @returns {array}
     */
    const buildCornerAxisColumn = (columnIndex, rowStart) => {
        const column = new Array(colAxis.dims - rowStart);

        if (!doShowDimensionLabels()) {
            column[0] = DimensionEmptyCell(rowAxis.dims - columnIndex, colAxis.dims - rowStart, columnIndex !== t.columnStart);
            for (let i=1, y=rowStart + 1; y < colAxis.dims; i++, y++) {
                column[i] = DimensionEmptyCell(rowAxis.dims - columnIndex, colAxis.dims - y, true);
            }
            return column;
        }

        if (columnIndex === rowAxis.dims - 1) {
            for (let i=rowStart; i < colAxis.dims - 1; i++) {
                column[i] = DimensionLabelCell(response.getNameById(columnDimensionNames[i]));
            }

            let colAxisLabel = colAxis.type ? response.getNameById(columnDimensionNames[colAxis.dims - 1]) : null,
                rowAxisLabel = rowAxis.type ? response.getNameById(rowDimensionNames[rowAxis.dims - 1]) : null;

            column[colAxis.dims - 1] = DimensionLabelCell(rowAxisLabel + (colAxisLabel ? '&nbsp;/&nbsp;' + colAxisLabel : ''));
        }

        else {
            for (let i=rowStart; i < colAxis.dims - 1; i++) {
                column[i] = DimensionLabelCell('&nbsp;');
            }
            column[colAxis.dims - 1] = DimensionLabelCell(response.getNameById(rowDimensionNames[columnIndex]))
        }

        return column;
    }

    /** @description builds the corner axis dimension of the table.
     *  @returns {array}
     */
    const buildCornerAxis = () => {
        const cornerAxis = new Array(colAxis.dims);

        for (let i=0; i < colAxis.dims; i++) {
            cornerAxis[i] = buildCornerAxisRow(i, 0);
        }

        return cornerAxis;
    }
    
    /** @description Builds the value table of the table.
     *  @param   {number} rowStart 
     *  @param   {number} rowEnd 
     *  @param   {number} columnStart 
     *  @param   {number} columnEnd 
     *  @returns {array}
     */
    const buildValueTable = (rowStart, rowEnd, columnStart, columnEnd) => {
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


    /** @description Builds the value table of the table.
     *  @param   {number} rowStart 
     *  @param   {number} rowEnd 
     *  @param   {number} columnStart 
     *  @param   {number} columnEnd 
     *  @returns {array}
     */
    const buildValueTable2 = (rowStart, rowEnd, columnStart, columnEnd) => {
        rowEnd    -= colAxis.dims;
        columnEnd -= rowAxis.dims;

        let table = [];

        for (let i=0, y=rowStart; i < rowEnd - rowStart + 1; i++, y++) {
            if (doHideEmptyRows() && isRowEmpty(y)) {
                rowEnd++;
                continue;
            } 
            table.push([])
            for (let j=0, x=columnStart; j < columnEnd - columnStart + 1; j++, x++) {
                if (doHideEmptyColumns() && isColumnEmpty(x)) columnEnd++;

                if (doSortableColumnHeaders()) {
                    let totalIdComb = new ResponseRowIdCombination(refs, ['total', rowAxis.ids[y]]);
                    idValueMap[totalIdComb.get()] = isRowEmpty(y) ? null : getRowTotal(y);
                }

                table[table.length - 1].push(getValueCell(x, y));
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
    const buildTable = () => {

        let rowAxis = buildRowAxis(t.rowStart, t.rowEnd, t.columnStart),
            colAxis = buildColumnAxis(t.columnStart, t.columnEnd, t.rowStart),
            values  = buildValueTable(t.rowStart, t.rowEnd, t.columnStart, t.columnEnd);

        for (let i = 0; i < rowAxis.length; i++) {
            rowAxis[i].push(...values[i]);
        }
        
        return toRow(colAxis).concat(rowAxis);
    };

    /** @description 
     *  @param   {object} config 
     *  @returns {object}
     */
    const buildHtmlCell = (config) => {

        // validation
        if (!isObject(config) || config.hidden || config.collapsed) {
            return '';
        }

        // count number of cells
        tdCount += 1;

        // html value
        let htmlValue = getHtmlValue(config);

        if (isString(config.sort)) {
            sortableIdObjects.push({
                
                id: config.sort,
                uuid: config.uuid
            });
        }

        let style = '';

        if (config.isValue && legendSet) {

            let legends = legendSet.legends,
                bgColor;

            if (doLegendDisplayByDataItem() && config.dxId && response.metaData.items[config.dxId].legendSet) {
                legends = appManager.getLegendSetById(getLegendSetId(config.dxId)).legends;
            }

            for (let i=0; i < legends.length; i++) {
                if (numberConstrain(config.value, legends[i].startValue, legends[i].endValue) === config.value) {
                    bgColor = legends[i].color;
                }
            }
        
            if (doLegendDisplayStyleFill() && bgColor) {
                style += `background-color:${bgColor}; color:${isColorBright(bgColor) ? 'black' : 'white'};`;
            }

            if (doLegendDisplayStyleText() && bgColor) {
                style += `color:${bgColor};`;
            }
        }
        
        if (doTableClipping() || doStickyColumns() || doStickyRows()) {
            style += `
                min-width:${config.width}px!important;
                min-height:${config.height}px!important;
                max-width:${config.width}px!important;
                max-height:${config.height}px!important;
                width:${config.width}px!important;
                height:${config.height}px!important;
                white-space: nowrap!important;
                overflow: hidden!important;
                text-overflow: ellipsis!important;
            `;
        }

        return `
            <td data-ou-id="${config.ouId || ''}"
                data-period-id="${config.peId || ''}"
                class="${config.cls}"
                id="${config.uuid || ''}"
                title="${config.title || ''}"
                style="${style}"
                colspan="${config.colSpan || ''}"
                rowSpan="${config.rowSpan || ''}"
            >
                ${htmlValue}
            </td>
        `;
    };

    /** @description turns a table of objects into a table of html strings.
     *  @param   {array} objectArray 
     *  @returns {array}
     *  TODO: This function seems unnecessary
     */
    const buildHtmlRows = (objectArray) => {
        t.valueUuids = [];
        return objectArray.map((row) => {
            return row.map((cell) =>{
                if (cell.uuid) t.valueUuids.push(cell.uuid);
                return buildHtmlCell(cell);
            });
        });
    };

    /** @description
     *  @param   {array} htmlArray 
     *  @param   {number} start 
     *  @param   {number} end 
     *  @returns {string}
     */
    const buildHtmlTableRows = (htmlArray, start, end) => {
        if (doTableClipping()) return buildHtmlTableRowsWithPaddng(htmlArray, start, end);

        let rows = '';
        
        for (let i = start, htmlRow; i < end; i++) {
            htmlRow = htmlArray[i].join('');
            if (htmlRow && htmlRow.length > 0) {
                rows += `<tr> ${htmlRow} </tr>`;
            }
        }
    
        // TODO: cleaner?
        // htmlArray.filter((item, index) => item.length > 0 && index >= start && index < end).reduce((rows, row) => {
        //     return rows += `<tr> ${row.join('')} </tr>`;
        // }, '');

        return rows;
    }
    
    /** @description
     *  @param   {array} htmlArray 
     *  @param   {number} start 
     *  @param   {number} end 
     *  @returns {string}
     */
    const buildHtmlTableRowsWithPaddng = (htmlArray, start, end) => {
        let rows = '';

        const leftPadding  = buildLeftPaddingHtmlCell(),
              rightPadding = buildRightPaddingHtmlCell();
        
        for (let i = start, htmlRow; i < end; i++) {
            htmlRow = htmlArray[i].join('');
            if (htmlRow.length > 0) {
                rows += `<tr> ${leftPadding} ${htmlRow} ${rightPadding} </tr>`;
            }
        }

        return rows;
    }

    /** @description
     *  @returns {string}
     */
    const buildTopPaddingHtmlRow = () => {
        const cell = buildTopPaddingHtmlCell();

        if (cell) {
            return `<tr>${cell}</tr>`;
        }

        return  '';
    }

    /** @description
     *  @returns {string}
     */
    const buildBottomPaddingHtmlRow = () => {
        const cell = buildBottomPaddingHtmlCell();
        
        if (cell) {
            return `<tr>${cell}</tr>`;
        }

        return  '';
    }
    
    /** @description
     *  @returns {string}
     */
    const buildTopPaddingHtmlCell = () => {

        const padding = getTopPadding(),
              cell    = VerticalPaddingCell(padding, 'top-padding');

        return buildHtmlCell(cell);
    }

    /** @description
     *  @returns {string}
     */
    const buildBottomPaddingHtmlCell = () => {

        const padding = getBottomPadding(),
              cell    = VerticalPaddingCell(padding, 'bottom-padding');

        return buildHtmlCell(cell);
    }

    /** @description
     *  @returns {string}
     */
    const buildLeftPaddingHtmlCell = () => {

        const padding = getLeftPadding(),
              cell    = HorizontalPaddingCell(padding, 'left-padding');

        return buildHtmlCell(cell);
    }

    /** @description
     *  @returns {string}
     */
    const buildRightPaddingHtmlCell = () => {

        const padding = getRightPadding(),
              cell    = HorizontalPaddingCell(padding, 'right-padding');

        return buildHtmlCell(cell);
    }

    /** @description builds html for column dimension
     *  @param   {array} htmlArray 
     *  @returns {string}
     */
    const buildHtmlTableHead = (htmlArray) => {
        let cls        = '';

        if (doStickyColumns()) {
            cls += 'pivot-sticky-column-2';
        }

        return `
            <thead class="${cls}">
                ${doTableClipping() ? buildTopPaddingHtmlRow() : ''}
                ${buildHtmlTableRows(htmlArray, 0, colAxis.dims - t.rowStart)}
            </thead>
        `;
    };

    /** @description 
     *  @param   {array} htmlArray 
     *  @returns {string}
     */
    const buildHtmlTableBody = (htmlArray) => {
        let cls           = '',
            startRowIndex = 0, //Math.max(0, colAxis.dims  - t.rowStart),
            endRowIndex   = htmlArray.length;

            
        return `
            <tbody class="${cls}">
                ${doTableClipping() ? buildTopPaddingHtmlRow() : ''}
                ${buildHtmlTableRows(htmlArray, startRowIndex, endRowIndex)}
                ${doTableClipping() ? buildBottomPaddingHtmlRow() : ''}
            </tbody>
        `;
    };
    
    /** @description builds an html array from a table of html strings.
     *  @param   {array} htmlArray 
     *  @returns {string}
     */
    const buildHtmlTable = (htmlArray) => {
        let cls      = 'pivot user-select',
            style    = '',
            overflow = 'visible';
        
        cls += layout.displayDensity ? ' displaydensity-' + layout.displayDensity : '';
        cls += layout.fontSize       ? ' fontsize-' + layout.fontSize : '';

        if (doStickyRows()) {
            overflow = 'auto';
        }

        style += `display:flex!important;overflow:${overflow};`;

        return `
            ${doStickyColumns() ? buildHtmlColumnDimensionTable(htmlArray) : ''}
            <div style="${style}">
                ${doStickyRows() ? buildHtmlRowDimensionTable(htmlArray) : ''}
                <table class="${cls}">
                    ${buildHtmlTableBody(htmlArray)}
                </table>
            </div>
        `;
    };

    const buildHtmlColumnDimensionTable = (htmlArray) => {
        let cls   = 'pivot pivot-sticky-column-2',
            rows  = htmlArray.splice(0, colAxis.dims);
        
        return `
            <table class="${cls}">
                ${buildHtmlTableRows(htmlArray, 0, colAxis.dims)}
            </table>
        `;
    }

    /** @description builds html for row dimension
     *  @param   {array} htmlArray 
     *  @returns {string}
     */
    const buildHtmlRowDimensionTable = (htmlArray) => {
        let table = '',
            cls   = '',
            htmlRow;

        if (doStickyRows()) {
            cls += 'pivot pivot-sticky-row';
        }
        
        table += `<table class="${cls}">`;
        
        if (!doShowDimensionLabels() && colAxis.dims > 0) {
            htmlRow     = htmlArray[0].splice(0, rowAxis.dims).join('');
            table      += `<tr style="height:${colAxis.dims * t.cellHeight}px;">${htmlRow}</tr>`;
        }
        
        for (var i = 0; i < htmlArray.length; i++) {
            htmlRow = htmlArray[i].splice(0, rowAxis.dims).join('');
            if (htmlRow.length > 0) {
                table += `<tr>${htmlRow}</tr>`;
            }
        }

        table += '</table>';

        return table;
    }

    /** @description
     *  @param   {object} cell
     *  @param   {number} i
     *  @param   {number} j
     *  @returns {object}
     */
    const checkAxisHiddenParameters = (cell, i, j) => {
        switch (cell.type) {
            case 'labeled': {
                return false;
            }
            
            case 'dimension': {
                return !(cell.oldest || j === 0);
            }

            case 'dimensionSubtotal':
            case 'dimensionTotal': {
                return i !== 0;
            }

            default: {
                return !(i === 0 && j === 0);
            }
        }
    };

    /** @description scans over the row axis, updaring the row span to reflect the current table size.
     */
    const updateRowAxisDimensionSpan = () => {
        const rowSpanLimit = t.rowEnd - t.rowStart + 1;

        for (let i=0, x=t.columnStart, cell; i < rowAxis.dims - t.columnStart; i++, x++) {
            for (let j=0, rowSpanCounter=0; j < currentTable.length; j++) {

                cell = currentTable[j][i];

                if (cell.collapsed) continue;

                cell.rowSpan = getAdjustedRowSpan(cell, x);
                cell.hidden  = checkAxisHiddenParameters(cell, i, j);

                if (j === 0 && cell.type === 'empty') {
                    rowSpanCounter += Math.max(0, colAxis.dims - t.rowStart);
                    continue;
                }

                if (rowSpanCounter >= rowSpanLimit || cell.hidden) {
                    cell.hidden = true;
                    continue;
                }

                if (cell.rowSpan + rowSpanCounter > rowSpanLimit) {
                    cell.rowSpan = rowSpanLimit - rowSpanCounter;
                }

                rowSpanCounter += cell.rowSpan;
            }
        }
    };

    /** @description scans over the column axis, updaring the column span to reflect the current table size.
     */
    const updateColumnAxisDimensionSpan = () => {
        const colSpanLimit = t.columnEnd - t.columnStart + 1;

        for (let i=0, y=t.rowStart, cell; i < colAxis.dims - t.rowStart; i++, y++) {
            for (let j=0, colSpanCounter=0; j < currentTable[i].length; j++) {

                cell = currentTable[i][j];

                if (cell.collapsed) continue;

                cell.colSpan = getAdjustedColSpan(cell, y);
                cell.hidden  = checkAxisHiddenParameters(cell, i, j);

                if (j === 0 && cell.type === 'empty') {
                    colSpanCounter += Math.max(0, rowAxis.dims - t.columnStart);
                    continue;
                }

                if (colSpanCounter >= colSpanLimit || cell.hidden) {
                    cell.hidden = true;
                    continue;
                }

                if (cell.colSpan + colSpanCounter > colSpanLimit) {
                    cell.colSpan = colSpanLimit - colSpanCounter;
                }

                colSpanCounter += cell.colSpan;
            }
        }
    };

    /** @description updates columnd and row dimension spans.
     */
    const updateDimensionSpan = () => {
        updateColumnAxisDimensionSpan();
        updateRowAxisDimensionSpan();
    }

    /** @description
     *  @param {number} columnStart 
     *  @param {number} columnEnd 
     *  @param {number} rowStart 
     *  @param {number} rowEnd 
     */
    const applyChangesToTable = (columnStart, columnEnd, rowStart, rowEnd) => {

        if (t.columnStart > columnStart) {
            t.columnStart--;
            prependTableColumn(t.columnStart, t.rowStart, t.rowEnd);
        }

        if (t.columnEnd < columnEnd) {
            t.columnEnd++;
            appendTableColumn(t.columnEnd, t.rowStart, t.rowEnd);
        }

        if (t.rowStart > rowStart) {
            t.rowStart--;
            prependTableRow(t.rowStart, t.columnStart, t.columnEnd);
        }

        if (t.rowEnd < rowEnd) {
            t.rowEnd++;
            appendTableRow(t.rowEnd, t.columnStart, t.columnEnd);
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
    };

    const renderFull = () => {
        setColumnStart(columnStart);
        setColumnEnd(columnStart + getTableRenderWidth());
    
        setRowStart(rowStart);
        setRowEnd(rowStart + getTableRenderHeight());
        
        currentTable = buildTable();
        
        updateTableParameters();

        let htmlArray = buildHtmlArray();

        return buildHtmlTable(htmlArray);
    }

    /** @description renders table given a rowstart and column start.
     *  @param   {number} [rowStart=0]
     *  @param   {number} [columnStart=0]
     *  @returns {array}
     */
    const renderTable = (rowStart=0, columnStart=0) => {

        if (!doTableClipping()) {
            setColumnStart(0);
            setColumnEnd(tableColumnSize + rowAxis.dims);
        
            setRowStart(0);
            setRowEnd(tableRowSize + colAxis.dims);
        } else {
            setColumnStart(columnStart);
            setColumnEnd(columnStart + getTableRenderWidth());
        
            setRowStart(rowStart);
            setRowEnd(rowStart + getTableRenderHeight());
        }

        currentTable = buildTable();

        console.log(currentTable);

        updateTableParameters();

        let htmlArray = buildHtmlArray();

        return buildHtmlTable(htmlArray);
    };

    /** @description updates the table given a start row and start column.
     *  @param   {number} columnStart 
     *  @param   {number} rowStart 
     *  @returns {array}
     */
    const updateTable = (columnStart, rowStart) => {

        if (rowStart > 0 && !options.skipTitle) {
            rowStart -= 1;
        }

        const columnEnd = getColumnEnd(columnStart),
              rowEnd    = getRowEnd(rowStart);

        const horizontalUpdates = Math.abs(columnStart - t.columnStart),
              verticalUpdates = Math.abs(rowStart - t.rowStart);

        for (let i = 0; i < horizontalUpdates; i++) {
            applyChangesToTable(columnStart, columnEnd, rowStart, rowEnd);
        }

        for (let i = 0; i < verticalUpdates; i++) {
            applyChangesToTable(columnStart, columnEnd, rowStart, rowEnd) ;
        }

        updateTableParameters();

        let htmlArray = buildHtmlArray();

        return buildHtmlTable(htmlArray);
    };

    const buildHtmlArray = () => {
        return arrayClean([].concat(
            options.skipTitle || t.rowStart > 0 ? [] : buildTableTitle(currentTable[0].length) || [],
            buildTableFilter(currentTable[0].length) || [],
            buildHtmlRows(currentTable)
        ));
    };

    const updateTableParameters = () => {

        if (doHideEmptyColumns()) {
            hideEmptyColumns();
        }

        if (doHideEmptyRows()) {
            hideEmptyRows();
        }

        if (doTableClipping()) {
            updateDimensionSpan();
        }
    }
    
    (function() {
        colUniqueFactor = getUniqueFactor(colAxis);
        rowUniqueFactor = getUniqueFactor(rowAxis);
        columnDimensionNames = colAxis.type ? layout.columns.getDimensionNames(response) : [];
        rowDimensionNames = rowAxis.type ? layout.rows.getDimensionNames(response) : [];

        tableRowSize = getTableRowSize();
        tableColumnSize = getTableColumnSize();

        valueLookup = createValueLookup(tableRowSize, tableColumnSize);
        typeLookup  = createTypeLookup(tableRowSize, tableColumnSize);

        console.log("rows:", valueLookup.length, "columns:", valueLookup[0].length, "cells", valueLookup.length * valueLookup[0].length);
    }());

    // constructor
    t.render = renderTable;
    t.update = updateTable;
    t.uuidDimUuidsMap = uuidDimUuidsMap;
    t.sortableIdObjects = sortableIdObjects;

    t.dynamic = doTableClipping();
    t.idValueMap = idValueMap;
    t.tdCount = tdCount;
    t.layout = layout;
    t.response = response;
    t.colAxis = colAxis;
    t.rowAxis = rowAxis;

    t.cellWidth = 120;
    t.cellHeight = 25;

    // public functions
    t.setWindowSize = setWindowSize;
};

PivotTable.prototype.getUuidObjectMap = function() {
    return objectApplyIf((this.colAxis ? this.colAxis.uuidObjectMap || {} : {}), (this.rowAxis ? this.rowAxis.uuidObjectMap || {} : {}));
};




