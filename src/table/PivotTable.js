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

/**
 * 
 * 
 * @param {object} refs 
 * @param {object} layout 
 * @param {object} response 
 * @param {object} colAxis 
 * @param {object} rowAxis 
 * @param {object} [options={}] 
 */
export const PivotTable = function(refs, layout, response, colAxis, rowAxis, options={}) {

    this.options = {
        renderLimit: 50000,
        forceDynamic: false,
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
 * Sets the size of the viewport
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
 * Checks if legend display by data item option is enabled
 * 
 * @returns {boolean}
 */
PivotTable.prototype.doLegendDisplayByDataItem = function() {
    return this.legendDisplayStrategy === this.getLegendDisplayStrategyId('by_data_item');
};

/**
 * Checks if legend display option is enbalied
 * 
 * @returns {boolean}
 */
PivotTable.prototype.doLegendDisplay = function() {
    return this.legendDisplayStrategy !== this.getLegendDisplayStrategyId('fixed');
};

/**
 * Checks if legend display style fill option is enabled
 * 
 * @returns {boolean}
 */
PivotTable.prototype.doLegendDisplayStyleFill = function() {
    return this.legendDisplayStyle === this.getLegendDisplayStyleId('fill');
};

/**
 * Checks if legend display style text option is enabled
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
 * Checks if given cell is of type text field
 * 
 * @param {string} type 
 * @returns 
 */
PivotTable.prototype.isTextField = function(type) {
    return !arrayContains(['dimension', 'filter'], type);
};

/**
 * Get width of value table
 * 
 * @returns 
 */
PivotTable.prototype.getValueTableWidth = function() {
    return Object.keys(this.valueLookup[0]).length;
};
/**
 * Get height of value table
 * 
 * @returns 
 */
PivotTable.prototype.getValueTableHeigth = function() {
    return Object.keys(this.valueLookup).length;
};


PivotTable.prototype.getAdjustedAxisSpan = function(cell, index, axisType, spanType) {
    if (cell.children) {
        return cell.oldestSibling.children *
            this[axisType].span[index + 1] - cell.siblingPosition;
    }

    return cell[spanType];
};

PivotTable.prototype.getAdjustedColSpan = function(cell, rowIndex) {
    return this.getAdjustedAxisSpan(cell, rowIndex, 'colAxis', 'colSpan');
};

PivotTable.prototype.getAdjustedRowSpan = function(cell, columnIndex) {
    return this.getAdjustedAxisSpan(cell, columnIndex, 'rowAxis', 'rowSpan');
};

/**
 * Gets the row index where the values start below the column
 * axis.
 * 
 * @returns {number}
 */
PivotTable.prototype.getValueRowStartOffset = function() {
    return Math.max(0, this.columnDimensionSize - this.rowStart);
};

/**
 * Gets the column index where the values start to the right of the row
 * axis.
 * 
 * @returns {number}
 */
PivotTable.prototype.getValueColumnStartOffset = function() {
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
 * @param {number} dimensionIndex dimension of row axis
 * @returns {number}
 */
PivotTable.prototype.getRowAxisSpan = function(rowIndex, dimensionIndex) {
    return this.rowAxisSpanMap[dimensionIndex][Math.floor(rowIndex / this.rowAxis.span[dimensionIndex])];
};

/**
 * Gets normalized row index offset by hidden rows
 * 
 * @param {number} rowIndex 
 * @param {number} dimensionIndex 
 * @returns {number}
 */
PivotTable.prototype.normalizeRowIndexOffset = function(rowIndex, dimensionIndex) {
    if (this.doColSubTotals()) {
        return rowIndex - Math.floor(this.rowAxisLookup[rowIndex] / (this.rowUniqueFactor + 1));
    }
    return rowIndex;
};

/**
 * Gets the distance from last row axis dimension unit based on current table dimensions
 * 
 * @param {number} rowIndex 
 * @param {number} dimensionIndex 
 * @returns {number}
 */
PivotTable.prototype.getDistanceFromLastRowDimensionUnitActual = function(rowIndex, dimensionIndex) {
    let normalized = this.normalizeRowIndex(this.rowAxisLookup[rowIndex]);
    return this.normalizeRowIndexOffset(rowIndex) -
        ((this.sumRowAxisSpanUpToIndex(normalized, dimensionIndex) -
        this.getRowAxisSpan(normalized, dimensionIndex)));
};

/**
 * Gets distance from last row axis dimension unit based on table offset by hidden rows
 * 
 * @param {number} rowIndex 
 * @param {number} dimensionIndex 
 * @returns {number}
 */
PivotTable.prototype.getDistanceFromLastRowDimensionUnitOffset = function(rowIndex, dimensionIndex) {
    let normalized = this.normalizeRowIndex(this.rowAxisLookup[rowIndex]);
    return normalized % this.rowAxis.span[dimensionIndex];
};

/**
 * Gets distance to next row axis dimension unit based on current table dimensions
 * 
 * @param {number} rowIndex 
 * @param {number} dimensionIndex 
 * @returns {number}
 */
PivotTable.prototype.getDistanceToNextRowDimensionUnitActual = function(rowIndex, dimensionIndex) {
    let normalized = this.normalizeRowIndex(this.rowAxisLookup[rowIndex]);
    return this.getRowAxisSpan(normalized, dimensionIndex) - 
        (this.normalizeRowIndexOffset(rowIndex) -
        ((this.sumRowAxisSpanUpToIndex(normalized, dimensionIndex) -
        this.getRowAxisSpan(normalized, dimensionIndex))));
};

/**
 * Gets distance to next row axis dimension unit based on table offset by hidden rows
 * 
 * @param {number} rowIndex 
 * @param {number} dimensionIndex 
 * @returns {number}
 */
PivotTable.prototype.getDistanceToNextRowDimensionUnitOffset = function(rowIndex, dimensionIndex) {
    let normalized = this.normalizeRowIndex(this.rowAxisLookup[rowIndex]);
    return this.rowAxis.span[dimensionIndex] - 
        (normalized % this.rowAxis.span[dimensionIndex]);
};

/**
 * Gets number of hidden rows above given row index
 * 
 * @param {number} rowIndex 
 * @param {number} dimensionIndex 
 * @returns {number}
 */
PivotTable.prototype.getHiddenRowsAbove = function(rowIndex, dimensionIndex) {
    return this.getDistanceFromLastRowDimensionUnitOffset(rowIndex, dimensionIndex) - 
        this.getDistanceFromLastRowDimensionUnitActual(rowIndex, dimensionIndex);
};

/**
 * Gets number of hidden rows below given row index
 * 
 * @param {number} rowIndex 
 * @param {number} dimensionIndex 
 * @returns {number}
 */
PivotTable.prototype.getHiddenRowsBelow = function(rowIndex, dimensionIndex) {
    return this.getDistanceToNextRowDimensionUnitOffset(rowIndex, dimensionIndex) - 
        this.getDistanceToNextRowDimensionUnitActual(rowIndex, dimensionIndex);
};

/**
 * Gets updated row dimension span based on given parameters
 * 
 * @param {number} rowIndex 
 * @param {number} dimensionIndex 
 * @returns {number}
 */
PivotTable.prototype.getUpdatedRowSpan = function(rowIndex, dimensionIndex) {
    return this.rowAxis.span[dimensionIndex] - 
        this.getHiddenRowsAbove(rowIndex, dimensionIndex) -
        this.getHiddenRowsBelow(rowIndex, dimensionIndex) - 
        this.getDistanceFromLastRowDimensionUnitActual(rowIndex, dimensionIndex);
};

/**
 * Gets normalized row index offset by hidden columns
 * 
 * @param {number} columnIndex 
 * @param {number} dimensionIndex 
 * @returns {number}
 */
PivotTable.prototype.normalizeColumnIndexOffset = function(columnIndex, dimensionIndex) {
    if (this.doRowSubTotals()) {
        return columnIndex - Math.floor(this.columnAxisLookup[columnIndex] / (this.colUniqueFactor + 1));
    }
    return columnIndex;
}
/**
 * Gets the distance from last column axis dimension unit based on current table dimensions
 * 
 * @param {number} columnIndex 
 * @param {number} dimensionIndex 
 * @returns {number}
 */
PivotTable.prototype.getDistanceFromLastColumnDimensionUnitActual = function(columnIndex, dimensionIndex) {
    let normalized = this.normalizeColumnIndex(this.columnAxisLookup[columnIndex]);
    return this.normalizeColumnIndexOffset(columnIndex) -
        ((this.sumColumnAxisSpanUpToIndex(normalized, dimensionIndex) -
        this.getColumnAxisSpan(normalized, dimensionIndex)));
};

/**
 * Gets distance from last column axis dimension unit based on table offset by hidden columns
 * 
 * @param {number} columnIndex 
 * @param {number} dimensionIndex 
 * @returns {number}
 */
PivotTable.prototype.getDistanceFromLastColumnDimensionUnitOffset = function(columnIndex, dimensionIndex) {
    let normalized = this.normalizeColumnIndex(this.columnAxisLookup[columnIndex]);
    return normalized % this.colAxis.span[dimensionIndex];
};

/**
 * Gets the distance to next column axis dimension unit based on current table dimensions
 * 
 * @param {number} columnIndex 
 * @param {number} dimensionIndex 
 * @returns {number}
 */
PivotTable.prototype.getDistanceToNextColumnDimensionUnitActual = function(columnIndex, dimensionIndex) {
    let normalized = this.normalizeColumnIndex(this.columnAxisLookup[columnIndex]);
    return this.getColumnAxisSpan(normalized, dimensionIndex) - 
        (this.normalizeColumnIndexOffset(columnIndex) -
        ((this.sumColumnAxisSpanUpToIndex(normalized, dimensionIndex) -
        this.getColumnAxisSpan(normalized, dimensionIndex))));
};

/**
 * Gets distance to next column axis dimension unit based on table offset by hidden columns
 * 
 * @param {number} columnIndex 
 * @param {number} dimensionIndex 
 * @returns {number}
 */
PivotTable.prototype.getDistanceToNextColumnDimensionUnitOffset = function(columnIndex, dimensionIndex) {
    let normalized = this.normalizeColumnIndex(this.columnAxisLookup[columnIndex]);
    return this.colAxis.span[dimensionIndex] - 
        (normalized % this.colAxis.span[dimensionIndex]);
};

/**
 * Gets number of hidden columns to the left of given column index
 * 
 * @param {number} columnIndex 
 * @param {number} dimensionIndex 
 * @returns {number}
 */
PivotTable.prototype.getHiddenColumnsLeft = function(columnIndex, dimensionIndex) {
    return this.getDistanceFromLastColumnDimensionUnitOffset(columnIndex, dimensionIndex) - 
        this.getDistanceFromLastColumnDimensionUnitActual(columnIndex, dimensionIndex);
};

/**
 * Gets number of hidden columns to the right of given column index
 * 
 * @param {number} columnIndex 
 * @param {number} dimensionIndex 
 * @returns {number}
 */
PivotTable.prototype.getHiddenColumnsRight = function(columnIndex, dimensionIndex) {
    return this.getDistanceToNextColumnDimensionUnitOffset(columnIndex, dimensionIndex) - 
        this.getDistanceToNextColumnDimensionUnitActual(columnIndex, dimensionIndex);
};

/**
 * Gets updated column axis span based on given parameters
 * 
 * @param {number} columnIndex 
 * @param {number} dimensionIndex 
 * @returns {number}
 */
PivotTable.prototype.getUpdatedColumnSpan = function(columnIndex, dimensionIndex) {
    return this.colAxis.span[dimensionIndex] - 
        this.getHiddenColumnsLeft(columnIndex, dimensionIndex) -
        this.getHiddenColumnsRight(columnIndex, dimensionIndex) - 
        this.getDistanceFromLastColumnDimensionUnitActual(columnIndex, dimensionIndex);
};

/**
 * Sums the column axis spans up to given column index
 * 
 * @param {number} columnIndex 
 * @param {number} dimensionIndex 
 * @returns {number}
 */
PivotTable.prototype.sumColumnAxisSpanUpToIndex = function(columnIndex, dimensionIndex) {
    let sum = 0;
    for(let i=0; i<Math.floor(columnIndex / this.colAxis.span[dimensionIndex]) + 1; i++) {
        sum += this.columnAxisSpanMap[dimensionIndex][i];
    }
    return sum;
};

/**
 * Sums the row axis spans up to given row index
 * 
 * @param {number} rowIndex 
 * @param {number} dimensionIndex 
 * @returns {number}
 */
PivotTable.prototype.sumRowAxisSpanUpToIndex = function(rowIndex, dimensionIndex) {
    let sum = 0;
    for(let i=0; i<Math.floor(rowIndex / this.rowAxis.span[dimensionIndex]) + 1; i++) {
        sum += this.rowAxisSpanMap[dimensionIndex][i];
    }
    return sum;
};

/**
 * Gets the column span of a given dimension.
 * 
 * @param {number} columnIndex index of column axis
 * @param {number} dimensionIndex dimension of column axis
 * @returns {number}
 */
PivotTable.prototype.getColumnAxisSpan = function(columnIndex, dimensionIndex) {
    return this.columnAxisSpanMap[dimensionIndex][Math.floor(columnIndex / this.colAxis.span[dimensionIndex])];
};

/**
 * Calculates true total values
 * 
 * @param {number} numerator 
 * @param {number} denominator 
 * @param {number} factor 
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
 * Gets legend display strategy id
 * 
 * @param {string} type 
 * @returns {number}
 */
PivotTable.prototype.getLegendDisplayStrategyId = function(type) {
    return this.optionConfig.getLegendDisplayStrategy(type).id;
};

/**
 * Gets legend display style id
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

    let value = this.getValue(id),
        empty = false;

    if (value === null) {
        value = 0;
        empty = true;
    }

    return {
        value,
        empty,
        numerator: this.getNumeratorValue(id),
        denominator: this.getDenominatorValue(id),
        factor: this.getFactorValue(id),
    };
};

/**
 * Gets value id value map
 * 
 * @param {string} id 
 * @returns {number}
 */
PivotTable.prototype.getValue = function(id) {

    const value = this.idValueMap[id],
          n = parseFloat(value);

    if (isBoolean(value)) {
        return 1;
    }

    if (!isNumber(n) || n != value) {
        return  null;
    }
    
    return n;
};
/**
 * Gets factor value from id factor map
 * 
 * @param {string} id 
 * @returns {number}
 */
PivotTable.prototype.getFactorValue = function(id) {
    return parseFloat(this.idFactorMap[id]) || 1;
};
/**
 * Gets numerator value from id numerator map
 * 
 * @param {string} id 
 * @returns {number}
 */
PivotTable.prototype.getNumeratorValue = function(id) {
    return parseFloat(this.idNumeratorMap[id]) || this.getValue(id);
};
/**
 * Gets denominator value from id denominator map
 * 
 * @param {string} id 
 * @returns {number}
 */
PivotTable.prototype.getDenominatorValue = function(id) {
    return parseFloat(this.idDenominatorMap[id]) || 0;
};

// PivotTable.prototype.getRowSize = function() {
//     return this.getAxisSize(this.rowAxis, this.rowUniqueFactor, this.doRowSubTotals(), this.doRowTotals())
// };

// PivotTable.prototype.getColumnSize = function() {
//     return this.getAxisSize(this.colAxis, this.colUniqueFactor, this.doColSubTotals(), this.doColTotals())
// };
/**
 * Gets number of rows in table
 * 
 * @returns {number}
 */
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
/**
 * Gets number of columns in table
 * 
 * @returns {number}
 */
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
 * Gets uuids object map
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
 * Gets the index of the last cell to be rendered in column
 * 
 * @param {number} columnIndex 
 * @returns {number}
 */
PivotTable.prototype.getColumnEnd = function(columnIndex) {
    return this.doDynamicRendering() ? 
        this.constrainWidth(this.getViewportWidthIndex() + columnIndex) : this.getColumnAxisSize() - this.numberOfEmptyColumns;
};
    
/**
 * Gets the index of the last cell to be rendered in row
 * 
 * @param {number} [rowIndex=this.rowStart] 
 * @returns {number}
 */
PivotTable.prototype.getRowEnd = function(rowIndex=this.rowStart) {
    return this.doDynamicRendering() ?
        this.constrainHeight(this.getViewportHeightIndex() + rowIndex) : (this.getRowAxisSize() - this.numberOfEmptyRows);
};

/**
 * Gets the row sort id
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
 * Gets the dimension label for the row axis at given index
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
 * Gets the dimension label for the shared row/column
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

/**
 * Gets the span for the top title bar
 * 
 * @param {number} span 
 * @returns {number}
 */
PivotTable.prototype.getTopBarSpan = function(span) {
    let rowDims = this.rowDimensionSize || 0;

    if (!this.colAxis.type && this.rowAxis.type) {
        return rowDims + 1;
    }

    return span;
};

/**
 * Retrueves the ResponseRowIdCombination for given row and column index pair
 * 
 * @param {number} rowIndex 
 * @param {number} columnIndex 
 * @returns {number}
 */
PivotTable.prototype.getRRIC = function(rowIndex, columnIndex) {
    const rric = new ResponseRowIdCombination();
    
    if (this.colAxis.type) rric.add(this.colAxis.ids[columnIndex]);
    if (this.rowAxis.type) rric.add(this.rowAxis.ids[rowIndex]);

    return rric;
};

/**
 * Gets associated uuids for given row and column index pair
 * 
 * @param {number} rowIndex 
 * @param {number} columnIndex 
 * @returns {number}
 */
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

/**
 * Gets percentage of value based on given row index
 * 
 * @param {number} value 
 * @param {number} rowIndex 
 * @returns {number}
 */
PivotTable.prototype.getRowPercentage = function(value, rowIndex) {
    return getPercentageHtml(value, this.getRowTotal(rowIndex));
};
/**
 * Gets percentage of value based on given column index
 * 
 * @param {number} value 
 * @param {number} columnIndex 
 * @returns {number}
 */
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

/**
 * Builds a table row based on given parameters
 * 
 * @param {number} rowIndex 
 * @param {number} columnStart 
 * @param {number} columnEnd 
 * @returns {array}
 */
PivotTable.prototype.buildRow = function(rowIndex, columnStart, columnEnd) { 
    let rowAxisRow = [];

    if (rowIndex < this.columnDimensionSize) {
        return this.buildColumnAxisRow(rowIndex, columnStart, columnEnd + 1); // TODO: why + 1?
    }

    rowIndex -= this.columnDimensionSize;

    if (columnStart < this.rowDimensionSize) {
        rowAxisRow = this.buildRowAxisRow(rowIndex, columnStart);
        columnStart = 0;
    } else {
        columnStart -= this.rowDimensionSize;
    }

    columnEnd -= (this.rowDimensionSize - 1); // TODO: why - 1?

    return rowAxisRow.concat(this.buildValueRow(rowIndex, columnStart, columnEnd));
};

/**
 * Builds a table column based on given parameters
 * 
 * @param {number} columnIndex 
 * @param {number} rowStart 
 * @param {number} rowEnd 
 * @returns {array}
 */
PivotTable.prototype.buildColumn = function(columnIndex, rowStart, rowEnd) {
    let columnAxis = this.buildColumnAxisColumn(columnIndex, rowStart);

    if (rowStart > this.columnDimensionSize) {
        rowStart -= this.columnDimensionSize;
        rowEnd -= (this.columnDimensionSize - 1);
    } else {
        rowEnd -= (columnAxis.length - 1);
    }

    if (columnIndex < this.rowDimensionSize) {
        return columnAxis.concat(this.buildRowAxisColumn(columnIndex, rowStart, rowEnd));
    }

    columnIndex -= this.rowDimensionSize;

    return columnAxis.concat(this.buildValueColumn(columnIndex, rowStart, rowEnd));
};

/**
 * Builds value portion of table row based on given parameters
 * 
 * @param {number} rowIndex 
 * @param {number} columnStart 
 * @param {number} columnEnd 
 * @returns {array}
 */
PivotTable.prototype.buildValueRow = function(rowIndex, columnStart, columnEnd) {
    const row = [];

    for (let i=0, columnIndex=columnStart, cell; columnIndex < columnEnd; i++, columnIndex++) {
        cell = this.buildValueCell(columnIndex, rowIndex);
        if (cell) { // TODO: Is this needed?
            row[i] = cell;
        }
    }

    return row;
};

/**
 * Builds value portion of table column based on given parameters
 * 
 * @param {number} columnIndex 
 * @param {number} rowStart 
 * @param {number} rowEnd 
 * @returns {array}
 */
PivotTable.prototype.buildValueColumn = function(columnIndex, rowStart, rowEnd) {
    const column = [];
    
    for (let i=0, rowIndex=rowStart; rowIndex < rowEnd; i++, rowIndex++) {
        column[i] = this.buildValueCell(columnIndex, rowIndex);
    }

    return column;
};

/**
 * Builds value cell based on row and column index pair
 * 
 * @param {number} columnIndex 
 * @param {number} rowIndex 
 * @returns {object}
 */
PivotTable.prototype.buildValueCell = function(columnIndex, rowIndex) {

    rowIndex = this.rowAxisLookup[rowIndex];
    columnIndex = this.columnAxisLookup[columnIndex];

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

/**
 * Builds row axis dimension based on given parameters
 * 
 * @returns {array}
 */
PivotTable.prototype.buildRowAxis = function() {
    const axis = [];

    if (!this.rowAxis.type) {
        if (this.doShowDimensionLabels()) {
            axis[0] = [DimensionEmptyCell(1, 1, false, 'visibility: hidden;')];
        }
        return axis;
    }
    
    for (let i=0, rowIndex=this.rowStart; rowIndex <= this.rowEnd - this.columnDimensionSize; i++, rowIndex++) {
        axis[i] = this.buildRowAxisRow(rowIndex, this.columnStart);
    }

    return axis;
};

/**
 * Builds row axis dimension row based on given parameters
 * 
 * @param {number} rowIndex 
 * @param {number} columnStart 
 * @returns {array}
 */
PivotTable.prototype.buildRowAxisRow = function(rowIndex, columnStart) {
    if (this.rowDimensionSize < columnStart) {
        return [];
    }

    if (!this.rowAxis.type) {
        return [DimensionEmptyCell(1, 1, false, 'visibility: hidden;')];
    }

    const row = [];

    for (let i = 0, columnIndex = columnStart; columnIndex < this.rowDimensionSize; i++, columnIndex++) {
        row[i] = this.buildRowAxisCell(columnIndex, rowIndex);
    }

    return row;
};

/**
 * Builds column axis dimension row based on given parameters
 * 
 * @param {number} rowIndex 
 * @param {number} columnStart 
 * @param {number} columnEnd 
 * @returns {array}
 */
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
    columnEnd   -= this.rowDimensionSize;

    for (let i = row.length; columnStart < columnEnd; i++, columnStart++) {
        row[i] = this.buildColumnAxisCell(rowIndex, columnStart);
    }

    return row;
};

/**
 * Builds row axis dimension column based on given parameters
 * 
 * @param {number} columnIndex 
 * @param {number} rowStart 
 * @param {number} rowEnd 
 * @returns {array}
 */
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

    for (let i=0, rowIndex=rowStart; rowIndex < rowEnd; i++, rowIndex++) {
        column[i] = this.buildRowAxisCell(columnIndex, rowIndex);
    }

    return column;
};

/**
 * Builds row axis cell based on row and column index pair
 * 
 * @param {number} columnIndex 
 * @param {number} rowIndex 
 * @returns {object}
 */
PivotTable.prototype.buildRowAxisCell = function(columnIndex, rowIndex) {

    rowIndex = this.rowAxisLookup[rowIndex];

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

/**
 * Builds column axis cell based on row and column index pair
 * 
 * @param {number} rowIndex 
 * @param {number} columnIndex 
 * @returns {object}
 */
PivotTable.prototype.buildColumnAxisCell = function(rowIndex, columnIndex) {

    columnIndex = this.columnAxisLookup[columnIndex];

    if (this.isColumnSubTotal(columnIndex)) {
        return DimensionSubTotalCell('&nbsp;', 1, 
            this.columnDimensionSize - rowIndex, true, rowIndex !== this.rowStart)
    }
    
    if (this.isColumnGrandTotal(columnIndex)) {
        return DimensionGrandTotalCell(rowIndex === 0 ? 
            'Total' : '&nbsp;', 1, this.columnDimensionSize - rowIndex, 
            rowIndex === this.rowStart && this.doSortableColumnHeaders(), rowIndex !== 0, rowIndex !== 0)
    }

    return ColumnAxisCell(
        this.getColumnAxisObject(rowIndex, this.normalizeColumnIndex(columnIndex)),
        this.response,
        this.doShowHierarchy(),
        this.getRowSortId(rowIndex));
};

/**
 * Builds column axis dimension based on given parameters
 * 
 * @param {number} columnStart 
 * @param {number} columnEnd 
 * @param {number} rowStart 
 * @returns {array}
 */
PivotTable.prototype.buildColumnAxis = function() {
    if (!this.colAxis.type) {
        return this.buildCornerAxisRow(0, 0);
    }

    const axis = [];

    for (let i=0, columnIndex=this.columnStart; columnIndex <= this.columnEnd; i++, columnIndex++) {
        axis[i] = this.buildColumnAxisColumn(columnIndex, this.rowStart);
    }

    return axis;
};

/**
 * Builds column axis dimension column based on given parameters
 * 
 * @param {number} columnIndex 
 * @param {number} rowStart 
 * @returns {array}
 */
PivotTable.prototype.buildColumnAxisColumn = function(columnIndex, rowStart) {
    if (this.columnDimensionSize < rowStart) {
        return [];
    }
    
    if (columnIndex < this.rowDimensionSize) {
        return this.buildCornerAxisColumn(columnIndex, rowStart);
    }

    columnIndex -= this.rowDimensionSize;

    const column = [];

    for (let i=0, rowIndex=rowStart; rowIndex < this.columnDimensionSize; i++, rowIndex++) {
        column[i] = this.buildColumnAxisCell(rowIndex, columnIndex);
    }

    return column;
};

/**
 * Builds corner axis dimension
 * 
 * @returns {array}
 */
PivotTable.prototype.buildCornerAxis = function() {
    const cornerAxis = [];

    for (let i=0; i < this.columnDimensionSize; i++) {
        cornerAxis[i] = this.buildCornerAxisRow(i, 0);
    }

    return cornerAxis;
};

/**
 * Builds corner axis dimension column based on given parameters
 * 
 * @param {number} columnIndex 
 * @param {number} rowStart 
 * @returns {array}
 */
PivotTable.prototype.buildCornerAxisColumn = function(columnIndex, rowStart) {
    const column = [];

    if (!this.doShowDimensionLabels()) {
        column[0] = DimensionEmptyCell(this.rowDimensionSize - columnIndex, this.columnDimensionSize - rowStart, columnIndex !== this.columnStart);
        for (let i=1, rowIndex=rowStart + 1; rowIndex < this.columnDimensionSize; i++, rowIndex++) {
            column[i] = DimensionEmptyCell(this.rowDimensionSize - columnIndex, this.columnDimensionSize - rowIndex, true);
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
};

/**
 * Builds corner axis dimension row based on given parameters
 * 
 * @param {number} rowIndex 
 * @param {number} columnStart 
 * @returns {array}
 */
PivotTable.prototype.buildCornerAxisRow = function(rowIndex, columnStart) {
    const row = [];

    if (!this.doShowDimensionLabels()) {
        row[0] = DimensionEmptyCell(this.rowDimensionSize - columnStart, this.columnDimensionSize - rowIndex, columnStart === this.columnStart);
        for (let i=1, columnIndex=columnStart + 1; columnIndex < this.rowDimensionSize; i++, columnIndex++) {
            row[i] = DimensionEmptyCell(this.rowDimensionSize - columnIndex, this.columnDimensionSize - rowIndex, true);
        }
        return row;
    }

    if (rowIndex === this.columnDimensionSize - 1 || this.columnDimensionSize === 0) {
        for (let i=0, columnIndex=columnStart; columnIndex < this.rowDimensionSize - 1; i++, columnIndex++) {
            row[i] = DimensionLabelCell(this.getRowAxisLabel(i));
        }
        row.push(DimensionLabelCell(this.getCrossAxisLabel()));
        return row;
    }

    for (let i=0, columnIndex=columnStart; columnIndex < this.rowDimensionSize - 1; i++, columnIndex++) {
        row[i] = DimensionLabelCell('&nbsp;');
    }

    row.push(DimensionLabelCell(this.getColumnAxisLabel(rowIndex)));

    return row;
};

/**
 * Creates axis dimension span map
 * 
 * @param {array} spanValues 
 * @returns {array}
 */
PivotTable.prototype.createSpanMap = function(spanValues) {
    if (!spanValues) {
        spanValues = [];
    }
    return Array.from(spanValues, value => defaultProxyGenerator(value));
};

/**
 * Creates row axis dimension span map
 * 
 * @returns {array}
 */
PivotTable.prototype.createRowSpanMap = function() {
    return this.createSpanMap(this.rowAxis.span);
};

/**
 * Creates column axis dimension span map
 * 
 * @returns {array}
 */
PivotTable.prototype.createColumnSpanMap = function() {
    return this.createSpanMap(this.colAxis.span);
};

/**
 * updated given total object based on given parameters
 * 
 * @param {number} rowIndex 
 * @param {number} columnIndex 
 * @param {object} valueObject 
 * @param {object} totalObject 
 */
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
            empty: 0,
        }
    }

    if (valueObject.value === null) {
        totalObject[rowIndex][columnIndex].empty++;
    }

    totalObject[rowIndex][columnIndex].counter++;

    addMerge(totalObject[rowIndex][columnIndex], valueObject);
};

/**
 * Increments value lookup iterator offset by row sub total columns
 * 
 * @param {number} columnIndex 
 * @returns 
 */
PivotTable.prototype.columnAxisOffsetIncrement = function(columnIndex) {
    if (this.doRowSubTotals() && (columnIndex + 2) % (this.colUniqueFactor + 1) === 0) {
        return 2;
    }
    return 1;
};

/**
 * Increments value lookup iterator offset by column sub total rows
 * 
 * @param {number} rowIndex 
 * @returns 
 */
PivotTable.prototype.rowAxisOffsetIncrement = function(rowIndex) {
    if (this.doColSubTotals() && (rowIndex + 2) % (this.rowUniqueFactor + 1) === 0) {
        return 2;
    }
    return 1;
};

/**
 * Creates a value lookup table
 * 
 * @returns {array/object}
 */
PivotTable.prototype.createValueLookup = function() {

    let tableRowSize = this.rowSize,
        tableColumnSize = this.columnSize;

    const valueMap = {},
          totalMap = {};

    if (!this.doRowTotals()) {
        tableRowSize += 1;
    }

    if (!this.doRowTotals()) {
        tableColumnSize += 1;
    }

    for (let i=0, rowIndex=0; i < this.rowAxis.size; i++, rowIndex += this.rowAxisOffsetIncrement(rowIndex)) {
        for (let j=0, columnIndex=0, value, valueObject; j < this.colAxis.size; j++, columnIndex += this.columnAxisOffsetIncrement(columnIndex)) {

            valueObject = this.getValueObject(i, j);

            if (valueObject) {
                if (!valueMap[rowIndex]) {
                    valueMap[rowIndex] = {};
                }
                valueMap[rowIndex][columnIndex] = valueObject.empty ? null : valueObject.value;
            }

            // calculate grand totals
            this.updateValueTotal(this.getNextTotalRowIndex(), columnIndex, valueObject, totalMap);
            this.updateValueTotal(rowIndex, this.getNextTotalColumnIndex(), valueObject, totalMap);

            // calculate sub totals
            if (this.doColSubTotals()) this.updateValueTotal(this.getNextSubRowIndex(i), columnIndex, valueObject, totalMap);
            if (this.doRowSubTotals()) this.updateValueTotal(rowIndex, this.getNextSubColumnIndex(j), valueObject, totalMap);
            
            // calculate intersection totals
            if (this.doRowTotals() && this.doColTotals()) this.updateValueTotal(this.getNextTotalRowIndex(), this.getNextTotalColumnIndex(), valueObject, totalMap);
            if (this.doColSubTotals() && this.doRowSubTotals()) this.updateValueTotal(this.getNextSubRowIndex(i), this.getNextSubColumnIndex(j), valueObject, totalMap);
            if (this.doRowTotals() && this.doRowSubTotals()) this.updateValueTotal(this.getNextTotalRowIndex(), this.getNextSubColumnIndex(j), valueObject, totalMap);
            if (this.doColSubTotals() && this.doColTotals()) this.updateValueTotal(this.getNextSubRowIndex(i), this.getNextTotalColumnIndex(), valueObject, totalMap);
        }
    }

    for (let i=0, rowTotalIndicies=Object.keys(totalMap); i < rowTotalIndicies.length; i++) {
        for (let j=0, columnTotalIndicies=Object.keys(totalMap[rowTotalIndicies[i]]); j < columnTotalIndicies.length; j++) {

            let rowIndex = rowTotalIndicies[i],
                columnIndex = columnTotalIndicies[j];

            if (!valueMap[rowIndex]) {
                valueMap[rowIndex] = {};
            }

            if (totalMap[rowIndex][columnIndex].counter !== totalMap[rowIndex][columnIndex].empty) {
                let total = this.getTrueTotal(
                    totalMap[rowIndex][columnIndex].numerator,
                    totalMap[rowIndex][columnIndex].denominator || 1,
                    totalMap[rowIndex][columnIndex].factor / totalMap[rowIndex][columnIndex].counter);
    
                valueMap[rowIndex][columnIndex] = total;
            } else {
                valueMap[rowIndex][columnIndex] = null;
            }

        }        
    }

    return valueMap;
};

/**
 * Creates a row axis render map
 * 
 * @returns {object}
 */
PivotTable.prototype.createRowRenderMap = function() {
    let map = [];
    
    for (let i = 0; i < this.getValueTableHeigth(); i++) {
        
        if (!this.isRowEmpty(i) || !this.doHideEmptyRows()) {
            map.push(i);
            continue;
        }

        this.numberOfEmptyRows += 1;
        for (let j=0; j < this.rowAxis.span.length; j++) {
            this.decremenetRowAxisSpan(this.normalizeRowIndex(i), j);
        }
    }
    return map;
};

/**
 * Creates a column axis render map
 * 
 * @returns {object}
 */
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

/**
 * Returns row index constrained against the height of the table
 * 
 * @param {number} rowIndex 
 * @returns {number}
 */
PivotTable.prototype.constrainHeight = function(rowIndex) {
    return Math.min(this.getRowAxisSize() - this.numberOfEmptyRows, rowIndex);
};
/**
 * Returns column index constrained against the width of the table
 * 
 * @param {number} columnIndex 
 * @returns {number}
 */
PivotTable.prototype.constrainWidth = function(columnIndex) {
    return Math.min(this.getColumnAxisSize() - this.numberOfEmptyColumns, columnIndex);
};
/**
 * Normalizes given row index based on previous sub column rows
 * 
 * @param {number} rowIndex 
 * @returns {number}
 */
PivotTable.prototype.normalizeRowIndex = function(rowIndex) {
    if (this.doColSubTotals()) {
        rowIndex = Math.max(0, rowIndex - Math.floor(rowIndex / (this.rowUniqueFactor + 1)));
    }
    return rowIndex;
};
/**
 * Normalizes given column index based on previous sub row columns
 * 
 * @param {number} columnIndex 
 * @returns {number}
 */
PivotTable.prototype.normalizeColumnIndex = function(columnIndex) {
    if (this.doRowSubTotals()) {
        return Math.max(0, columnIndex - Math.floor(columnIndex / (this.colUniqueFactor + 1)));    
    }
    return columnIndex;
};

/**
 * Builds table filter
 * 
 * @param {any} span 
 * @returns 
 */
PivotTable.prototype.buildTableFilter = function(span) {
    if (!this.filters) {
        return [];
    }

    return [
        [this.buildHtmlCell(FilterCell(this.getRecordNames(), this.getTopBarSpan(span)))]
    ];
};

/**
 * Builds table title
 * 
 * @param {any} span 
 * @returns 
 */
PivotTable.prototype.buildTableTitle = function(span) {
    if (!this.title) {
        return [];
    }

    return [
        [this.buildHtmlCell(FilterCell(this.title, this.getTopBarSpan(span)))]
    ];
};

/**
 * Gets legends
 * 
 * @param {any} dxId 
 * @returns 
 */
PivotTable.prototype.getLegends = function(dxId) {
    return this.appManager.getLegendSetById(
        this.getLegendSetId(config.dxId)).legends;
};

/**
 * Gets legend set
 * 
 * @param {any} dxId 
 * @returns 
 */
PivotTable.prototype.getLegendSet = function(dxId) {
    if (!dxId) {
        return null;
    }

    return this.response.metaData.items[config.dxId].legendSet
};

/**
 * Converts table cell to html string
 * 
 * @param {object} config 
 * @returns {string}
 */
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
    
    if (this.doDynamicRendering()) {
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

    style += config.style ? config.style : '';

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

/**
 * Converts array of table cells to array of html strings
 * 
 * @param {array} objectArray 
 * @returns {array}
 */
PivotTable.prototype.buildHtmlRows = function(objectArray) {
    this.valueUuids = [];
    return objectArray.map((row) => {
        return row.map((cell) =>{
            if (cell.uuid) this.valueUuids.push(cell.uuid);
            return this.buildHtmlCell(cell);
        });
    });
};

/**
 * Converts array of table cells to html strings
 * 
 * @param {any} htmlArray 
 * @param {any} start 
 * @param {any} end 
 * @returns {array}
 */
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

/**
 * Converts array of table cells to html strings with padding
 * 
 * @param {any} htmlArray 
 * @param {any} start 
 * @param {any} end 
 * @returns 
 */
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

/**
 * Builds top padding row
 * 
 * @returns {string}
 */
PivotTable.prototype.buildTopPaddingHtmlRow = function() {
    const cell = this.buildTopPaddingHtmlCell();

    if (cell) {
        return `<tr>${cell}</tr>`;
    }

    return  '';
};

/**
 * Builds bottom padding row
 * 
 * @returns {string}
 */
PivotTable.prototype.buildBottomPaddingHtmlRow = function() {
    const cell = this.buildBottomPaddingHtmlCell();
    
    if (cell) {
        return `<tr>${cell}</tr>`;
    }

    return  '';
};

/**
 * Builds top padding cell
 * 
 * @returns {string}
 */
PivotTable.prototype.buildTopPaddingHtmlCell = function() {
    const padding = this.getTopPadding(),
             cell = VerticalPaddingCell(padding, 'top-padding');

    return this.buildHtmlCell(cell);
};

/**
 * Builds bottom padding cell
 * 
 * @returns {string}
 */
PivotTable.prototype.buildBottomPaddingHtmlCell = function() {
    const padding = this.getBottomPadding(),
            cell  = VerticalPaddingCell(padding, 'bottom-padding');

    return this.buildHtmlCell(cell);
};

/**
 * Builds left padding cell
 * 
 * @returns {string}
 */
PivotTable.prototype.buildLeftPaddingHtmlCell = function() {
    const padding = this.getLeftPadding(),
            cell  = HorizontalPaddingCell(padding, 'left-padding');

    return this.buildHtmlCell(cell);
};

/**
 * Builds right padding cell
 * 
 * @returns {string}
 */
PivotTable.prototype.buildRightPaddingHtmlCell = function() {
    const padding = this.getRightPadding(),
            cell  = HorizontalPaddingCell(padding, 'right-padding');

    return this.buildHtmlCell(cell);
};

/**
 * Builds html table head
 * 
 * @param {string} htmlArray 
 * @returns 
 */
PivotTable.prototype.buildHtmlTableHead = function(htmlArray) {
    let cls = '';

    return `
        <thead class="${cls}">
            ${this.doDynamicRendering() ? this.buildTopPaddingHtmlRow() : ''}
            ${this.buildHtmlTableRows(htmlArray, 0, this.columnDimensionSize - this.rowStart)}
        </thead>
    `;
};

/**
 * Buidlds html table body
 * 
 * @param {array} htmlArray 
 * @returns {string}
 */
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

/**
 * Build html table
 * 
 * @param {array} htmlArray 
 * @returns {string}
 */
PivotTable.prototype.buildHtmlTable = function(htmlArray) {
    let cls      = 'pivot user-select',
        style    = '',
        overflow = 'visible';

    cls += this.displayDensity ? ' displaydensity-' + this.displayDensity : '';
    cls += this.fontSize       ? ' fontsize-' + this.fontSize : '';

    style += `display:flex!important;overflow:${overflow};`;

    return `
        <div style="${style}">
            <table class="${cls}">
                ${this.buildHtmlTableBody(htmlArray)}
            </table>
        </div>
    `;
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

    let rowAxis = this.buildRowAxis(),
        colAxis = this.buildColumnAxis(),
        values  = this.buildValueTable(this.rowStart, this.rowEnd, this.columnStart, this.columnEnd);

    for (let i = 0; i < rowAxis.length; i++) {
        rowAxis[i].push(...values[i]);
    }

    this.table = toRow(colAxis).concat(rowAxis);
};

/**
 * Renders table in form of html string
 * 
 * @returns {string}
 */
PivotTable.prototype.render = function() {

    this.updateDimensionSpan();

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

    if (this.columnEnd < columnEnd) {
        this.setColumnEnd(this.columnEnd + 1);
        this.addRight(this.columnEnd, this.rowStart, this.rowEnd);
    }

    if (this.rowStart > rowStart) {
        this.rowStart--;
        this.addTop(this.rowStart, this.columnStart, this.columnEnd);
    }

    if (this.rowEnd < rowEnd) {
        this.setRowEnd(this.rowEnd + 1);
        this.addBottom(this.rowEnd, this.columnStart, this.columnEnd);
    }

    if (this.rowStart < rowStart) {
        this.rowStart++;
        this.deleteTop();
    }

    if (this.rowEnd > rowEnd) {
        this.setRowEnd(this.rowEnd - 1);
        this.deleteBottom();
    }
    
    if (this.columnStart < columnStart) {
        this.columnStart++;
        this.deleteLeft();
    } 

    if (this.columnEnd > columnEnd) {
        this.setColumnEnd(this.columnEnd - 1);
        this.deleteRight();
    }
};

/**
 * Decreses the row span by 1 of the associated dimension at 
 * given row index.
 * 
 * @param {number} rowIndex index of row dimension
 * @param {number} dimensionIndex dimension id
 */
PivotTable.prototype.decremenetRowAxisSpan = function(rowIndex, dimensionIndex) {
    this.rowAxisSpanMap[dimensionIndex][Math.floor(rowIndex / this.rowAxis.span[dimensionIndex])] -= 1;
};

/**
 * Decreses the column span by 1 of the associated dimension at 
 * given column index.
 * 
 * @param {number} columnIndex index of column dimension
 * @param {number} dimensionIndex dimension id
 */
PivotTable.prototype.decrementColumnAxisSpan = function(columnIndex, dimensionIndex) {
    this.columnAxisSpanMap[dimensionIndex][Math.floor(columnIndex / this.colAxis.span[dimensionIndex])] -= 1;
};

/**
 * Builds value table based on given parameters
 * 
 * @param {any} rowStart 
 * @param {any} rowEnd 
 * @param {any} columnStart 
 * @param {any} columnEnd 
 * @returns {array}
 */
PivotTable.prototype.buildValueTable = function(rowStart, rowEnd, columnStart, columnEnd) {

    rowEnd    -= this.getValueRowStartOffset();
    columnEnd -= this.getValueColumnStartOffset();

    let rowSize = (rowEnd - rowStart + 1),       // TODO: why + 1?
        colSize = (columnEnd - columnStart + 1); // TODO: why + 1?

    if (!this.doHideEmptyColumns() && colSize === 0) {
        colSize = 1;
    }

    if (!this.doHideEmptyRows() && rowSize === 0) {
        rowSize = 1;
    }

    let table = [];

    if (this.doDynamicRendering()) {
        rowSize = Math.min(rowSize, this.rowAxisLookup.length);
        colSize = Math.min(colSize, this.columnAxisLookup.length);
    }

    for (let i=0, rowIndex=rowStart; i < rowSize; i++, rowIndex++) {
        table.push([])
        for (let j=0, columnIndex=columnStart; j < colSize; j++, columnIndex++) {
            if (this.doSortableColumnHeaders()) {
                let totalIdComb = new ResponseRowIdCombination(this.refs, ['total', this.rowAxis.ids[rowIndex]]);
                this.idValueMap[totalIdComb.get()] = this.isRowEmpty(rowIndex) ? null : this.getRowTotal(rowIndex);
            }
            table[i][j] = this.buildValueCell(columnIndex, rowIndex);
        }
    }

    return table;
};

/**
 * Updates row axis dimension spans based on current render area
 * 
 * @returns 
 */
PivotTable.prototype.updateRowAxisDimensionSpan = function() {
    if (!this.rowAxis.type) return;

    const rowSpanLimit = this.rowEnd - this.rowStart + 1 - Math.max(0, this.columnDimensionSize - this.rowStart);

    for (let i=0, columnIndex=this.columnStart; i < (this.rowDimensionSize - this.columnStart); i++, columnIndex++) {
        for (let j=this.getValueRowStartOffset(), rowIndex=this.getValueOffsetRow(), rowSpanCounter=0, currentRowSpan = 0; j < this.table.length; j++, rowIndex++) {      

            let cell = this.table[j][i];
            if (cell.collapsed || (this.doHideEmptyRows() && this.isRowEmpty(this.rowAxisLookup[rowIndex]))) {
                continue;
            }

            if (cell.type === 'dimensionSubtotal') {
                rowSpanCounter += 1;
                cell.hidden =  i !== 0;
                continue;
            }

            currentRowSpan -= 1;
            cell.hidden = this.checkAxisHiddenParameters(cell, i, j, currentRowSpan);

            if (currentRowSpan <= 0 && this.rowAxis.span[columnIndex] !== 1) {
                currentRowSpan = this.getUpdatedRowSpan(rowIndex, columnIndex);
            }

            if (this.rowAxis.span[columnIndex] === 1) {
                currentRowSpan = 1;
            }
 
            cell.rowSpan = currentRowSpan;

            if (cell.hidden) {
                continue;
            }
            
            if (cell.rowSpan + rowSpanCounter > rowSpanLimit) {
                cell.rowSpan = rowSpanLimit - rowSpanCounter;
            }

            rowSpanCounter += cell.rowSpan;
        }
    }
};

/**
 * Updates column axis dimension span based on current render area
 * 
 * @returns 
 */
PivotTable.prototype.updateColumnAxisDimensionSpan = function() {
    if (!this.colAxis.type) return;

    const colSpanLimit = this.columnEnd - this.columnStart + 1 - Math.max(0, this.rowDimensionSize - this.columnStart);

    for (let i=0, rowIndex=this.rowStart; i < (this.columnDimensionSize - this.rowStart); i++, rowIndex++) {
        for (let j=this.getValueColumnStartOffset(), columnIndex=this.getValueOffsetColumn(), colSpanCounter=0, currentColSpan=0; j < this.table[i].length; j++, columnIndex++) {      

            let cell = this.table[i][j];

            if (cell.collapsed || (this.doHideEmptyColumns() && this.isColumnEmpty(this.columnAxisLookup[columnIndex]))) {
                continue;
            }

            if (cell.type === 'dimensionSubtotal') {
                colSpanCounter += 1;
                cell.hidden =  i !== 0;
                continue;
            }

            currentColSpan -= 1;
            cell.hidden = this.checkAxisHiddenParameters(cell, i, j, currentColSpan);

            if (currentColSpan <= 0 && this.colAxis.span[rowIndex] !== 1) {
                currentColSpan = this.getUpdatedColumnSpan(columnIndex, rowIndex);
            }
 
            if (this.colAxis.span[rowIndex] === 1) {
                currentColSpan = 1;
            }

            cell.colSpan = currentColSpan;

            if (cell.hidden) {
                continue;
            }
            
            if (cell.colSpan + colSpanCounter > colSpanLimit) {
                cell.colSpan = colSpanLimit - colSpanCounter;
            }

            colSpanCounter += cell.colSpan;
        }
    }
};

/**
 * Updates corner axis dimension span based on current render area
 * 
 */
PivotTable.prototype.updateCornerAxisDimensionSpan = function() {
    const rowSpanLimit = this.rowEnd - this.rowStart + 1;

    for (let i=0, columnIndex=this.columnStart, cell; i < this.rowDimensionSize - this.columnStart; i++, columnIndex++) {
        for (let j=0, rowSpanCounter=0; j < this.columnDimensionSize - this.rowStart; j++) {

            cell = this.table[j][i];

            if (cell.collapsed) continue;

            cell.rowSpan = this.getAdjustedRowSpan(cell, columnIndex);
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
};

/**
 * Utility function for updating dimension span
 * 
 */
PivotTable.prototype.updateDimensionSpan = function() {
    this.updateCornerAxisDimensionSpan();
    this.updateColumnAxisDimensionSpan();
    this.updateRowAxisDimensionSpan();
};

/**
 * Checks if current axis dimension cell should be hidden based on given parameters
 * 
 * @param {any} cell 
 * @param {any} i 
 * @param {any} j 
 * @param {any} span 
 * @returns {boolean}
 */
PivotTable.prototype.checkAxisHiddenParameters = function(cell, i, j, span) {
    switch (cell.type) {
        case 'labeled': {
            return false;
        }

        case 'empty': {
            if (this.doHideEmptyColumns() && this.columnEnd - this.columnStart - 1 === 0) {
                return i !== 0;
            }
            return !(i === 0 && j === 0);
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

/**
 * Returns some table statistics in form of string
 * 
 * @returns {string}
 */
PivotTable.prototype.statistics = function() {
    return {
        "rows:": Object.keys(this.valueLookup).length,
        "columns:": Object.keys(this.valueLookup[0]).length,
        "cells": Object.keys(this.valueLookup).length * Object.keys(this.valueLookup[0]).length,
    };
};

/**
 * Prints statistics
 * 
 * @returns {string}
 */
PivotTable.prototype.printStatistics = function() {
    console.log(this.statistics());
};