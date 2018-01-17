import isString from 'd2-utilizr/lib/isString';
import isNumber from 'd2-utilizr/lib/isNumber';
import isObject from 'd2-utilizr/lib/isObject';
import isBoolean from 'd2-utilizr/lib/isBoolean';
import numberConstrain from 'd2-utilizr/lib/numberConstrain';
import objectApplyIf from 'd2-utilizr/lib/objectApplyIf';
import arrayContains from 'd2-utilizr/lib/arrayContains';
import arrayClean from 'd2-utilizr/lib/arrayClean';
import uuid from 'd2-utilizr/lib/uuid';

import { ResponseRowIdCombination } from '../api/ResponseRowIdCombination';

import { isColorBright } from '../util/colorUtils';

import { toRow,
         getPercentageHtml,
         buildTable2D,
         getUniqueFactor,
         addMerge,
         defaultProxyGenerator } from './PivotTableUtils';

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

export /**
 * 
 * 
 * @param {object} refs 
 * @param {object} layout 
 * @param {object} response 
 * @param {object} colAxis 
 * @param {object} rowAxis 
 * @param {object} [options={}] 
 */
const PivotTable = function(refs, layout, response, colAxis, rowAxis, options={}) {

    this.options = {
        renderLimit: 50000,
        forceDynamic: true,
        showColTotals: !!layout.showColTotals,
        showRowTotals: !!layout.showRowTotals,
        showColSubTotals: !!layout.showColSubTotals,
        showRowSubTotals: !!layout.showRowSubTotals,
        hideEmptyRows: !!layout.hideEmptyRows,
        hideEmptyColumns: !!layout.hideEmptyColumns,
        showDimensionLabels: !!layout.showDimensionLabels,
        stickyColumnDimension: !!layout.stickyColumnDimension,
        stickyRowDimension: !!layout.stickyRowDimension,
        showHierarchy: !!layout.showHierarchy,
        numberType: layout.numberType,
        ...options,
    }

    this.cellHeight = 25;
    this.cellWidth = 120;

    this.title = layout.title;
    this.digitGroupSeparator = layout.digitGroupSeparator;

    this.fontSize = layout.fontSize;
    this.displayDensity = layout.displayDensity;

    this.uuidDimUuidsMap = {};    
    this.sortableIdObjects = [];

    this.filters = layout.filters;
    this.layout = layout;
    this.response = response;
    this.appManager = refs.appManager;
    this.optionConfig = refs.optionConfig;
    this.uiManager = refs.uiManager;

    this.legendSet = isObject(layout.legendSet) 
        ? this.appManager.getLegendSetById(layout.legendSet.id) : null;

    this.colAxis = colAxis;
    this.rowAxis = rowAxis;

    this.legendDisplayStyle = layout.legendDisplayStyle;
    this.legendDisplayStrategy = layout.legendDisplayStrategy;
    
    this.visibleEmptyColumns = 0;
    this.visibleEmptyRows = 0;
    this.numberOfEmptyRows = 0;
    this.numberOfEmptyColumns = 0;
};

/**
 * @description Pivot table initialization function, does most of the heavy lifting.
 * 
 */
PivotTable.prototype.initialize = function() {
    this.columnDimensionSize = this.colAxis.dims || 1;
    this.rowDimensionSize = this.rowAxis.dims || 1;

    this.idValueMap = this.response.getIdMap(this.layout, 'value', 'idValueMap');
    this.idFactorMap = this.response.getIdMap(this.layout, 'factor', 'idFactorMap');
    this.idNumeratorMap = this.response.getIdMap(this.layout, 'numerator', 'idNumeratorMap');
    this.idDenominatorMap =  this.response.getIdMap(this.layout, 'denominator', 'idDenominatorMap');

    this.colUniqueFactor = getUniqueFactor(this.colAxis);
    this.rowUniqueFactor = getUniqueFactor(this.rowAxis);

    this.columnDimensionNames = this.colAxis.type
        ? this.layout.columns.getDimensionNames(this.response) : [];
    this.rowDimensionNames = this.rowAxis.type
        ? this.layout.rows.getDimensionNames(this.response) : [];

    this.rowSize = this.getRowSize();
    this.columnSize = this.getColumnSize();
    this.tableSize = this.getTableSize();

    this.rowAxisSpanMap = this.createRowSpanMap();
    this.columnAxisSpanMap = this.createColumnSpanMap();

    this.valueLookup = this.createValueLookup();

    this.rowAxisLookup = this.createRowRenderMap();
    this.columnAxisLookup = this.createColumnRenderMap();
};

// setters
/**
 * Sets the cell width of each cell in the  table.
 * 
 * @param {number} width The width of each cell in pixels
 */
PivotTable.prototype.setCellWidth = function(width) {
    this.cellWidth = width;
};

/**
 * Sets the cell height of each cell in the table.
 * 
 * @param {number} height The height of each cell in pixels
 */
PivotTable.prototype.setCellHeight = function(height) {
    this.cellHeight = height;
};

/**
 * Sets the width of the viewport used to render the table.
 * 
 * @param {number} width The width of the viewport in pixels
 */
PivotTable.prototype.setViewportWidth = function(width) {
    this.viewportWidth = width;
};

/**
 * Sets the height of the viewport used to render the table.
 * 
 * @param {number} height The height of the viewport in pixels
 */
PivotTable.prototype.setViewportHeight = function(height) {
    this.viewportHeight = height;
};

/**
 * Sets the index of where the table will start rendering columns.
 * 
 * @param {number} columnIndex The index of the column to render
 */
PivotTable.prototype.setColumnStart = function(columnIndex) {
    this.columnStart = Math.max(0, columnIndex);
};

/**
 * Sets the index of where the table will start rendering rows.
 * 
 * @param {number} rowIndex The index of the row to render
 */
PivotTable.prototype.setRowStart = function(rowIndex) {
    this.rowStart = Math.max(0, rowIndex);
};

/**
 * Sets the index of where the table will end rendering columns.
 * 
 * @param {number} columnIndex The index of the column to render
 */
PivotTable.prototype.setColumnEnd = function(columnIndex) {
    this.columnEnd = this.constrainWidth(
        Math.min(this.columnSize + this.rowDimensionSize - 1, columnIndex));
};

/**
 * Sets the index of where the table will end rendering rows.
 * 
 * @param {number} rowIndex The index of the row to render
 */
PivotTable.prototype.setRowEnd = function(rowIndex) {
    this.rowEnd = this.constrainHeight(
        Math.min(this.rowSize + this.columnDimensionSize - 1, rowIndex));
};

/**
 * Sets the index of where the table will start rendering columns and calculates and sets
 * the index of where the table will stop rendering columns based on the start index and
 * width of the viewport.
 * 
 * @param {number} columnStartIndex The index of the column to render
 */
PivotTable.prototype.setColumnStartAndEnd = function(columnStartIndex) {
    this.setColumnStart(columnStartIndex);
    this.columnEnd = this.getColumnEnd(columnStartIndex);
};

/**
 * Sets the index of where the table will start rendering rows and calculates and sets
 * the index of where the table will stop rendering rows based on the start index and
 * height of the viewport.
 * 
 * @param {number} rowStartIndex The index of the row to render
 */
PivotTable.prototype.setRowStartAndEnd = function(rowStartIndex) {
    this.setRowStart(rowStartIndex);
    this.rowEnd = this.getRowEnd(rowStartIndex);
};

/**
 * TODO:
 * 
 * @param {number} [width=0] 
 * @param {number} [height=0] 
 */
PivotTable.prototype.setViewportSize = function(width=0, height=0) {
    this.setViewportWidth(width);
    this.setViewportHeight(height);
    this.build();
};

// options
/**
 * Checks the size of the table compared to the render limit set by options.
 * 
 * @returns {boolean}
 */
PivotTable.prototype.doRender = function() {
    return (this.rowAxis.size * this.colAxis.size) > this.options.renderLimit;
};

/**
 * Checks if show total columns option is enabled.
 * 
 * @returns {boolean}
 */
PivotTable.prototype.doColTotals = function() {
    return this.options.showColTotals;
};

/**
 * Checks if show total rows option is enabled.
 * 
 * @returns {boolean}
 */
PivotTable.prototype.doRowTotals = function() {
    return this.options.showRowTotals;
};

/**
 * Checks if show sub total columns option is enabled.
 * 
 * @returns {boolean}
 */
PivotTable.prototype.doColSubTotals = function() {
    return this.options.showColSubTotals &&
        this.rowAxis.type && this.rowDimensionSize > 1;
};

/**
 * Checks if show sub total rows option is enabled.
 * 
 * @returns {boolean}
 */
PivotTable.prototype.doRowSubTotals = function() {
    return this.options.showRowSubTotals &&
        this.colAxis.type && this.columnDimensionSize > 1;
};

/**
 * Checks if column percentage option is enabled.
 * 
 * @returns {boolean}
 */
PivotTable.prototype.doColPercentage = function() {
    return this.options.numberType === this.optionConfig.getNumberType().percentofcolumn.id;
};

/**
 * Checks if row percentage option is enabled.
 * 
 * @returns {boolean}
 */
PivotTable.prototype.doRowPercentage = function() {
    return this.options.numberType === this.optionConfig.getNumberType().percentofrow.id;
};

/**
 * Checks if sortable column headers option is enabled.
 * 
 * @returns 
 */
PivotTable.prototype.doSortableColumnHeaders = function() {
    return this.rowAxis.type && this.rowDimensionSize === 1;
};

/**
 * Checks if hide empty columns option is enabled.
 * 
 * @returns {boolean}
 */
PivotTable.prototype.doHideEmptyRows = function() {
    return this.options.hideEmptyRows &&
        this.colAxis.type && this.rowAxis.type;
};

/**
 * Checks if hide empty rows option is enabled.
 * 
 * @returns {boolean}
 */
PivotTable.prototype.doHideEmptyColumns = function() {
    return this.options.hideEmptyColumns &&
        this.colAxis.type && this.rowAxis.type;
};

/**
 * Checks if show dimension labels option is enabled.
 * 
 * @returns {boolean}
 */
PivotTable.prototype.doShowDimensionLabels = function() {
    return this.options.showDimensionLabels
};

/**
 * Checks if dynamic table rendering option should be enabled.
 * 
 * @returns {boolean}
 */
PivotTable.prototype.doDynamicRendering = function() {
    return this.doRender() || this.options.forceDynamic;
};

/**
 * Checks if sticky columns option should be enabled.
 * 
 * @returns {boolean}
 */
PivotTable.prototype.doStickyColumns = function() {
    return this.options.stickyColumnDimension;
};

/**
 * Checks if sticky rows option should be enabled.
 * 
 * @returns {boolean}
 */
PivotTable.prototype.doStickyRows = function() {
    return this.options.stickyRowDimension;
};

/**
 * Checks if show hierarchy option should be enabled.
 * 
 * @returns {boolean}
 */
PivotTable.prototype.doShowHierarchy = function() {
    return this.options.showHierarchy;
};

/**
 * //TODO:
 * 
 * @returns {boolean}
 */
PivotTable.prototype.doLegendDisplayByDataItem = function() {
    return this.legendDisplayStrategy === this.getLegendDisplayStrategyId('by_data_item');
};

/**
 * //TODO:
 * 
 * @returns {boolean}
 */
PivotTable.prototype.doLegendDisplay = function() {
    return this.legendDisplayStrategy !== this.getLegendDisplayStrategyId('fixed');
};

/**
 * //TODO:
 * 
 * @returns {boolean}
 */
PivotTable.prototype.doLegendDisplayStyleFill = function() {
    return this.legendDisplayStyle === this.getLegendDisplayStyleId('fill');
};

/**
 * //TODO:
 * 
 * @returns {boolean}
 */
PivotTable.prototype.doLegendDisplayStyleText = function() {
    return this.legendDisplayStyle === this.getLegendDisplayStyleId('text');
};

// checkers
/**
 * Checks if column located at columnIndex is a sub total column.
 * 
 * @param {number} columnIndex 
 * @returns {boolean}
 */
PivotTable.prototype.isColumnSubTotal = function(columnIndex) {
    return this.doRowSubTotals() && (columnIndex + 1) % (this.colUniqueFactor + 1) === 0;
};

/**
 * Checks if column located at columnIndex is a total column.
 * 
 * @param {number} columnIndex 
 * @returns {boolean}
 */
PivotTable.prototype.isColumnGrandTotal = function(columnIndex) {
    return this.doRowTotals() && columnIndex === this.getColumnSize() - 1;
};

/**
 * Checks if row located at rowIndex is a sub total row.
 * 
 * @param {number} rowIndex 
 * @returns {boolean}
 */
PivotTable.prototype.isRowSubTotal = function(rowIndex) {
    return this.doColSubTotals() && (rowIndex + 1) % (this.rowUniqueFactor + 1) === 0;
};

/**
 * Checks if row located at rowIndex is a sub total row.
 * 
 * @param {number} rowIndex 
 * @returns {boolean}
 */
PivotTable.prototype.isRowGrandTotal = function(rowIndex) {
    return this.doColTotals() && rowIndex === this.rowSize - 1;
};

/**
 * Checks if row located at rowIndex is empty.
 * 
 * @param {number} rowIndex 
 * @returns {boolean}
 */
PivotTable.prototype.isRowEmpty = function(rowIndex) {
    return this.valueLookup[rowIndex][this.columnSize - 1] <= 0;
};

/**
 * Checks if column located at columnIndex is empty.
 * 
 * @param {number} columnIndex 
 * @returns {boolean}
 */
PivotTable.prototype.isColumnEmpty = function(columnIndex) {
    return this.valueLookup[this.rowSize - 1][columnIndex] <= 0;
};

/**
 * //TODO:
 * 
 * @param {string} type 
 * @returns 
 */
PivotTable.prototype.isTextField = function(type) {
    return !arrayContains(['dimension', 'filter'], type);
};

// getters

PivotTable.prototype.getValueTableWidth = function() {
    return this.valueLookup[0].length;
};

PivotTable.prototype.getValueTableHeigth = function() {
  return this.valueLookup.length;
};

PivotTable.prototype.getAdjustedAxisSpan = function(cell, index, axisType, spanType) {
    if (cell.children) {
        return cell.oldestSibling.children *
            this[axisType].span[index + 1] - cell.siblingPosition;
    }

    return cell[spanType];
};

PivotTable.prototype.getAdjustedColSpan = function(cell, y) {
    return this.getAdjustedAxisSpan(cell, y, 'colAxis', 'colSpan');
};

PivotTable.prototype.getAdjustedRowSpan = function(cell, x) {
    return this.getAdjustedAxisSpan(cell, x, 'rowAxis', 'rowSpan');
};

/**
 * Gets the row index where the values start below the column
 * axis.
 * 
 * @returns {number}
 */
PivotTable.prototype.getValueStartRowIndex = function() {
    return Math.max(0, this.columnDimensionSize - this.rowStart);
};

/**
 * Gets the column index where the values start to the right of the row
 * axis.
 * 
 * @returns {number}
 */
PivotTable.prototype.getValueStartColumnIndex = function() {
    return Math.max(0, this.rowDimensionSize - this.columnStart);
};

/**
 * Gets the amount of offset needed to get to row values,
 * this is used to get values out of the value lookup table.
 * 
 * @returns {number}
 */
PivotTable.prototype.getValueOffsetRow = function() {
    return Math.max(0, this.rowStart - this.columnDimensionSize);
};

/**
 * Gets the amount of offset needed to get to column values,
 * this is used to get values out of the value lookup table.
 * 
 * @returns {number}
 */
PivotTable.prototype.getValueOffsetColumn = function() {
    return Math.max(0, this.columnStart - this.rowDimensionSize);
};

/**
 * Gets the row span of a given dimension.
 * 
 * @param {number} rowIndex index of row axis
 * @param {number} dimensionId dimension of row axis
 * @returns {number}
 */
PivotTable.prototype.getRowAxisSpan = function(rowIndex, dimensionId) {
    return this.rowAxisSpanMap[dimensionId][Math.floor(rowIndex / this.rowAxis.span[dimensionId])];
};

/**
 * Gets a modified version of the given dimensin row span based on the current
 * table state.
 * 
 * @param {number} valueRowIndex 
 * @param {number} tableRowIndex 
 * @param {number} offset 
 * @returns 
 */
PivotTable.prototype.getUpdatedRowSpan = function(valueRowIndex, tableRowIndex, offset) {
    return (this.getRowAxisSpan(valueRowIndex, tableRowIndex)) + offset - 
        (valueRowIndex % this.rowAxis.span[tableRowIndex])
};

/**
 * Gets the column span of a given dimension.
 * 
 * @param {number} columnIndex index of column axis
 * @param {number} dimensionId dimension of column axis
 * @returns {number}
 */
PivotTable.prototype.getColAxisSpan = function(columnIndex, dimensionId) {
    return this.columnAxisSpanMap[dimensionId][Math.floor(columnIndex / this.colAxis.span[dimensionId])];
};

/**
 * Gets a modified version of the given dimensin column span based on the current
 * table state.
 * 
 * @param {number} valueColumnIndex 
 * @param {number} tableColumnIndex 
 * @param {number} offset 
 * @returns 
 */
PivotTable.prototype.getUpdatedColSpan = function(valueColumnIndex, tableColumnIndex, offset) {
    return this.getColAxisSpan(valueColumnIndex, tableColumnIndex) + offset - 
        (valueColumnIndex % this.colAxis.span[tableColumnIndex])
};

/**
 * Calculates true total values
 * 
 * @param {any} numerator 
 * @param {any} denominator 
 * @param {any} factor 
 * @returns 
 */
PivotTable.prototype.getTrueTotal = function(numerator, denominator, factor) {
    return numerator * factor / denominator;
};

/**
 * Gets record names
 * 
 * @returns {array}
 */
PivotTable.prototype.getRecordNames = function() {
    return this.filters.getRecordNames(false, this.response, true);
};

/**
 * Gets the row axis object at given row index and column index.
 * 
 * @param {number} columnIndex column index of axis object
 * @param {number} rowIndex row index of axis object
 * @returns {object}
 */
PivotTable.prototype.getRowAxisObject = function(columnIndex, rowIndex) {
    return this.rowAxis.objects.all[columnIndex][rowIndex];
};

/**
 * Gets the column axis object at given row index and column index.
 * 
 * @param {number} rowIndex row index of axis object
 * @param {number} columnIndex column index of axis object
 * @returns {object}
 */
PivotTable.prototype.getColumnAxisObject = function(rowIndex, columnIndex) {
    return this.colAxis.objects.all[rowIndex][columnIndex];
};

/**
 * Gets the total of the row at given index
 * 
 * @param {number} rowIndex index of row to find total
 * @returns {number}
 */
PivotTable.prototype.getRowTotal = function(rowIndex) {
    return this.valueLookup[rowIndex][this.columnSize - 1];
};

/**
 * Gets the total of the column at given index
 * 
 * @param {number} columnIndex index of column to find total
 * @returns {number}
 */
PivotTable.prototype.getColumnTotal = function(columnIndex) {
    return this.valueLookup[this.rowSize - 1][columnIndex];
};

/**
 * Gets the visual representation of a table cell.
 * 
 * @param {object} cell 
 * @returns {string}
 */
PivotTable.prototype.getHtmlValue = function(cell) {
    if (cell.collapsed) {
        return '';
    }
    
    return this.isTextField(cell.type) ? 
        this.getPrettyHtml(cell.htmlValue) : cell.htmlValue;
};

/**
 * gets pretty print of given string.
 * 
 * @param {string} htmlValue 
 * @returns {string}
 */
PivotTable.prototype.getPrettyHtml = function(htmlValue) {
    return this.optionConfig.prettyPrint(htmlValue, this.digitGroupSeparator);
};

/**
 * TODO:
 * 
 * @param {string} type 
 * @returns {number}
 */
PivotTable.prototype.getLegendDisplayStrategyId = function(type) {
    return this.optionConfig.getLegendDisplayStrategy(type).id;
};

/**
 * TODO:
 * 
 * @param {string} type 
 * @returns {number}
 */
PivotTable.prototype.getLegendDisplayStyleId = function(type) {
    return this.optionConfig.getLegendDisplayStyle(type).id;
};

/**
 * Gets the next total column index.
 * 
 * @returns {number}
 */
PivotTable.prototype.getNextTotalColumnIndex = function() {
    return this.columnSize - 1;
};

/**
 * Gets the next total row index.
 * 
 * @returns {number}
 */
PivotTable.prototype.getNextTotalRowIndex = function() {
    return this.rowSize - 1;
};

/**
 * Gets the width of the viewport used to render the table.
 * 
 * @returns {number}
 */
PivotTable.prototype.getViewportWidth = function() {
    return this.viewportWidth;
};

/**
 *  Gets the height of the viewport used to render the table.
 * 
 * @returns {number}
 */
PivotTable.prototype.getViewportHeight = function() {
    return this.viewportHeight;
};

/**
 * Gets the number of cells that can be rendered horizontally within the viewport
 * with offset for additional cells.
 * 
 * @param {number} [offset=1] Number of additional cells to be rendered horizontally
 * @returns {number}
 */
PivotTable.prototype.getViewportWidthIndex = function(offset=1) {
    return Math.floor(this.viewportWidth / this.cellWidth) + offset;
};

/**
 * Gets the number of cells that can be rendered vertically within the viewport
 * with offset for additional cells.
 * @param {number} [offset=1] Number of additional cells to be rendered vertically
 * @returns {number}
 */
PivotTable.prototype.getViewportHeightIndex = function(offset=1) {
    return Math.floor(this.viewportHeight / this.cellHeight) + offset;
};

/**
 * Gets the height of the entire table in number of cells
 * including total and sub total rows.
 * 
 * @returns {number}
 */
PivotTable.prototype.getRowAxisSize = function() {
    return this.rowSize + this.columnDimensionSize - 1;
};

/**
 * Gets the width of the entire table in number of cells
 * including total and sub total columns.
 * 
 * @returns {number}
 */
PivotTable.prototype.getColumnAxisSize = function() {
    return this.columnSize + this.rowDimensionSize - 1;
};

/**
 * Gets the number of row axis dimensions.
 * 
 * @returns {number}
 */
PivotTable.prototype.getRowDimensionSize = function() {
    return this.rowDimensionSize || 0;
};

/**
 * Gets the number of column axis dimensions.
 * 
 * @returns {number}
 */
PivotTable.prototype.getColumnDimensionSize = function() {
    return this.columnDimensionSize || 0;
};

/**
 * Gets the amount of padding needed to finish the unrendered 
 * top of the table. Padding is returned in number of pixels.
 * 
 * @returns {number}
 */
PivotTable.prototype.getTopPadding = function() {
    let padding = this.rowStart * this.cellHeight;

    if (!this.options.skipTitle && this.rowStart > 0) {
        padding += this.cellHeight;
    }

    return padding;
};

/**
 * Gets the amount of padding needed to finish the unrendered 
 * left of the table. Padding is returned in number of pixels.
 * 
 * @returns {number}
 */
PivotTable.prototype.getLeftPadding = function() {
    return this.columnStart * this.cellWidth;
};

/**
 * Gets the amount of padding needed to finish the unrendered 
 * right of the table. Padding is returned in number of pixels.
 * 
 * @returns {number}
 */
PivotTable.prototype.getBottomPadding = function() {
    return (this.rowSize - this.rowEnd - this.numberOfEmptyRows) * this.cellHeight;
};

/**
 * Gets the amount of padding needed to finish the unrendered 
 * bottom of the table. Padding is returned in number of pixels.
 * 
 * @returns {number}
 */
PivotTable.prototype.getRightPadding = function() {
    return (this.columnSize - this.columnEnd - this.numberOfEmptyColumns) * this.cellWidth;
};

/**
 * Gets the legend set id.
 * 
 * @param {string} dxId 
 * @returns {string}
 */
PivotTable.prototype.getLegendSetId = function(dxId) {
    return this.response.metaData.items[dxId].legendSet;
};

/**
 * Gets a value object used to calcualte correct totals
 * and fill up the value lookup table.
 * 
 * @param {number} rowIndex row index of value
 * @param {number} columnIndex column index of value
 * @returns {object}
 */
PivotTable.prototype.getValueObject = function(rowIndex, columnIndex) {
    const id = this.getRRIC(rowIndex, columnIndex).get();
    return {
        value: this.getValue(id),
        numerator: this.getNumeratorValue(id),
        denominator: this.getDenominatorValue(id),
        factor: this.getFactorValue(id),
    };
};

/**
 * TODO:
 * 
 * @param {string} id 
 * @returns 
 */
PivotTable.prototype.getValue = function(id) {

    const value = this.idValueMap[id],
          n = parseFloat(value);

    if (isBoolean(value)) {
        return 1;
    }

    if (!isNumber(n) || n != value) {
        return  0;
    }
    
    return n;
};

PivotTable.prototype.getFactorValue = function(id) {
    return parseFloat(this.idFactorMap[id]) || 1;
};

PivotTable.prototype.getNumeratorValue = function(id) {
    return parseFloat(this.idNumeratorMap[id]) || this.getValue(id);
};

PivotTable.prototype.getDenominatorValue = function(id) {
    return parseFloat(this.idDenominatorMap[id]) || 0;
};

// PivotTable.prototype.getRowSize = function() {
//     return this.getAxisSize(this.rowAxis, this.rowUniqueFactor, this.doRowSubTotals(), this.doRowTotals())
// };

// PivotTable.prototype.getColumnSize = function() {
//     return this.getAxisSize(this.colAxis, this.colUniqueFactor, this.doColSubTotals(), this.doColTotals())
// };

PivotTable.prototype.getRowSize = function() {

    if (!this.rowAxis.size) {
        return 1;
    }

    let size = this.rowAxis.size;

    if (this.doColSubTotals())  {
        size += this.rowAxis.size / this.rowUniqueFactor;
    }
    
    if (this.doColTotals()) {
        size += 1;    
    }
    
    return size;
};

PivotTable.prototype.getColumnSize = function() {

    if (!this.colAxis.size) {
        return 1;
    }

    let size = this.colAxis.size;
    
    if (this.doRowSubTotals()) {
        size += this.colAxis.size / this.colUniqueFactor;
    }

    if (this.doRowTotals()) {
        size += 1;
    }
    
    return size;
};

PivotTable.prototype.getAxisSize = function(axis, uniqueFactor, doSubTotals, doTotals) {

    if (!axis.size) {
        return 1;
    }

    let size = axis.size;

    if (doSubTotals)  {
        size += axis.size / uniqueFactor;
    }
    
    if (doTotals) {
        size += 1;    
    }
    
    return size;
};


/**
 * Gets the size of the entire table in number of cells.
 * 
 * @returns {nubmer}
 */
PivotTable.prototype.getTableSize = function(){
    return this.rowSize * this.columnSize;
};

/**
 * Gets the next sub column index from given column index.
 * 
 * @param {number} columnIndex 
 * @returns {number}
 */
PivotTable.prototype.getNextSubColumnIndex = function(columnIndex) {
    return columnIndex + Math.floor(columnIndex / this.colUniqueFactor) +
        (this.colUniqueFactor - (columnIndex % this.colUniqueFactor));
};

/**
 * Gets the next sub row index from given row index.
 * 
 * @param {number} rowIndex 
 * @returns {number}
 */
PivotTable.prototype.getNextSubRowIndex = function(rowIndex) {
    return rowIndex + Math.floor(rowIndex / (this.rowUniqueFactor)) +
        (this.rowUniqueFactor - (rowIndex % this.rowUniqueFactor));
};

/**
 * TODO:
 * 
 * @returns {object}
 */
PivotTable.prototype.getUuidObjectMap = function() {
    return objectApplyIf(
        (this.colAxis ? this.colAxis.uuidObjectMap || {} : {}),
        (this.rowAxis ? this.rowAxis.uuidObjectMap || {} : {})
    );
};

/**
 * 
 * 
 * @param {number} columnIndex 
 * @returns {number}
 */
PivotTable.prototype.getColumnEnd = function(columnIndex) {
    return this.doDynamicRendering() ? 
        this.constrainWidth(this.getViewportWidthIndex() + columnIndex) : this.getColumnAxisSize();
};
    
/**
 * TODO:
 * 
 * @param {number} [rowIndex=this.rowStart] 
 * @returns {number}
 */
PivotTable.prototype.getRowEnd = function(rowIndex=this.rowStart) {
    return this.doDynamicRendering() ?
        this.constrainHeight(this.getViewportHeightIndex() + rowIndex) : this.getRowAxisSize();
};

/**
 * TODO:
 * 
 * @param {number} index 
 * @returns {string}
 */
PivotTable.prototype.getRowSortId = function(index) {
    if (this.doSortableColumnHeaders() && index === this.columnDimensionSize - 1 ) {
        return this.colAxis.ids[index];
    }
    return null;
};

/**
 * Gets the label for the column axis at given index
 * 
 * @param {number} index 
 * @returns {string}
 */
PivotTable.prototype.getColumnAxisLabel = function(index) {
    if (this.columnDimensionSize) {
        return this.response.getNameById(this.columnDimensionNames[index]);
    }
    return null;
};

/**
 * Gets the label for the row axis at given index
 * 
 * @param {number} index 
 * @returns {string}
 */
PivotTable.prototype.getRowAxisLabel = function(index) {
    if (this.rowDimensionSize) {
        return this.response.getNameById(this.rowDimensionNames[index]);    
    }
    return null;
};

/**
 * 
 * 
 * @returns {string}
 */
PivotTable.prototype.getCrossAxisLabel = function() {
    let colAxisLabel = this.getColumnAxisLabel(this.columnDimensionSize - 1),
        rowAxisLabel = this.getRowAxisLabel(this.rowDimensionSize - 1);

    if (!this.rowAxis.type) {
        return colAxisLabel;
    }

    if (!this.colAxis.type) {
        return rowAxisLabel;
    }

    if (colAxisLabel) {
        rowAxisLabel += '&nbsp;/&nbsp;' + colAxisLabel;
    }

    return rowAxisLabel;
};

PivotTable.prototype.getTopBarSpan = function(span) {
    let rowDims = this.rowDimensionSize || 0;

    if (!this.colAxis.type && this.rowAxis.type) {
        return rowDims + 1;
    }

    return span;
};

PivotTable.prototype.getRRIC = function(rowIndex, columnIndex) {
    const rric = new ResponseRowIdCombination();
    
    if (this.colAxis.type) rric.add(this.colAxis.ids[columnIndex]);
    if (this.rowAxis.type) rric.add(this.rowAxis.ids[rowIndex]);

    return rric;
};

PivotTable.prototype.getCellUuids = function(rowIndex, columnIndex) {
    let uuids = [];

    if (this.colAxis.type) {
        uuids = uuids.concat(this.colAxis.objects.all[this.colAxis.dims - 1][rowIndex].uuids);
    }

    if (this.rowAxis.type) {
        uuids = uuids.concat(this.rowAxis.objects.all[this.rowAxis.dims - 1][columnIndex].uuids);  
    }

    return uuids;
};

PivotTable.prototype.getValueCell = function(columnIndex, rowIndex) {
    return this.cellMap[this.rowAxisLookup[rowIndex]][this.columnAxisLookup[columnIndex]];
};

PivotTable.prototype.getRowPercentage = function(value, rowIndex) {
    return getPercentageHtml(value, this.getRowTotal(rowIndex));
};

PivotTable.prototype.getColumnPercentage = function(value, columnIndex) {
    return getPercentageHtml(value, this.getColumnTotal(columnIndex));
};

// Table Modifiers
/**
 * Adds a column to the right side of the table.
 * 
 * @param {number} columnIndex index of column to render
 * @param {number} rowStart index of the first row of the column
 * @param {number} rowEnd  index of the last row of the column
 */
PivotTable.prototype.addRight = function(columnIndex, rowStart, rowEnd) {
    const column = this.buildColumn(columnIndex, rowStart, rowEnd);
    for (let i = 0; i < column.length; i++) {
        this.table[i].push(column[i]);
    }
};

/**
 * Adds a column to the left side of the table.
 * 
 * @param {number} columnIndex index of column to render
 * @param {number} rowStart index of the first row of the column
 * @param {number} rowEnd index of the last row of the column
 */
PivotTable.prototype.addLeft = function(columnIndex, rowStart, rowEnd) {
    const column = this.buildColumn(columnIndex, rowStart, rowEnd);
    for (let i = 0; i < column.length; i++) {
        this.table[i].unshift(column[i]);
    }
};

/**
 * Adds a row to the top side of the table.
 * 
 * @param {number} rowIndex index of row to render
 * @param {number} columnStart index of the first column of the row
 * @param {number} columnEnd index of the last column of the row
 */
PivotTable.prototype.addTop = function(rowIndex, columnStart, columnEnd) {
    this.table.unshift(this.buildRow(rowIndex, columnStart, columnEnd))
};

/**
 * Adds a row to the bottom side of the table.
 * 
 * @param {number} rowIndex index of row to render
 * @param {number} columnStart index of the first column of the row
 * @param {number} columnEnd index of the last column of the row
 */
PivotTable.prototype.addBottom = function(rowIndex, columnStart, columnEnd) {
    this.table.push(this.buildRow(rowIndex, columnStart, columnEnd));
};

/**
 * Removes a column from the left side of the table.
 * 
 */
PivotTable.prototype.deleteLeft = function() {
    for (let i = 0; i < this.table.length; i++) {
        this.table[i].shift();
    }
};

/**
 * Removes a column from the right side of the table.
 * 
 */
PivotTable.prototype.deleteRight = function() {
    for (let i = 0; i < this.table.length; i++) {
        this.table[i].pop();
    }
};

/**
 * Removes a column from the top side of the table.
 * 
 */
PivotTable.prototype.deleteTop = function() {
    this.table.shift();
};

/**
 * Removes a column from the bottom side of the table.
 * 
 */
PivotTable.prototype.deleteBottom = function() {
    this.table.pop();
};

/**
 * Removes row of given index from the table.
 * 
 * @param {number} rowIndex index of row to be removed
 */
PivotTable.prototype.deleteRow = function(rowIndex) {
    this.table.splice(rowIndex, 1);
};

/**
 * Removes column of given index from the table.
 * 
 * @param {number} columnIndex index of column to be removed
 */
PivotTable.prototype.deleteColumn = function(columnIndex) {
    for (let i = 0; i < this.table.length; i++) {
        this.table[i].splice(columnIndex, 1);
    }
};

// Table Bulders
PivotTable.prototype.buildRow = function(rowIndex, columnStart, columnEnd) { 
    let rowAxisRow = [];

    if (rowIndex < this.columnDimensionSize) {
        return this.buildColumnAxisRow(rowIndex, columnStart, columnEnd + 1);
    }

    rowIndex -= this.columnDimensionSize;

    if (columnStart < this.rowDimensionSize) {
        rowAxisRow = this.buildRowAxisRow(rowIndex, columnStart);
        columnStart = 0;
    } else {
        columnStart -= this.rowDimensionSize;
    }

    //TODO: 
    columnEnd -= (this.rowDimensionSize - 1);

    return rowAxisRow.concat(this.buildValueRow(rowIndex, columnStart, columnEnd));
};

PivotTable.prototype.buildColumn = function(columnIndex, rowStart, rowEnd) {
    let columnAxis = this.buildColumnAxisColumn(columnIndex, rowStart);
    
    if (columnIndex < this.rowDimensionSize) {
        return columnAxis.concat(this.buildRowAxisColumn(columnIndex, rowStart, rowEnd + 1));
    }

    columnIndex -= this.rowDimensionSize;

    if (rowStart < this.columnDimensionSize) {
        rowStart = 0;
    } else {
        rowStart -= this.columnDimensionSize;
    }

    //TODO:
    rowEnd -= (this.columnDimensionSize - 1)

    return columnAxis.concat(this.buildValueColumn(columnIndex, rowStart, rowEnd));
};

// Value Table Builders
PivotTable.prototype.buildValueRow = function(rowIndex, columnStart, columnEnd) {
    const row = [];

    for (let i=0, x=columnStart, cell; x < columnEnd; i++, x++) {
        cell = this.buildValueCell(x, rowIndex);
        if (cell) { //TODO: Is this needed?
            row[i] = cell;
        } 
    }

    return row;
};

PivotTable.prototype.buildValueColumn = function(columnIndex, rowStart, rowEnd) {
    const column = [];
    
    for (let i=0, y=rowStart; y < rowEnd; i++, y++) {
        column[i] = this.buildValueCell(columnIndex, y);
    }

    return column;
};

PivotTable.prototype.buildValueCell = function(columnIndex, rowIndex) {

    //TODO: check this
    if (this.doDynamicRendering()) {
        rowIndex = this.rowAxisLookup[rowIndex];
        columnIndex = this.columnAxisLookup[columnIndex];
    }

    let value = this.valueLookup[rowIndex][columnIndex],
        htmlValue = null;

    if (this.doColPercentage()) {
        htmlValue = this.getColumnPercentage(value, columnIndex);  
    }
    
    if (this.doRowPercentage()) {
        htmlValue = this.getRowPercentage(value, rowIndex);
    }

    if (this.isRowGrandTotal(rowIndex) || this.isColumnGrandTotal(columnIndex)) {
        return ValueTotalCell(value, htmlValue);
    }

    if (this.isColumnSubTotal(columnIndex) || this.isRowSubTotal(rowIndex)) {
        return ValueSubTotalCell(value, htmlValue);
    }

    if (!value) {
        return PlainValueCell(value);
    }

    let rowIndexOffset = this.normalizeRowIndex(rowIndex),
        columnIndexOffset = this.normalizeColumnIndex(columnIndex),
        cell = ValueCell(value, this.response, this.getRRIC(rowIndexOffset, columnIndexOffset), this.getCellUuids(columnIndexOffset, rowIndexOffset), htmlValue);

    this.uuidDimUuidsMap[cell.uuid] = cell.uuids;

    return cell; 
};

// Row Axis Builders
PivotTable.prototype.buildRowAxis = function(rowStart, rowEnd, columnStart) {
    const axis = [];

    if (!this.rowAxis.type) {
        if (this.doShowDimensionLabels()) {
            axis[0] = [DimensionEmptyCell(1, 1, false, 'visibility: hidden;')];
        }
        return axis;
    }
    
    for (let i=0,y=rowStart; y <= rowEnd - this.columnDimensionSize; i++, y++) {
        axis[i] = this.buildRowAxisRow(y, columnStart);
    }

    return axis;
};

PivotTable.prototype.buildRowAxisRow = function(rowIndex, columnStart) {
    if (this.rowDimensionSize < columnStart) {
        return [];
    }

    if (!this.rowAxis.type) {
        return [DimensionEmptyCell(1, 1, false, 'visibility: hidden;')];
    }

    const row = [];

    for (let i = 0, x = columnStart; x < this.rowDimensionSize; i++, x++) {
        row[i] = this.buildRowAxisCell(x, rowIndex);
    }

    return row;
};

PivotTable.prototype.buildColumnAxisRow = function(rowIndex, columnStart, columnEnd) {
    if (this.columnDimensionSize < rowIndex) {
        return [];
    }

    const row = [];

    if (columnStart < this.rowDimensionSize) {
        Object.assign(row, this.buildCornerAxisRow(rowIndex, columnStart));
    }

    columnStart += row.length
    columnStart -= this.rowDimensionSize;
    columnEnd -= this.rowDimensionSize;

    for (let i = row.length; columnStart < columnEnd; i++, columnStart++) {
        row[i] = this.buildColumnAxisCell(rowIndex, columnStart);
    }

    return row;
};

PivotTable.prototype.buildRowAxisColumn = function(columnIndex, rowStart, rowEnd) {
    
    const column = [];
    
    if (this.rowDimensionSize < columnIndex) {
        return column;
    }

    if (!this.rowAxis.type) {
        for (let i = 0; i < rowEnd - rowStart; i++) {
            column[i] = DimensionEmptyCell(1, 1, false, 'visibility: hidden;');
        }
        return column;
    }

    rowEnd -= this.columnDimensionSize;

    for (let i=0, y=rowStart; y < rowEnd; i++, y++) {
        column[i] = this.buildRowAxisCell(columnIndex, y);
    }

    return column;
};

PivotTable.prototype.buildSubTotalAxisRow = function(columnStart) {
    const row = [
        DimensionSubTotalCell('&nbsp;', this.rowDimensionSize - columnStart, 1, true, false)
    ];

    for (let i=1, x=columnStart + 1; x < this.rowDimensionSize; i++, x++) {
        row[i] = DimensionSubTotalCell('&nbsp;', this.rowDimensionSize - x, 1, true, true);
    }

    return row;
};

PivotTable.prototype.buildGrandTotalAxisRow = function(columnStart) {
    const row = [
        DimensionGrandTotalCell('Total', this.rowDimensionSize - columnStart, 1, false, false)
    ];

    for (let i=1, x=columnStart + 1; x < this.rowDimensionSize; i++, x++) {
        row[i] = DimensionSubTotalCell('&nbsp;', this.rowDimensionSize - x, 1, true, true);
    }

    return row;
};


PivotTable.prototype.buildRowAxisCell = function(columnIndex, rowIndex) {

    //TODO: check this
    if (this.doDynamicRendering()) {
        rowIndex = this.rowAxisLookup[rowIndex];
        // columnIndex = this.columnAxisLookup[columnIndex];
    }

    if (this.isRowSubTotal(rowIndex)) {
        return DimensionSubTotalCell('&nbsp;', 
            this.rowDimensionSize - columnIndex, 1, true, columnIndex !== this.columnStart);
    }

    if (this.isRowGrandTotal(rowIndex)) {
        return DimensionGrandTotalCell(columnIndex === 0 ? 
            'Total' : '&nbsp;', this.rowDimensionSize - columnIndex, 1, columnIndex !== 0, columnIndex !== 0, columnIndex !== 0)
    }

    return RowAxisCell(
        this.getRowAxisObject(columnIndex, this.normalizeRowIndex(rowIndex)),
        this.response,
        this.doShowHierarchy());
};


PivotTable.prototype.buildColumnAxisCell = function(rowIndex, columnIndex) {

    //TODO: check this
    if (this.doDynamicRendering()) {
        // rowIndex = this.rowAxisLookup[rowIndex];
        columnIndex = this.columnAxisLookup[columnIndex];
    }

    if (this.isColumnSubTotal(columnIndex)) {
        return DimensionSubTotalCell('&nbsp;', 1, 
            this.columnDimensionSize - rowIndex, true, rowIndex !== this.rowStart)
    }
    
    if (this.isColumnGrandTotal(columnIndex)) {        
        return DimensionGrandTotalCell(rowIndex === 0 ? 
            'Total' : '&nbsp;', 1, this.columnDimensionSize - rowIndex, 
            rowIndex === this.rowStart && this.doSortableColumnHeaders(), columnIndex !== 0)
    }

    return ColumnAxisCell(
        this.getColumnAxisObject(rowIndex, this.normalizeColumnIndex(columnIndex)),
        this.response,
        this.doShowHierarchy(),
        this.getRowSortId(rowIndex));
};

// Column Axis Builders
PivotTable.prototype.buildColumnAxis = function(columnStart, columnEnd, rowStart) {
    if (!this.colAxis.type) {
        return this.buildCornerAxisRow(0, 0);
    }

    const axis = [];

    for (let i=0, x=columnStart; x <= columnEnd; i++, x++) {
        axis[i] = this.buildColumnAxisColumn(x, rowStart);
    }

    return axis;
};

PivotTable.prototype.buildColumnAxisColumn = function(columnIndex, rowStart) {
    if (this.columnDimensionSize < rowStart) {
        return [];
    }
    
    if (columnIndex < this.rowDimensionSize) {
        return this.buildCornerAxisColumn(columnIndex, rowStart);
    }

    columnIndex -= this.rowDimensionSize;

    const column = [];

    for (let i=0, y=rowStart; y < this.columnDimensionSize; i++, y++) {
        column[i] = this.buildColumnAxisCell(y, columnIndex);
    }

    return column;
};

PivotTable.prototype.buildSubTotalAxisColumn = function(rowStart) {
    const column = [
        DimensionSubTotalCell('&nbsp;', 1, this.columnDimensionSize - rowStart, true, false)
    ];

    for (let i=1, y=rowStart + 1; y < this.columnDimensionSize; i++, y++) {
        column[i] = DimensionSubTotalCell('&nbsp;', 1, this.columnDimensionSize - y, true, true);
    }

    return column;
};

PivotTable.prototype.buildGrandTotalAxisColumn = function(rowStart) {
    const column = [
        DimensionGrandTotalCell('Total', 1, this.columnDimensionSize - rowStart, false, false)
    ];

    for (let i=1, y=rowStart + 1; y < this.columnDimensionSize; i++, y++) {
        column[i] = DimensionSubTotalCell('&nbsp;', 1, this.columnDimensionSize - y, true, true);
    }

    return column;
};

// Corner Axis Bulder
PivotTable.prototype.buildCornerAxis = function() {
    const cornerAxis = [];

    for (let i=0; i < this.columnDimensionSize; i++) {
        cornerAxis[i] = this.buildCornerAxisRow(i, 0);
    }

    return cornerAxis;
};

PivotTable.prototype.buildCornerAxisColumn = function(columnIndex, rowStart) {
    const column = [];

    if (!this.doShowDimensionLabels()) {
        column[0] = DimensionEmptyCell(this.rowDimensionSize - columnIndex, this.columnDimensionSize - rowStart, columnIndex !== this.columnStart);
        for (let i=1, y=rowStart + 1; y < this.columnDimensionSize; i++, y++) {
            column[i] = DimensionEmptyCell(this.rowDimensionSize - columnIndex, this.columnDimensionSize - y, true);
        }
        return column;
    }

    if (columnIndex === this.rowDimensionSize - 1) {
        for (let i=rowStart; i < this.columnDimensionSize - 1; i++) {
            column[i] = DimensionLabelCell(this.getColumnAxisLabel(i));
        }
        column.push(DimensionLabelCell(this.getCrossAxisLabel()));
        return column;
    }

    for (let i=rowStart; i < this.columnDimensionSize - 1; i++) {
        column[i] = DimensionLabelCell('&nbsp;');
    }

    column[this.columnDimensionSize - 1] = DimensionLabelCell(this.getRowAxisLabel(columnIndex));

    return column;
}

PivotTable.prototype.buildCornerAxisRow = function(rowIndex, columnStart) {
    const row = [];

    if (!this.doShowDimensionLabels()) {
        row[0] = DimensionEmptyCell(this.rowDimensionSize - columnStart, this.columnDimensionSize - rowIndex, columnStart === this.columnStart);
        for (let i=1, x=columnStart + 1; x < this.rowDimensionSize; i++, x++) {
            row[i] = DimensionEmptyCell(this.rowDimensionSize - x, this.columnDimensionSize - rowIndex, true);
        }
        return row;
    }

    if (rowIndex === this.columnDimensionSize - 1 || this.columnDimensionSize === 0) {
        for (let i=0, x=columnStart; x < this.rowDimensionSize - 1; i++, x++) {
            row[i] = DimensionLabelCell(this.getRowAxisLabel(i));
        }
        row.push(DimensionLabelCell(this.getCrossAxisLabel()));
        return row;
    }

    for (let i=0, x=columnStart; x < this.rowDimensionSize - 1; i++, x++) {
        row[i] = DimensionLabelCell('&nbsp;');
    }

    row.push(DimensionLabelCell(this.getColumnAxisLabel(rowIndex)));

    return row;
};

PivotTable.prototype.createSpanMap = function(spanValues) {
    if (!spanValues) {
        spanValues = [];
    }
    return Array.from(spanValues, value => defaultProxyGenerator(value));
};

PivotTable.prototype.createRowSpanMap = function() {
    return this.createSpanMap(this.rowAxis.span);
};

PivotTable.prototype.createColumnSpanMap = function() {
    return this.createSpanMap(this.colAxis.span);
};

PivotTable.prototype.updateValueTotal = function(rowIndex, columnIndex, valueObject, totalObject) {

    if (!totalObject[rowIndex]) {
        totalObject[rowIndex] = {};
    }
    
    if (!totalObject[rowIndex][columnIndex]) {
        totalObject[rowIndex][columnIndex] = {
            numerator: 0,
            denominator: 0,
            factor: 0,
            counter: 0,
        }
    }

    totalObject[rowIndex][columnIndex].counter++;

    addMerge(totalObject[rowIndex][columnIndex], valueObject);
}

PivotTable.prototype.createValueLookup = function() {

    const lookup = buildTable2D(this.rowSize, this.columnSize, 0);
    const valueMap = {};
    const totalMap = {};

    for (let i=0, y=0; i < this.rowAxis.size; i++, y++) {

        if (this.doColSubTotals() && (y + 1) % (this.rowUniqueFactor + 1) === 0) {
            y++;
        }

        for (let j=0, x=0, value, valueObject; j < this.colAxis.size; j++, x++) {

            if (this.doRowSubTotals() && (x + 1) % (this.colUniqueFactor + 1) === 0) {
                x++;
            }

            valueObject = this.getValueObject(i, j);

            if (valueObject) {
                if (!valueMap[i]) {
                    valueMap[i] = {};
                }
                valueMap[i][j] = valueObject.value;
            }
            
            lookup[y][x] = valueObject.value;

            // calculate sub totals
            if (this.doColSubTotals()) this.updateValueTotal(this.getNextSubRowIndex(i), x, valueObject, totalMap);
            if (this.doRowSubTotals()) this.updateValueTotal(y, this.getNextSubColumnIndex(j), valueObject, totalMap);
            
            // calculate grand totals
            if (this.doColTotals()) this.updateValueTotal(this.getNextTotalRowIndex(), x, valueObject, totalMap);
            if (this.doRowTotals()) this.updateValueTotal(y, this.getNextTotalColumnIndex(), valueObject, totalMap);
            
            // calculate intersection totals
            if (this.doRowTotals() && this.doColTotals()) this.updateValueTotal(this.getNextTotalRowIndex(), this.getNextTotalColumnIndex(), valueObject, totalMap);
            if (this.doColSubTotals() && this.doRowSubTotals()) this.updateValueTotal(this.getNextSubRowIndex(i), this.getNextSubColumnIndex(j), valueObject, totalMap);
            if (this.doRowTotals() && this.doRowSubTotals()) this.updateValueTotal(this.getNextTotalRowIndex(), this.getNextSubColumnIndex(j), valueObject, totalMap);
            if (this.doColSubTotals() && this.doColTotals()) this.updateValueTotal(this.getNextSubRowIndex(i), this.getNextTotalColumnIndex(), valueObject, totalMap);

        }
    }

    for (let i=0, rowTotalIndicies=Object.keys(totalMap); i < rowTotalIndicies.length; i++) {
        for (let j=0, columnTotalIndicies=Object.keys(totalMap[rowTotalIndicies[i]]); j < columnTotalIndicies.length; j++) {

            let y = rowTotalIndicies[i];
            let x = columnTotalIndicies[j];

            let total = this.getTrueTotal(
                totalMap[y][x].numerator,
                totalMap[y][x].denominator || 1,
                totalMap[y][x].factor / totalMap[y][x].counter)

            if (!valueMap[y]) {
                valueMap[y] = {};
            }

            lookup[y][x] = total;
            valueMap[y][x] = total;

        }        
    }

    return lookup;
};

PivotTable.prototype.createRowRenderMap = function() {
    let map = [];
    
    for (let i = 0; i < this.getValueTableHeigth(); i++) {
        
        if (!this.isRowEmpty(i) || !this.doHideEmptyRows()) {
            map.push(i);
            continue;
        }

        this.numberOfEmptyRows += 1;
        for (let j=0; j < this.rowAxis.span.length - 1; j++) {
            this.decremenetRowAxisSpan(this.normalizeRowIndex(i), j);
        }
    }
    return map;
};

PivotTable.prototype.createColumnRenderMap = function() {
    let map = [];

    for (let i = 0; i < this.getValueTableWidth(); i++) {
        
        if (!this.isColumnEmpty(i) || !this.doHideEmptyColumns()) {
            map.push(i);
            continue;
        }

        this.numberOfEmptyColumns += 1;
        for (let j=0; j < this.colAxis.span.length - 1; j++) {
            this.decrementColumnAxisSpan(this.normalizeColumnIndex(i), j);
        }
    }
    return map;
};

// utils
PivotTable.prototype.statistics = function() {
    return {
        "rows:": this.valueLookup.length,
        "columns:": this.valueLookup[0].length,
        "cells": this.valueLookup.length * this.valueLookup[0].length,
    };
};

PivotTable.prototype.constrainHeight = function(index) {
    return Math.min(this.getRowAxisSize() - this.numberOfEmptyRows, index);
};

PivotTable.prototype.constrainWidth = function(index) {
    return Math.min(this.getColumnAxisSize() - this.numberOfEmptyColumns, index);
};

PivotTable.prototype.normalizeRowIndex = function(rowIndex) {
    if (this.doColSubTotals()) {
        return Math.max(0, rowIndex - Math.floor(rowIndex / (this.rowUniqueFactor + 1)));
    }
    return rowIndex;
};

PivotTable.prototype.normalizeColumnIndex = function(columnIndex) {
    if (this.doRowSubTotals()) {
        return Math.max(0, columnIndex - Math.floor(columnIndex / (this.colUniqueFactor + 1)));    
    }
    return columnIndex;
};

PivotTable.prototype.recursiveReduce = function(obj, span) {
    if (!obj.children) {
        obj.collapsed = true;

        if (obj.parent && obj.parent.oldestSibling) {
            obj.parent.oldestSibling.children--;
        }
    } else {
        span && obj.oldestSibling[span]--;
    }

    if (obj.parent) {
        this.recursiveReduce(obj.parent.oldestSibling, span);
    }
};

PivotTable.prototype.hideRow = function(rowIndex) {
    this.recursiveReduce(this.table[rowIndex][this.rowDimensionSize - 1], 'rowSpan');
    
    let offset = this.table[rowIndex][0].type === 'dimensionSubtotal' ? 0 : this.rowDimensionSize;

    for (let j=0; j < this.valueLookup[rowIndex - this.columnDimensionSize].length + (offset ? 0 : this.rowDimensionSize) ; j++) {
        this.table[rowIndex][j + offset].collapsed = true;
    }
}

PivotTable.prototype.hideColumn = function(columnIndex) {
    this.recursiveReduce(this.table[this.columnDimensionSize - 1][columnIndex], 'colSpan');

    let offset = this.table[0][columnIndex].type === 'dimensionSubtotal' ? 0 : this.columnDimensionSize;

    for (let j=0; j < this.valueLookup.length + (offset ? 0 : this.columnDimensionSize); j++) {
        this.table[j + offset][columnIndex].collapsed = true;
    }
}

PivotTable.prototype.hideEmptyRows = function() {
    for (let i = this.columnDimensionSize; i < this.valueLookup.length + this.columnDimensionSize; i++) {
        if (this.isRowEmpty(i - this.columnDimensionSize)) {
            this.hideRow(i);
        }
    }
};

PivotTable.prototype.hideEmptyColumns = function() {
    for (let i = this.rowDimensionSize; i < this.valueLookup[0].length  + this.rowDimensionSize; i++) {
        if (this.isColumnEmpty(i - this.rowDimensionSize)) {
            this.hideColumn(i);
        }
    }
};

// html
PivotTable.prototype.buildTableFilter = function(span) {
    if (!this.filters) {
        return [];
    }

    return [
        [this.buildHtmlCell(FilterCell(this.getRecordNames(), this.getTopBarSpan(span)))]
    ];
};

PivotTable.prototype.buildTableTitle = function(span) {
    if (!this.title) {
        return [];
    }

    return [
        [this.buildHtmlCell(FilterCell(this.title, this.getTopBarSpan(span)))]
    ];
};

PivotTable.prototype.getLegends = function(dxId) {
    return this.appManager.getLegendSetById(
        this.getLegendSetId(config.dxId)).legends;
};

PivotTable.prototype.getLegendSet = function(dxId) {
    if (!dxId) {
        return null;
    }

    return this.response.metaData.items[config.dxId].legendSet
};

PivotTable.prototype.buildHtmlCell = function(config) {

    // validation
    if (!isObject(config) || config.hidden || config.collapsed) {
        return '';
    }

    if (isString(config.sort)) {
        this.sortableIdObjects.push({     
            id: config.sort,
            uuid: config.uuid,
        });
    }

    let style = '';

    if (config.isValue && this.legendSet) {

        let legends = this.legendSet.legends,
            bgColor;

        if (this.doLegendDisplayByDataItem() && this.getLegendSet(config.dxId)) {
            legends = this.getLegends(config.dxId);
        }

        for (let i=0; i < legends.length; i++) {
            if (numberConstrain(config.value, legends[i].startValue, legends[i].endValue) === config.value) {
                bgColor = legends[i].color;
            }
        }
    
        if (this.doLegendDisplayStyleFill() && bgColor) {
            style += `
                      background-color:${bgColor};
                      color:${isColorBright(bgColor) ? 'black' : 'white'};
            `;
        }

        if (this.doLegendDisplayStyleText() && bgColor) {
            style += `color:${bgColor};`;
        }
    }
    
    if (this.doDynamicRendering() || this.doStickyColumns() || this.doStickyRows()) {
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

    style += config.style;

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
            ${this.getHtmlValue(config)}
        </td>
    `;
};

PivotTable.prototype.buildHtmlRows = function(objectArray) {
    this.valueUuids = [];
    return objectArray.map((row) => {
        return row.map((cell) =>{
            if (cell.uuid) this.valueUuids.push(cell.uuid);
            return this.buildHtmlCell(cell);
        });
    });
};

PivotTable.prototype.buildHtmlTableRows = function(htmlArray, start, end) {
    if (this.doDynamicRendering()) {
        return this.buildHtmlTableRowsWithPaddng(htmlArray, start, end);
    }

    let rows = '';
    
    for (let i = start, htmlRow; i < end; i++) {
        htmlRow = htmlArray[i].join('');
        if (htmlRow && htmlRow.length > 0) {
            rows += `<tr> ${htmlRow} </tr>`;
        }
    }

    return rows;
};

PivotTable.prototype.buildHtmlTableRowsWithPaddng = function(htmlArray, start, end) {
    let rows = '';

    const leftPadding  = this.buildLeftPaddingHtmlCell(),
          rightPadding = this.buildRightPaddingHtmlCell();
    
    for (let i = start, htmlRow; i < end; i++) {
        htmlRow = htmlArray[i].join('');
        if (htmlRow.length > 0) {
            rows += `<tr> ${leftPadding} ${htmlRow} ${rightPadding} </tr>`;
        }
    }

    return rows;
};

PivotTable.prototype.buildTopPaddingHtmlRow = function() {
    const cell = this.buildTopPaddingHtmlCell();

    if (cell) {
        return `<tr>${cell}</tr>`;
    }

    return  '';
};

PivotTable.prototype.buildBottomPaddingHtmlRow = function() {
    const cell = this.buildBottomPaddingHtmlCell();
    
    if (cell) {
        return `<tr>${cell}</tr>`;
    }

    return  '';
};

PivotTable.prototype.buildTopPaddingHtmlCell = function() {
    const padding = this.getTopPadding(),
             cell = VerticalPaddingCell(padding, 'top-padding');

    return this.buildHtmlCell(cell);
};

PivotTable.prototype.buildBottomPaddingHtmlCell = function() {
    const padding = this.getBottomPadding(),
            cell  = VerticalPaddingCell(padding, 'bottom-padding');

    return this.buildHtmlCell(cell);
};

PivotTable.prototype.buildLeftPaddingHtmlCell = function() {
    const padding = this.getLeftPadding(),
            cell  = HorizontalPaddingCell(padding, 'left-padding');

    return this.buildHtmlCell(cell);
};

PivotTable.prototype.buildRightPaddingHtmlCell = function() {
    const padding = this.getRightPadding(),
            cell  = HorizontalPaddingCell(padding, 'right-padding');

    return this.buildHtmlCell(cell);
};

PivotTable.prototype.buildHtmlTableHead = function(htmlArray) {
    let cls = '';

    if (this.doStickyColumns()) {
        cls += 'pivot-sticky-column-2';
    }

    return `
        <thead class="${cls}">
            ${this.doDynamicRendering() ? this.buildTopPaddingHtmlRow() : ''}
            ${this.buildHtmlTableRows(htmlArray, 0, this.columnDimensionSize - this.rowStart)}
        </thead>
    `;
};

PivotTable.prototype.buildHtmlTableBody = function(htmlArray) {
    let cls           = '',
        startRowIndex = 0, //Math.max(0, colAxis.dims  - t.rowStart),
        endRowIndex   = htmlArray.length;
        
    return `
        <tbody class="${cls}">
            ${this.doDynamicRendering() ? this.buildTopPaddingHtmlRow() : ''}
            ${this.buildHtmlTableRows(htmlArray, startRowIndex, endRowIndex)}
            ${this.doDynamicRendering() ? this.buildBottomPaddingHtmlRow() : ''}
        </tbody>
    `;
};

PivotTable.prototype.buildHtmlTable = function(htmlArray) {
    let cls      = 'pivot user-select',
        style    = '',
        overflow = 'visible';

    cls += this.displayDensity ? ' displaydensity-' + this.displayDensity : '';
    cls += this.fontSize       ? ' fontsize-' + this.fontSize : '';

    if (this.doStickyRows()) {
        overflow = 'auto';
    }

    style += `display:flex!important;overflow:${overflow};`;

    return `
        ${this.doStickyColumns() ? this.buildHtmlColumnDimensionTable(htmlArray) : ''}
        <div style="${style}">
            ${this.doStickyRows() ? this.buildHtmlRowDimensionTable(htmlArray) : ''}
            <table class="${cls}">
                ${this.buildHtmlTableBody(htmlArray)}
            </table>
        </div>
    `;
};

PivotTable.prototype.buildHtmlColumnDimensionTable = function(htmlArray) {
    let cls  = 'pivot pivot-sticky-column-2',
        rows = htmlArray.splice(0, this.columnDimensionSize);
    
    return `
        <table class="${cls}">
            ${this.buildHtmlTableRows(htmlArray, 0, this.columnDimensionSize)}
        </table>
    `;
};

PivotTable.prototype.buildHtmlRowDimensionTable = function(htmlArray) {
    let table = '',
        cls   = '',
        htmlRow;

    if (this.doStickyRows()) {
        cls += 'pivot pivot-sticky-row';
    }
    
    table += `<table class="${cls}">`;
    
    if (!this.doShowDimensionLabels() && this.columnDimensionSize > 0) {
        htmlRow = htmlArray[0].splice(0, this.rowDimensionSize).join('');
        table  += `<tr style="height:${this.columnDimensionSize * this.cellHeight}px;">${htmlRow}</tr>`;
    }
    
    for (let i = 0; i < htmlArray.length; i++) {
        htmlRow = htmlArray[i].splice(0, this.rowDimensionSize).join('');
        if (htmlRow.length > 0) {
            table += `<tr>${htmlRow}</tr>`;
        }
    }

    table += '</table>';

    return table;
};

// table actions
/**
 * Builds the initial table.
 * 
 * @param {number} [columnStart=0] 
 * @param {number} [rowStart=0] 
 */
PivotTable.prototype.build = function(columnStart=0, rowStart=0) {
    
    this.setColumnStartAndEnd(columnStart);
    this.setRowStartAndEnd(rowStart);

    let rowAxis = this.buildRowAxis(this.rowStart, this.rowEnd, this.columnStart),
        colAxis = this.buildColumnAxis(this.columnStart, this.columnEnd, this.rowStart),
        values  = this.buildValueTable(this.rowStart, this.rowEnd, this.columnStart, this.columnEnd);

    for (let i = 0; i < rowAxis.length; i++) {
        rowAxis[i].push(...values[i]);
    }
    
    const table = toRow(colAxis).concat(rowAxis);

    this.table = table;
};

/**
 * Converts the table into a html string representation.
 * 
 * @returns {string}
 */
PivotTable.prototype.render = function() {
    
    if (this.doHideEmptyColumns() && !this.doDynamicRendering()) {
        this.hideEmptyColumns();
    }

    if (this.doHideEmptyRows() && !this.doDynamicRendering()) {
        this.hideEmptyRows();
    }

    if (this.doDynamicRendering()) {
        this.updateDimensionSpan();
    }

    let htmlArray = arrayClean([].concat(
        this.options.skipTitle || this.rowStart > 0 ? [] : this.buildTableTitle(this.table[0].length),
        this.buildTableFilter(this.table[0].length),
        this.buildHtmlRows(this.table)
    ));

    return this.buildHtmlTable(htmlArray);
};

/**
 * Updates the table given a new column start and row start.
 * 
 * @param {number} columnStart 
 * @param {number} rowStart 
 * @returns {string}
 */
PivotTable.prototype.update = function(columnStart, rowStart) {

    if (rowStart > 0 && !this.options.skipTitle) {
        rowStart -= 1;
    }

    const columnEnd = this.getColumnEnd(columnStart),
          rowEnd    = this.getRowEnd(rowStart);

    while ((columnStart !== this.columnStart || rowStart !== this.rowStart) || 
        (columnEnd !== this.columnEnd || rowEnd !== this.rowEnd)) {
        this.applyChange(columnStart, columnEnd, rowStart, rowEnd);
    }
    
    return this.render();
};

/**
 * Applies incremental changes to the table.
 * 
 * @param {number} columnStart new start column index
 * @param {number} columnEnd new end column index
 * @param {number} rowStart new start row index
 * @param {number} rowEnd new end row index
 */
PivotTable.prototype.applyChange = function(columnStart, columnEnd, rowStart, rowEnd) {
    
    if (this.columnStart > columnStart) {
        this.columnStart--;
        this.addLeft(this.columnStart, this.rowStart, this.rowEnd);
    }

    if (this.columnEnd < columnEnd + this.visibleEmptyColumns) {
        this.setColumnEnd(this.columnEnd + 1);
        this.addRight(this.columnEnd, this.rowStart, this.rowEnd);
    }

    if (this.rowStart > rowStart) {
        this.rowStart--;
        this.addTop(this.rowStart, this.columnStart, this.columnEnd);
    }

    if (this.rowEnd < rowEnd + this.visibleEmptyRows) {
        this.setRowEnd(this.rowEnd + 1);
        this.addBottom(this.rowEnd, this.columnStart, this.columnEnd);
    }

    if (this.rowStart < rowStart) {
        this.rowStart++;
        this.deleteTop();
    }

    if (this.rowEnd > rowEnd + this.visibleEmptyRows) {
        this.setRowEnd(this.rowEnd - 1);
        this.deleteBottom();
    }
    
    if (this.columnStart < columnStart) {
        this.columnStart++;
        this.deleteLeft();
    } 

    if (this.columnEnd > columnEnd  + this.visibleEmptyColumns) {
        this.setColumnEnd(this.columnEnd - 1);
        this.deleteRight();
    }
};


/**
 * Decreses the row span by 1 of the associated dimension at 
 * given row index.
 * 
 * @param {number} rowIndex index of row dimension
 * @param {number} dimensionId dimension id
 */
PivotTable.prototype.decremenetRowAxisSpan = function(rowIndex, dimensionId) {
    this.rowAxisSpanMap[dimensionId][Math.floor(rowIndex / this.rowAxis.span[dimensionId])] -= 1;
};

/**
 * Decreses the column span by 1 of the associated dimension at 
 * given column index.
 * 
 * @param {number} columnIndex index of column dimension
 * @param {number} dimensionId dimension id
 */
PivotTable.prototype.decrementColumnAxisSpan = function(columnIndex, dimensionId) {
    this.columnAxisSpanMap[dimensionId][Math.floor(columnIndex / this.colAxis.span[dimensionId])] -= 1;
};

PivotTable.prototype.buildValueTable = function(rowStart, rowEnd, columnStart, columnEnd) {

    rowEnd    -= this.columnDimensionSize;
    columnEnd -= this.rowDimensionSize; //Math.max(0, this.rowDimensionSize - columnStart)

    let rowSize = (rowEnd - rowStart + 1) || 1,
        colSize = (columnEnd - columnStart + 1) || 1;

    let table = [];

    if (this.doDynamicRendering()) {
        rowSize = Math.min(rowSize, this.rowAxisLookup.length);
        colSize = Math.min(colSize, this.columnAxisLookup.length);
    }

    for (let i=0, y=rowStart; i < rowSize; i++, y++) {
        table.push([])
        for (let j=0, x=columnStart; j < colSize; j++, x++) {
            if (this.doSortableColumnHeaders()) {
                let totalIdComb = new ResponseRowIdCombination(this.refs, ['total', this.rowAxis.ids[y]]);
                this.idValueMap[totalIdComb.get()] = this.isRowEmpty(y) ? null : this.getRowTotal(y);
            }
            table[i][j] = this.buildValueCell(x, y);
        }
    }

    return table;
};

PivotTable.prototype.sumRowAxisSpanUpToIndex = function(rowIndex, dimensionIndex) {
    let sum = 0;
    for(let i=0; i<Math.floor(rowIndex / this.rowAxis.span[dimensionIndex]) + 1; i++) {
        sum += this.rowAxisSpanMap[dimensionIndex][i];
    }
    return sum;
}

PivotTable.prototype.getDistanceFromLastRowAxisSibling = function(rowIndex, dimensionIndex) {
    let rowIndexOffset = this.rowAxisLookup[rowIndex],
        subColumnOffset = 0;

    if (this.doColSubTotals()) {
        subColumnOffset = Math.floor(rowIndex / this.getRowAxisSpan(rowIndex, 0))
    }

    return this.getRowAxisSpan(rowIndexOffset - subColumnOffset, dimensionIndex) -
        (this.sumRowAxisSpanUpToIndex(rowIndexOffset - subColumnOffset, dimensionIndex) - (rowIndex - subColumnOffset))
}

PivotTable.prototype.sumColumnAxisSpanUpToIndex = function(columnIndex, dimensionIndex) {
    let sum = 0;
    for(let i=0; i<Math.floor(columnIndex / this.colAxis.span[dimensionIndex]) + 1; i++) {
        sum += this.columnAxisSpanMap[dimensionIndex][i];
    }
    return sum;
}

PivotTable.prototype.getDistanceFromLastColumnAxisSibling = function(columnIndex, dimensionIndex) {
    let columnIndexOffset = this.columnAxisLookup[columnIndex],
        subRowOffset = 0;

    if (this.doRowSubTotals()) {
        subRowOffset = Math.floor(columnIndex / this.getColAxisSpan(columnIndex, 0)); //TODO: +1 ?
    }

    return this.getColAxisSpan(columnIndexOffset - subRowOffset, dimensionIndex) -
        (this.sumColumnAxisSpanUpToIndex(columnIndexOffset - subRowOffset, dimensionIndex) - (columnIndex - subRowOffset))
}

PivotTable.prototype.getNumberOfHiddenRowsInDimension = function(rowIndex, dimensionIndex) {
    let distanceFromStart = this.getDistanceFromLastRowAxisSibling(rowIndex, dimensionIndex),
        numberOfHiddenRows = 0;

    distanceFromStart += this.getDistanceFromTopRowSibling(rowIndex - distanceFromStart, dimensionIndex);

    return (this.rowAxisLookup[rowIndex] - rowIndex) - 
        (this.rowAxisLookup[rowIndex - distanceFromStart] - 
        (rowIndex - distanceFromStart));
};

PivotTable.prototype.getNumberOfHiddenColumnsFromLeftSibling = function(columnIndex, dimensionIndex) {
    let distanceFromStart = this.getDistanceFromLastColumnAxisSibling(columnIndex, dimensionIndex),
        numberOfHiddenColumns = 0;
        
    distanceFromStart += this.getDistanceFromLeftColumnSibling(columnIndex - distanceFromStart, dimensionIndex);
    
    numberOfHiddenColumns += (this.columnAxisLookup[columnIndex] - columnIndex) - 
        (this.columnAxisLookup[columnIndex - distanceFromStart] - (columnIndex - distanceFromStart));
    
    return numberOfHiddenColumns;
};

PivotTable.prototype.getDistanceFromLeftColumnSibling = function(columnIndex, dimensionIndex) {
    columnIndex = this.columnAxisLookup[columnIndex];
    
    if (this.doRowSubTotals()) {
        columnIndex = this.normalizeColumnIndex(columnIndex);
    }
      
    return columnIndex % this.colAxis.span[dimensionIndex];
}

PivotTable.prototype.getDistanceFromTopRowSibling = function(rowIndex, dimensionIndex) {
    rowIndex = this.rowAxisLookup[rowIndex];
    
    if (this.doColSubTotals()) {
        rowIndex = this.normalizeRowIndex(rowIndex);
    }
      
    return rowIndex % this.rowAxis.span[dimensionIndex];
}


PivotTable.prototype.updateRowAxisDimensionSpan = function() {
    if (!this.rowAxis.type) return;

    const rowSpanLimit = this.rowEnd - this.rowStart + 1;

    for (let i=0, x=this.columnStart; i < (this.rowDimensionSize - this.columnStart); i++, x++) {
        for (let j=this.getValueStartRowIndex(), y=this.getValueOffsetRow(), rowSpanCounter=0, currentRowSpan = 0; j < this.table.length; j++, y++) {      

            let cell = this.table[j][i],
                yo = this.normalizeRowIndex(this.rowAxisLookup[y]);

            if (cell.collapsed || (this.doHideEmptyRows() && this.isRowEmpty(this.rowAxisLookup[y]))) {
                continue;
            }

            if (cell.type === 'dimensionSubtotal') {
                rowSpanCounter += 1;
                cell.hidden =  i !== 0;
                continue;
            }

            currentRowSpan -= 1;
            cell.hidden = this.checkAxisHiddenParameters(cell, i, j, currentRowSpan);

            if (currentRowSpan <= 0) {
                let offset = 0;

                if (j === 0 && this.rowAxis.span[i] !== 1) {
                    offset = this.getNumberOfHiddenRowsInDimension(y, x);
                } else {
                    offset = this.getDistanceFromTopRowSibling(y, x);
                }
                
                currentRowSpan = this.getUpdatedRowSpan(yo, x, offset);
            }
 
            cell.rowSpan = currentRowSpan;

            if (cell.hidden) {
                continue;
            }
            
            if (cell.rowSpan + rowSpanCounter > rowSpanLimit) {
                cell.rowSpan = rowSpanLimit - rowSpanCounter - Math.max(this.columnDimensionSize - this.rowStart, 0);
            }

            rowSpanCounter += cell.rowSpan;
        }
    }
};

PivotTable.prototype.updateColumnAxisDimensionSpan = function() {
    if (!this.colAxis.type) return;

    const colSpanLimit = this.columnEnd - this.columnStart + 1;

    for (let i=0, y=this.rowStart; i < (this.columnDimensionSize - this.rowStart); i++, y++) {
        for (let j=this.getValueStartColumnIndex(), x=this.getValueOffsetColumn(), colSpanCounter=0, currentColSpan=0; j < this.table[i].length; j++, x++) {      

            let cell = this.table[i][j];
            let xo = this.normalizeColumnIndex(this.columnAxisLookup[x]);

            if (cell.collapsed || (this.doHideEmptyColumns() && this.isColumnEmpty(this.columnAxisLookup[x]))) {
                continue;
            }

            if (cell.type === 'dimensionSubtotal') {
                colSpanCounter += 1;
                cell.hidden =  i !== 0;
                continue;
            }

            currentColSpan -= 1;
            cell.hidden = this.checkAxisHiddenParameters(cell, i, j, currentColSpan);

            if (currentColSpan <= 0) {
                let offset = 0;

                if (j === 0 && this.colAxis.span[i] !== 1) {
                    offset = this.getNumberOfHiddenColumnsFromLeftSibling(x, y);
                } else {
                    offset = this.getDistanceFromLeftColumnSibling(x, y);
                }

                currentColSpan = this.getUpdatedColSpan(xo, y, offset);
            }
 
            cell.colSpan = currentColSpan;

            if (cell.hidden) {
                continue;
            }
            
            if (cell.colSpan + colSpanCounter > colSpanLimit) {
                cell.colSpan = colSpanLimit - colSpanCounter - Math.max(this.rowDimensionSize - this.columnStart, 0);;
            }

            colSpanCounter += cell.colSpan;
        }
    }
};

PivotTable.prototype.updateCornerAxisDimensionSpan = function() {
    const rowSpanLimit = this.rowEnd - this.rowStart + 1;

    for (let i=0, x=this.columnStart, cell; i < this.rowDimensionSize - this.columnStart; i++, x++) {
        for (let j=0, rowSpanCounter=0; j < this.columnDimensionSize - this.rowStart; j++) {

            cell = this.table[j][i];

            if (cell.collapsed) continue;

            cell.rowSpan = this.getAdjustedRowSpan(cell, x);
            cell.hidden  = this.checkAxisHiddenParameters(cell, i, j);

            if (j === 0 && cell.type === 'empty') {
                rowSpanCounter += Math.max(0, this.columnDimensionSize - this.rowStart);
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
}

PivotTable.prototype.updateDimensionSpan = function() {
    this.updateCornerAxisDimensionSpan();
    this.updateColumnAxisDimensionSpan();
    this.updateRowAxisDimensionSpan();
};

PivotTable.prototype.checkAxisHiddenParameters = function(cell, i, j, span) {
    switch (cell.type) {
        case 'labeled': {
            return false;
        }
        
        case 'dimension': {
            return !(span <= 0);
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












// Full Cell Map Builder
PivotTable.prototype.increaseLookupCell = function(lookup, rowIndex, columnIndex, value, cellType) {
    let cell = lookup[rowIndex][columnIndex];
    if (!cell) cell = lookup[rowIndex][columnIndex] = cellType(value);
    cell.value += value;
};

PivotTable.prototype.increaseRowSubTotals = function(lookup, rowIndex, columnIndex, value) {
    this.increaseLookupCell(lookup, rowIndex, this.getNextSubColumnIndex(columnIndex), value, ValueSubTotalCell);
};

PivotTable.prototype.increaseColTotals = function(lookup, columnIndex, value) {
    this.increaseLookupCell(lookup, this.getNextTotalRowIndex(), columnIndex, value, ValueTotalCell);
};

PivotTable.prototype.increaseRowTotals = function(lookup, rowIndex, value) {
    this.increaseLookupCell(lookup, rowIndex, this.getNextTotalColumnIndex(), value, ValueTotalCell);
};

PivotTable.prototype.increaseTotalsIntersect = function(lookup, value) {
    this.increaseLookupCell(lookup, this.getNextTotalRowIndex(), this.getNextTotalColumnIndex(), value, ValueTotalCell);
};

PivotTable.prototype.increaseSubTotalIntersect = function(lookup, rowIndex, columnIndex, value) {
    this.increaseLookupCell(lookup, this.getNextSubRowIndex(rowIndex), this.getNextSubColumnIndex(columnIndex), value, ValueSubTotalCell);
};

PivotTable.prototype.increaseColTotalsIntersect = function(lookup, columnIndex, value) {
    this.increaseLookupCell(lookup, this.getNextTotalRowIndex(), this.getNextSubColumnIndex(columnIndex), value, ValueTotalCell);
};

PivotTable.prototype.increaseRowTotalsIntersect = function(lookup, rowIndex, value) {
    this.increaseLookupCell(lookup, this.getNextSubRowIndex(rowIndex), this.getNextTotalColumnIndex(), value, ValueTotalCell);
};

PivotTable.prototype.increaseColSubTotals = function(lookup, rowIndex, columnIndex, value) {
    this.increaseLookupCell(lookup, this.getNextSubRowIndex(rowIndex), columnIndex, value, ValueSubTotalCell);
};

PivotTable.prototype.createCellMap = function() {
    const lookup = buildTable2D(this.rowSize, this.columnSize, 0);

    for (let i=0, y=0; i < this.rowAxis.size; i++, y++) {

        if (this.doColSubTotals() && (y + 1) % (this.rowUniqueFactor + 1) === 0) {
            y++;
        }

        for (let j=0, x=0, cell; j < this.colAxis.size; j++, x++) {

            if (this.doRowSubTotals() && (x + 1) % (this.colUniqueFactor + 1) === 0) {
                x++;
            }

            let rric = this.getRRIC(i, j);

            let value = this.idValueMap[rric.get()],
                n = parseFloat(value);

            if (isBoolean(value)) n = 1;
            if (!isNumber(n) || n != value) n = 0;
            
            cell = ValueCell(n, this.response, rric, this.getCellUuids(j, i));

            lookup[y][x] = cell;

            // calculate sub totals
            if (this.doColSubTotals()) this.increaseColSubTotals(lookup, i, x, cell.value);
            if (this.doRowSubTotals()) this.increaseRowSubTotals(lookup, y, j, cell.value);

            // calculate grand totals
            if (this.doColTotals()) this.increaseColTotals(lookup, x, cell.value);
            if (this.doRowTotals()) this.increaseRowTotals(lookup, y, cell.value);

            // calculate intersection totals
            if (this.doRowTotals() && this.doColTotals())       this.increaseTotalsIntersect(lookup, value);
            if (this.doColSubTotals() && this.doRowSubTotals()) this.increaseSubTotalIntersect(lookup, i, j, value);

            if (this.doRowTotals() && this.doRowSubTotals()) this.increaseColTotalsIntersect(lookup, j, value);
            if (this.doColSubTotals() && this.doColTotals()) this.increaseRowTotalsIntersect(lookup, i, value);
        }
    }
    
    return lookup;
};