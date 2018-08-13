import isString from 'd2-utilizr/lib/isString';
import isNumber from 'd2-utilizr/lib/isNumber';
import isObject from 'd2-utilizr/lib/isObject';
import isBoolean from 'd2-utilizr/lib/isBoolean';
import isEmpty from 'd2-utilizr/lib/isEmpty';
import numberConstrain from 'd2-utilizr/lib/numberConstrain';
import objectApplyIf from 'd2-utilizr/lib/objectApplyIf';
import arrayContains from 'd2-utilizr/lib/arrayContains';
import arrayClean from 'd2-utilizr/lib/arrayClean';

import { ResponseRowIdCombination } from '../api/ResponseRowIdCombination';

import { isColorBright } from '../util/colorUtils';

import { toRow,
         getPercentageHtml,
         addMerge,
         defaultProxyGenerator } from './PivotTableUtils';

import { SubTotalCell,
         TotalCell,
         RowAxisCell,
         ColumnAxisCell,
         DimensionSubTotalCell,
         DimensionGrandTotalCell,
         DimensionEmptyCell,
         DimensionLabelCell,
         ValueCell,
         PlainValueCell,
         FilterCell,
         TopPaddingCell,
         BottomPaddingCell,
         LeftPaddingCell,
         RightPaddingCell } from './PivotTableCells';

import { VALUE_CELL,
         DIMENSION_CELL,
         DIMENSION_SUB_TOTAL_CELL,
         DIMENSION_TOTAL_CELL,
         EMPTY_CELL,
         LABELED_CELL } from '../table/PivotTableConstants';

import { FIXED_STRATEGY, BY_DATA_ITEM_STRATEGY } from '../table/PivotTableConstants';

import { NO_BREAK_SPACE } from '../table/PivotTableConstants';

import { FILL_STYLE, TEXT_STYLE } from '../table/PivotTableConstants';

import { TOTAL_SORT } from '../table/PivotTableConstants';

import { WHITE_COLOR, BLACK_COLOR } from '../table/PivotTableConstants';

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
        renderLimit: 100000,
        renderOffset: 1,
        cellHeight: 25,
        cellWidth: 120,
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
        legend: {
            displayStyle: layout.legendDisplayStyle,
            displayStrategy: layout.legendDisplayStrategy,
        },
        rows: {
            showTotals: !!layout.showRowTotals,
            showSubTotals: !!layout.showRowSubTotals,
            hideEmpty: !!layout.hideEmptyRows,
            sticky: !!layout.stickyRowDimension,
        },
        columns: {
            showTotals: !!layout.showColTotals,
            showSubTotals: !!layout.showColSubTotals,
            hideEmpty: !!layout.hideEmptyColumns,
            sticky: !!layout.stickyColumnDimension,
        },
        cell: {
            width: 25,
            height: 120,
            numberType: layout.numberType,
        },
        debug: {
            clipping: false,
        },
        ...options,
    }

    this.title = layout.title;
    this.digitGroupSeparator = layout.digitGroupSeparator;

    this.fontSize = layout.fontSize;
    this.displayDensity = layout.displayDensity;

    this.uuidDimUuidsMap = {};
    
    this.valueUuids = [];
    this.dimensionUuids = [];
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
    
    this.valueCounter = 0;
    this.numberOfEmptyRows = 0;
    this.numberOfEmptyColumns = 0;
};

/**
 * @description Pivot table initialization function, does most of the heavy lifting.
 * 
 */
PivotTable.prototype.initialize = function() {

    this.idValueMap = this.response.getIdMap(this.layout, 'value');
    this.idFactorMap = this.response.getIdMap(this.layout, 'factor');
    this.idNumeratorMap = this.response.getIdMap(this.layout, 'numerator');
    this.idDenominatorMap =  this.response.getIdMap(this.layout, 'denominator');

    this.rowSize = this.rowAxis.getSize(this.doColSubTotals(), this.doColTotals());
    this.columnSize = this.colAxis.getSize(this.doRowSubTotals(), this.doRowTotals());

    // lookup for values
    this.valueLookup = {}
    this.rowTotalLookup = defaultProxyGenerator(0);
    this.columnTotalLookup = defaultProxyGenerator(0);

    // initialize lookup tables
    this.initializeLookups();

    // lookup for rows/columns to render (used to determine what rows/columns are hidden).
    if (this.doHideEmptyRows()) {
        this.rowAxisLookup = this.createRowRenderMap();
    }

    if (this.doHideEmptyColumns()) {
        this.columnAxisLookup = this.createColumnRenderMap();
    }
};

// setters
/**
 * Sets the cell width of each cell in the  table.
 * 
 * @param {number} widthInPixels The width of each cell in pixels
 */
PivotTable.prototype.setCellWidth = function(widthInPixels) {
    this.options.cellWidth = widthInPixels;
};

/**
 * Sets the cell height of each cell in the table.
 * 
 * @param {number} heightInPixels The height of each cell in pixels
 */
PivotTable.prototype.setCellHeight = function(heightInPixels) {
    this.options.cellHeight = heightInPixels;
};

/**
 * Sets the width of the viewport used to render the table.
 * 
 * @param {number} widthInPixels The width of the viewport in pixels
 */
PivotTable.prototype.setViewportWidth = function(widthInPixels) {
    this.viewportWidth = widthInPixels;
};

/**
 * Sets the height of the viewport used to render the table.
 * 
 * @param {number} heightInPixels The height of the viewport in pixels
 */
PivotTable.prototype.setViewportHeight = function(heightInPixels) {
    this.viewportHeight = heightInPixels;
};

/**
 * Sets the index of where the table will start rendering columns.
 * 
 * @param {number} columnIndex The index of the column to render
 */
PivotTable.prototype.setColumnStart = function(columnIndex) {

    if (columnIndex < 0) {
        throw RangeError("Column index is out of bounds!")
    }

    this.columnStart = Math.max(0, columnIndex);
};

/**
 * Sets the index of where the table will start rendering rows.
 * 
 * @param {number} rowIndex The index of the row to render
 */
PivotTable.prototype.setRowStart = function(rowIndex) {

    if (rowIndex < 0) {
        throw RangeError("Column index is out of bounds!")
    }

    this.rowStart = Math.max(0, rowIndex);
};

/**
 * Sets the index of where the table will end rendering columns.
 * 
 * @param {number} columnIndex The index of the column to render
 */
PivotTable.prototype.setColumnEnd = function(columnIndex) {
    this.columnEnd = this.constrainWidth(columnIndex);
};

/**
 * Sets the index of where the table will end rendering rows.
 * 
 * @param {number} rowIndex The index of the row to render
 */
PivotTable.prototype.setRowEnd = function(rowIndex) {
    this.rowEnd = this.constrainHeight(rowIndex);
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
 * Sets the size of the viewport and rebuilds the table.
 * 
 * @param {number} [widthInPixels=0] 
 * @param {number} [heightInPixels=0] 
 */
PivotTable.prototype.setViewportSize = function(widthInPixels=0, heightInPixels=0) {
    this.setViewportWidth(widthInPixels);
    this.setViewportHeight(heightInPixels);
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
    return this.options.showColTotals && !!this.rowAxis.size;
};

/**
 * Checks if show total rows option is enabled.
 * 
 * @returns {boolean}
 */
PivotTable.prototype.doRowTotals = function() {
    return this.options.showRowTotals && !!this.colAxis.size;
};

/**
 * Checks if show sub total columns option is enabled.
 * 
 * @returns {boolean}
 */
PivotTable.prototype.doColSubTotals = function() {
    return this.options.showColSubTotals && 
        this.rowAxis.type && 
        this.rowAxis.dims > 1;
};

/**
 * Checks if show sub total rows option is enabled.
 * 
 * @returns {boolean}
 */
PivotTable.prototype.doRowSubTotals = function() {
    return this.options.showRowSubTotals && 
        this.colAxis.type && 
        this.colAxis.dims > 1;
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
    return this.rowAxis.type && this.rowAxis.dims === 1;
};

/**
 * Checks if hide empty columns option is enabled.
 * 
 * @returns {boolean}
 */
PivotTable.prototype.doHideEmptyRows = function() {
    return this.options.hideEmptyRows &&
        this.colAxis.type && 
        this.rowAxis.type;
};

/**
 * Checks if hide empty rows option is enabled.
 * 
 * @returns {boolean}
 */
PivotTable.prototype.doHideEmptyColumns = function() {
    return this.options.hideEmptyColumns &&
        this.colAxis.type &&
        this.rowAxis.type;
};

/**
 * Checks if show dimension labels option is enabled.
 * 
 * @returns {boolean}
 */
PivotTable.prototype.doShowDimensionLabels = function() {
    return this.options.showDimensionLabels;
};

/**
 * Checks if dynamic table rendering option should be enabled.
 * 
 * @returns {boolean}
 */
PivotTable.prototype.doClipping = function() {
    return this.doRender() || this.options.debug.clipping;
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
    return this.legendDisplayStrategy === this.getLegendDisplayStrategyId(BY_DATA_ITEM_STRATEGY);
};

/**
 * Checks if legend display option is enbalied
 * 
 * @returns {boolean}
 */
PivotTable.prototype.doLegendDisplay = function() {
    return this.legendDisplayStrategy !== this.getLegendDisplayStrategyId(FIXED_STRATEGY);
};

/**
 * Checks if legend display style fill option is enabled
 * 
 * @returns {boolean}
 */
PivotTable.prototype.doLegendDisplayStyleFill = function() {
    return this.legendDisplayStyle === this.getLegendDisplayStyleId(FILL_STYLE);
};

/**
 * Checks if legend display style text option is enabled
 * 
 * @returns {boolean}
 */
PivotTable.prototype.doLegendDisplayStyleText = function() {
    return this.legendDisplayStyle === this.getLegendDisplayStyleId(TEXT_STYLE);
};

// checkers

PivotTable.prototype.isSubColumnIndex = function(columnIndex) {

    columnIndex = this.normalizeColumnIndex(columnIndex);

    return (columnIndex % this.colAxis.uniqueFactor + 1) === 0;
}

PivotTable.prototype.isSubRowIndex = function(rowIndex) {

    rowIndex = this.normalizeColumnIndex(rowIndex);

    return (rowIndex % this.rowAxis.uniqueFactor + 1) === 0;
}

PivotTable.prototype.isColumnHidden = function(columnIndex) {
    return this.doHideEmptyColumns() && 
        this.isColumnEmpty(this.getTrueColumnIndex(columnIndex));
}

PivotTable.prototype.isRowHidden = function(rowIndex) {
    return this.doHideEmptyRows() &&
        this.isRowEmpty(this.getRowIndexWithHidden(rowIndex));
}

PivotTable.prototype.isCellDimensionTotal = function(cell) {
    return cell.type === DIMENSION_SUB_TOTAL_CELL ||
        cell.type === DIMENSION_TOTAL_CELL;
}

PivotTable.prototype.isCellValid = function(cell) {
    return cell && !cell.collapsed;
}

/**
 * Checks if pivot table consists of a single value.
 * 
 * @returns {boolean}
 */
PivotTable.prototype.isSingleValue = function() {
    return this.valueCounter === 1;
};

/**
 * Checks if column located at given column index is a sub total column.
 * 
 * @param {number} columnIndex index of column to be checked
 * @returns {boolean}
 */
PivotTable.prototype.isColumnSubTotal = function(columnIndex) {
    return this.doRowSubTotals() && 
        (columnIndex + 1) % (this.colAxis.uniqueFactor + 1) === 0;
};

/**
 * Checks if column located at given column index is a total column.
 * 
 * @param {number} columnIndex index of column to be checked
 * @returns {boolean}
 */
PivotTable.prototype.isColumnGrandTotal = function(columnIndex) {
    return this.doRowTotals() && 
        columnIndex === this.columnSize - 1;
};

/**
 * Checks if row located at given row index is a sub total row.
 * 
 * @param {number} rowIndex index of column to be checked
 * @returns {boolean}
 */
PivotTable.prototype.isRowSubTotal = function(rowIndex) {
    return this.doColSubTotals() &&
        (rowIndex + 1) % (this.rowAxis.uniqueFactor + 1) === 0;
};

/**
 * Checks if row located at given row index is a sub total row.
 * 
 * @param {number} rowIndex index of row to be checked
 * @returns {boolean}
 */
PivotTable.prototype.isRowGrandTotal = function(rowIndex) {
    return this.doColTotals() && rowIndex === this.rowSize - 1;
};

/**
 * Checks if row located at row index is empty.
 * 
 * @param {number} rowIndex 
 * @returns {boolean}
 */
PivotTable.prototype.isRowEmpty = function(rowIndex) {
    return this.rowTotalLookup[rowIndex] <= 0;
};

/**
 * Checks if column located at column index is empty.
 * 
 * @param {number} columnIndex 
 * @returns {boolean}
 */
PivotTable.prototype.isColumnEmpty = function(columnIndex) {
    return this.columnTotalLookup[columnIndex] <= 0;
};

/**
 * Checks if row located at row index is part of column axis.
 * 
 * @param {number} columnIndex 
 * @returns {boolean}
 */
PivotTable.prototype.isColumnDimensionRow = function(rowIndex) {
    return rowIndex < this.colAxis.dims;
};

/**
 * Checks if column located at column index is part of row axis.
 * 
 * @param {number} columnIndex 
 * @returns {boolean}
 */
PivotTable.prototype.isRowDimensionColumn = function(columnIndex) {
    return columnIndex < this.rowAxis.dims;
};

/**
 * Checks if given cell is of type text field.
 * 
 * @param {string} type 
 * @returns 
 */
PivotTable.prototype.isTextField = function(type) {
    return !arrayContains(['dimension', 'filter'], type);
};

// getters

PivotTable.prototype.getColumnRenderLimit = function() {
    return this.columnEnd - this.columnStart + 1 - Math.max(0, this.rowAxis.dims - this.columnStart);
}

PivotTable.prototype.getRowRenderLimit = function() {
    return this.rowEnd - this.rowStart + 1 - Math.max(0, this.colAxis.dims - this.rowStart);
}

PivotTable.prototype.getSingleValue = function() {
    if (this.valueLookup[0] && 
        this.valueLookup[0][0] !== null &&
        typeof this.valueLookup[0][0] !== 'undefined') {
        return this.valueLookup[0][0];
    }
}

PivotTable.prototype.getSubtitle = function() {
    const rowAxis = this.rowAxis;
    const colAxis = this.colAxis;

    let subtitle = '';

    if (rowAxis) {
        for (let i = 0; i < rowAxis.objects.all.length; i++) {
            for (let j = 0; j < rowAxis.objects.all[i].length; j++) {
                if (subtitle.length !== 0) {
                    subtitle += ', ';
                }
                subtitle += rowAxis.objects.all[i][j].displayValue;
            }
        }
    }

    if (colAxis) {
        for (let i = 0; i < colAxis.objects.all.length; i++) {
            for (let j = 0; j < colAxis.objects.all[i].length; j++) {
                if (subtitle.length !== 0) {
                    subtitle += ', ';
                }
                subtitle += colAxis.objects.all[i][j].displayValue;
            }
        }
    }

    return subtitle;
}

PivotTable.prototype.getBaseCellStyling = function(cell) {
    
    if (this.doClipping()) {
        return `
            min-width:${cell.width}px!important;
            min-height:${cell.height}px!important;
            max-width:${cell.width}px!important;
            max-height:${cell.height}px!important;
            width:${cell.width}px!important;
            height:${cell.height}px!important;
            white-space: nowrap!important;
            overflow: hidden!important;
            text-overflow: ellipsis!important;
        `;
    }
    
    return '';
}

PivotTable.prototype.getTrueColumnIndex = function(columnIndex) {

    if (this.doHideEmptyColumns()) {
        return this.columnAxisLookup[columnIndex];
    }

    return columnIndex;
};

PivotTable.prototype.getRowIndexWithHidden = function(rowIndex) {

    if (this.doHideEmptyRows()) {
        return this.rowAxisLookup[rowIndex];
    }
    
    return rowIndex;
};

/**
 * Get width of value table (table without axis).
 * 
 * @returns 
 */
PivotTable.prototype.getValueTableWidth = function() {
    return Object.keys(this.valueLookup[0]).length - 1;
};
/**
 * Get height of value table (table without axis).
 * 
 * @returns 
 */
PivotTable.prototype.getValueTableHeigth = function() {
    return Object.keys(this.valueLookup).length - 1;
};

/**
 * Gets the row index of where the value table starts relative to the
 * current state of the table.
 * Mostly used to offset the row index to skip over column
 * axis dimensions.
 * 
 * @returns {number}
 */
PivotTable.prototype.getNumberOfVisibleColumnDimensions = function() {
    return Math.max(0, this.colAxis.dims - this.rowStart);
};

/**
 * Gets the column index of where the value table starts relative to the
 * current state of the table.
 * Mostly used to offset the column index to skip over row
 * axis dimensions.
 * @returns {number}
 */
PivotTable.prototype.getNumberOfVisibleRowDimensions = function() {
    return Math.max(0, this.rowAxis.dims - this.columnStart);
};

/**
 * Gets the amount of offset needed to get to row values,
 * this is used to get values out of the value lookup table.
 * 
 * @returns {number}
 */
PivotTable.prototype.getRowValueOffset = function() {
    return Math.max(0, this.rowStart - this.colAxis.dims);
};

/**
 * Gets the amount of offset needed to get to column values,
 * this is used to get values out of the value lookup table.
 * 
 * @returns {number}
 */
PivotTable.prototype.getColumnValueOffset = function() {
    return Math.max(0, this.columnStart - this.rowAxis.dims);
};

/**
 * Gets the row span of a given dimension based on the current
 * state of the table.
 * 
 * @param {number} rowIndex index of row axis
 * @param {number} dimensionIndex dimension of row axis
 * @returns {number}
 */
PivotTable.prototype.getRowAxisSpan = function(rowIndex, dimensionIndex) {
    return this.rowAxis.spanMap[dimensionIndex][Math.floor(rowIndex / this.rowAxis.span[dimensionIndex])];
};

/**
 * Gets normalized row index offset by hidden rows based on the current
 * state of the table.
 * 
 * @param {number} rowIndex 
 * @param {number} dimensionIndex 
 * @returns {number}
 */
PivotTable.prototype.normalizeRowIndexOffset = function(rowIndex, dimensionIndex) {
    
    if (this.doColSubTotals()) {
        return rowIndex - Math.floor(this.getRowIndexWithHidden(rowIndex) / (this.rowAxis.uniqueFactor + 1));
    }
    
    return rowIndex;
};

/**
 * Gets the distance from last row axis dimension unit based on the current
 * state of the table.
 * 
 * @param {number} rowIndex 
 * @param {number} dimensionIndex 
 * @returns {number}
 */
PivotTable.prototype.getDistanceFromLastRowDimensionUnitActual = function(rowIndex, dimensionIndex) {
    
    let normalized = this.normalizeRowIndex(this.getRowIndexWithHidden(rowIndex));
    
    return this.normalizeRowIndexOffset(rowIndex) -
        ((this.sumRowAxisSpanUpToIndex(normalized, dimensionIndex) -
        this.getRowAxisSpan(normalized, dimensionIndex)));
};

/**
 * Gets distance from last row axis dimension unit based on the current
 * state of the table.
 * 
 * @param {number} rowIndex 
 * @param {number} dimensionIndex 
 * @returns {number}
 */
PivotTable.prototype.getDistanceFromLastRowDimensionUnitOffset = function(rowIndex, dimensionIndex) {
    
    let normalized = this.normalizeRowIndex(this.getRowIndexWithHidden(rowIndex));
    
    return normalized % this.rowAxis.span[dimensionIndex];
};

/**
 * Gets distance to next row axis dimension unit based on the current
 * state of the table.
 * 
 * @param {number} rowIndex 
 * @param {number} dimensionIndex 
 * @returns {number}
 */
PivotTable.prototype.getDistanceToNextRowDimensionUnitActual = function(rowIndex, dimensionIndex) {
    
    let normalized = this.normalizeRowIndex(this.getRowIndexWithHidden(rowIndex));
    
    return this.getRowAxisSpan(normalized, dimensionIndex) - 
        (this.normalizeRowIndexOffset(rowIndex) -
        ((this.sumRowAxisSpanUpToIndex(normalized, dimensionIndex) -
        this.getRowAxisSpan(normalized, dimensionIndex))));
};

/**
 * Gets distance to next row axis dimension unit based on the current
 * state of the table.
 * 
 * @param {number} rowIndex 
 * @param {number} dimensionIndex 
 * @returns {number}
 */
PivotTable.prototype.getDistanceToNextRowDimensionUnitOffset = function(rowIndex, dimensionIndex) {
    
    let normalized = this.normalizeRowIndex(this.getRowIndexWithHidden(rowIndex));
    
    return this.rowAxis.span[dimensionIndex] - 
        (normalized % this.rowAxis.span[dimensionIndex]);
};

/**
 * Gets number of hidden rows above given row index up to start of current
 * dimension unit.
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
 * Gets number of hidden rows below given row index up to end of current
 * dimension unit.
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
 * Gets updated row dimension span based on given parameters.
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
 * Gets normalized row index offset by hidden columns.
 * 
 * @param {number} columnIndex 
 * @param {number} dimensionIndex 
 * @returns {number}
 */
PivotTable.prototype.normalizeColumnIndexOffset = function(columnIndex, dimensionIndex) {
   
    if (this.doRowSubTotals()) {
        return columnIndex - Math.floor(this.getTrueColumnIndex(columnIndex) / (this.colAxis.uniqueFactor + 1));
    }

    return columnIndex;
}
/**
 * Gets the distance from last column axis dimension unit based on the current
 * state of the table.
 * 
 * @param {number} columnIndex 
 * @param {number} dimensionIndex 
 * @returns {number}
 */
PivotTable.prototype.getDistanceFromLastColumnDimensionUnitActual = function(columnIndex, dimensionIndex) {
    let normalized = this.normalizeColumnIndex(this.getTrueColumnIndex(columnIndex));
    return this.normalizeColumnIndexOffset(columnIndex) -
        ((this.sumColumnAxisSpanUpToIndex(normalized, dimensionIndex) -
        this.getColumnAxisSpan(normalized, dimensionIndex)));
};

/**
 * Gets distance from last column axis dimension unit based on the current
 * state of the table.
 * 
 * @param {number} columnIndex 
 * @param {number} dimensionIndex 
 * @returns {number}
 */
PivotTable.prototype.getDistanceFromLastColumnDimensionUnitOffset = function(columnIndex, dimensionIndex) {
    let normalized = this.normalizeColumnIndex(this.getTrueColumnIndex(columnIndex));
    return normalized % this.colAxis.span[dimensionIndex];
};

/**
 * Gets the distance to next column axis dimension based on the current
 * state of the table.
 * 
 * @param {number} columnIndex 
 * @param {number} dimensionIndex 
 * @returns {number}
 */
PivotTable.prototype.getDistanceToNextColumnDimensionUnitActual = function(columnIndex, dimensionIndex) {
    let normalized = this.normalizeColumnIndex(this.getTrueColumnIndex(columnIndex));
    return this.getColumnAxisSpan(normalized, dimensionIndex) - 
        (this.normalizeColumnIndexOffset(columnIndex) -
        ((this.sumColumnAxisSpanUpToIndex(normalized, dimensionIndex) -
        this.getColumnAxisSpan(normalized, dimensionIndex))));
};

/**
 * Gets distance to next column axis dimension unit based on the current
 * state of the table.
 * 
 * @param {number} columnIndex 
 * @param {number} dimensionIndex 
 * @returns {number}
 */
PivotTable.prototype.getDistanceToNextColumnDimensionUnitOffset = function(columnIndex, dimensionIndex) {
    let normalized = this.normalizeColumnIndex(this.getTrueColumnIndex(columnIndex));
    return this.colAxis.span[dimensionIndex] - 
        (normalized % this.colAxis.span[dimensionIndex]);
};

/**
 * Gets number of hidden columns to the left of given column index up to start of 
 * current dimension unit.
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
 * Gets number of hidden columns to the right of given column index up to end of 
 * current dimension unit.
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
 * Gets updated column axis span based on given parameters.
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
 * Sums the column axis spans up to given column index.
 * 
 * @param {number} columnIndex 
 * @param {number} dimensionIndex 
 * @returns {number}
 */
PivotTable.prototype.sumColumnAxisSpanUpToIndex = function(columnIndex, dimensionIndex) {
    
    let sum = 0;
    
    for(let i = 0; i < Math.floor(columnIndex / this.colAxis.span[dimensionIndex]) + 1; i++) {
        sum += this.colAxis.spanMap[dimensionIndex][i];
    }
    
    return sum;
};

/**
 * Sums the row axis spans up to given row index.
 * 
 * @param {number} rowIndex 
 * @param {number} dimensionIndex 
 * @returns {number}
 */
PivotTable.prototype.sumRowAxisSpanUpToIndex = function(rowIndex, dimensionIndex) {
    
    let sum = 0;
    
    for(let i = 0; i < Math.floor(rowIndex / this.rowAxis.span[dimensionIndex]) + 1; i++) {
        sum += this.rowAxis.spanMap[dimensionIndex][i];
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
    return this.colAxis.spanMap[dimensionIndex][Math.floor(columnIndex / this.colAxis.span[dimensionIndex])];
};

/**
 * Calculates true total values.
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
 * Gets record names.
 * 
 * @returns {array}
 */
PivotTable.prototype.getRecordNames = function() {
    return this.filters.getRecordNames(false, this.response, true);
};

/**
 * Gets the row axis object at given column/row index.
 * 
 * @param {number} columnIndex column index of axis object
 * @param {number} rowIndex row index of axis object
 * @returns {object}
 */
PivotTable.prototype.getRowAxisObject = function(columnIndex, rowIndex) {
    return this.rowAxis.objects.all[columnIndex][rowIndex];
};

/**
 * Gets the column axis object at given column/row index.
 * 
 * @param {number} rowIndex row index of axis object
 * @param {number} columnIndex column index of axis object
 * @returns {object}
 */
PivotTable.prototype.getColumnAxisObject = function(rowIndex, columnIndex) {
    return this.colAxis.objects.all[rowIndex][columnIndex];
};

/**
 * Gets the total of the row at given row index.
 * 
 * @param {number} rowIndex index of row to find total
 * @returns {number}
 */
PivotTable.prototype.getRowTotal = function(rowIndex) {
    return this.rowTotalLookup[rowIndex];
};

/**
 * Gets the total of the column at given column index.
 * 
 * @param {number} columnIndex index of column to find total
 * @returns {number}
 */
PivotTable.prototype.getColumnTotal = function(columnIndex) {
    return this.columnTotalLookup[columnIndex];
};

/**
 * Gets the html value of a table cell.
 * 
 * @param {object} cell 
 * @returns {string}
 */
PivotTable.prototype.getHtmlValue = function(cell) {
    
    if (cell.collapsed) {
        return '';
    }
    
    return this.isTextField(cell.type) ? 
        this.getPrettyHtml(cell.displayValue) : cell.displayValue;
};

/**
 * gets pretty print of given string.
 * 
 * @param {string} displayValue 
 * @returns {string}
 */
PivotTable.prototype.getPrettyHtml = function(displayValue) {
    return this.optionConfig.prettyPrint(displayValue, this.digitGroupSeparator);
};

/**
 * Gets legend display strategy id.
 * 
 * @param {string} type 
 * @returns {number}
 */
PivotTable.prototype.getLegendDisplayStrategyId = function(type) {
    return this.optionConfig.getLegendDisplayStrategy(type).id;
};

/**
 * Gets legend display style id.
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
    
    if (!this.doRowTotals()) {
        return this.columnSize;
    }

    return this.columnSize - 1;
};

/**
 * Gets the next total row index.
 * 
 * @returns {number}
 */
PivotTable.prototype.getNextTotalRowIndex = function() {

    if (!this.doColTotals()) {
        return this.rowSize;
    }

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
 * @returns {number}
 */
PivotTable.prototype.getViewportWidthIndex = function() {
    return Math.floor(this.viewportWidth / this.options.cellWidth) + this.options.renderOffset;
};

/**
 * Gets the number of cells that can be rendered vertically within the viewport
 * with offset for additional cells.
 * @returns {number}
 */
PivotTable.prototype.getViewportHeightIndex = function() {
    return Math.floor(this.viewportHeight / this.options.cellHeight) + this.options.renderOffset;
};

/**
 * Gets the height of the entire table in number of cells
 * including total and sub total rows.
 * 
 * @returns {number}
 */
PivotTable.prototype.getRowAxisSize = function() {
    return this.rowSize + this.colAxis.dims - 1;
};

/**
 * Gets the width of the entire table in number of cells
 * including total and sub total columns.
 * 
 * @returns {number}
 */
PivotTable.prototype.getColumnAxisSize = function() {
    return this.columnSize + this.rowAxis.dims - 1;
};

/**
 * Gets the number of row axis dimensions.
 * 
 * @returns {number}
 */
PivotTable.prototype.getRowDimensionSize = function() {
    return this.rowAxis.dims || 0;
};

/**
 * Gets the number of column axis dimensions.
 * 
 * @returns {number}
 */
PivotTable.prototype.getColumnDimensionSize = function() {
    return this.colAxis.dims || 0;
};

/**
 * Gets the amount of padding needed to finish the unrendered 
 * top of the table. Padding is returned in number of pixels.
 * 
 * @returns {number}
 */
PivotTable.prototype.getTopPadding = function() {
    let padding = this.rowStart * this.options.cellHeight;

    if (!this.options.skipTitle && this.rowStart > 0) {
        padding += this.options.cellHeight;
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
    return this.columnStart * this.options.cellWidth;
};

/**
 * Gets the amount of padding needed to finish the unrendered 
 * right of the table. Padding is returned in number of pixels.
 * 
 * @returns {number}
 */
PivotTable.prototype.getBottomPadding = function() {
    return (this.rowSize - this.rowEnd - this.numberOfEmptyRows) * this.options.cellHeight;
};

/**
 * Gets the amount of padding needed to finish the unrendered 
 * bottom of the table. Padding is returned in number of pixels.
 * 
 * @returns {number}
 */
PivotTable.prototype.getRightPadding = function() {
    return (this.columnSize - this.columnEnd - this.numberOfEmptyColumns) * this.options.cellWidth;
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

    rowIndex = this.normalizeRowIndex(rowIndex);
    columnIndex = this.normalizeColumnIndex(columnIndex);
    
    const id = this.getRRIC(rowIndex, columnIndex).get();

    const value = this.getValue(id);
    const empty = value === null;

    return {
        empty,
        value: empty ? 0 : value,
        numerator: this.getNumeratorValue(id),
        denominator: this.getDenominatorValue(id),
        factor: this.getFactorValue(id),
    };
};

/**
 * Gets value id value map.
 * 
 * @param {string} id 
 * @returns {number}
 */
PivotTable.prototype.getValue = function(id) {

    const value = this.idValueMap[id];
    const n = parseFloat(value);

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

    columnIndex = this.normalizeColumnIndex(columnIndex);

    return columnIndex + Math.floor(columnIndex / this.colAxis.uniqueFactor) +
        (this.colAxis.uniqueFactor - (columnIndex % this.colAxis.uniqueFactor));
};

/**
 * Gets the next sub row index from given row index.
 * 
 * @param {number} rowIndex 
 * @returns {number}
 */
PivotTable.prototype.getNextSubRowIndex = function(rowIndex) {

    rowIndex = this.normalizeRowIndex(rowIndex);

    return rowIndex + Math.floor(rowIndex / (this.rowAxis.uniqueFactor)) +
        (this.rowAxis.uniqueFactor - (rowIndex % this.rowAxis.uniqueFactor));
};

/**
 * Gets uuids object map.
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
 * Gets the index of the last cell to be rendered in column.
 * 
 * @param {number} columnIndex 
 * @returns {number}
 */
PivotTable.prototype.getColumnEnd = function(columnIndex) {
    
    if (this.doClipping()) {
        return this.constrainWidth(this.getViewportWidthIndex() + columnIndex)
    }
    
    return this.getColumnAxisSize() - this.numberOfEmptyColumns;
};
    
/**
 * Gets the index of the last cell to be rendered in row.
 * 
 * @param {number}
 * @returns {number}
 */
PivotTable.prototype.getRowEnd = function(rowIndex) {
    
    if (this.doClipping()) {
        return this.constrainHeight(this.getViewportHeightIndex() + rowIndex);
    }
    
    return this.getRowAxisSize() - this.numberOfEmptyRows;
};

/**
 * Gets the row sort id
 * 
 * @param {number} rowIndex 
 * @returns {string}
 */
PivotTable.prototype.getRowSortId = function(rowIndex, columnIndex) {
    
    if (this.doSortableColumnHeaders() && rowIndex === this.colAxis.dims - 1) {
        return this.colAxis.ids[columnIndex];
    }
    
    return null;
};

/**
 * Gets the label for the column axis at given index.
 * 
 * @param {number} index 
 * @returns {string}
 */
PivotTable.prototype.getColumnAxisLabel = function(index) {
    
    if (this.colAxis.dims) {
        return this.response.getNameById(this.colAxis.dimensionNames[index]);
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
    
    if (this.rowAxis.dims) {
        return this.response.getNameById(this.rowAxis.dimensionNames[index]);    
    }
    
    return null;
};

/**
 * Gets the dimension label for the shared column/row.
 * 
 * @returns {string}
 */
PivotTable.prototype.getCrossAxisLabel = function() {
    let colAxisLabel = this.getColumnAxisLabel(this.colAxis.dims - 1),
        rowAxisLabel = this.getRowAxisLabel(this.rowAxis.dims - 1);

    if (!this.rowAxis.type) {
        return colAxisLabel;
    }

    if (!this.colAxis.type) {
        return rowAxisLabel;
    }

    if (colAxisLabel) {
        rowAxisLabel += `${NO_BREAK_SPACE}/${NO_BREAK_SPACE}` + colAxisLabel;
    }

    return rowAxisLabel;
};

/**
 * Gets the span for the top title bar.
 * 
 * @param {number} span 
 * @returns {number}
 */
PivotTable.prototype.getTopBarSpan = function(span) {
    let rowDims = this.rowAxis.dims || 0;

    if (!this.colAxis.type && this.rowAxis.type) {
        return rowDims + 1;
    }

    return span;
};

/**
 * Retrueves the ResponseRowIdCombination for given row and column index pair.
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
 * Gets associated uuids for given row and column index pair.
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
 * Gets percentage of value based on given row index.
 * 
 * @param {number} value 
 * @param {number} rowIndex 
 * @returns {number}
 */
PivotTable.prototype.getRowPercentage = function(value, rowIndex) {
    return getPercentageHtml(value, this.getRowTotal(rowIndex));
};
/**
 * Gets percentage of value based on given column index.
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
    
    for (let rowIndex = 0; rowIndex < column.length; rowIndex++) {
        this.table[rowIndex].push(column[rowIndex]);
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

    for (let rowIndex = 0; rowIndex < column.length; rowIndex++) {
        this.table[rowIndex].unshift(column[rowIndex]);
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
    this.table.unshift(this.buildRow(rowIndex, columnStart, columnEnd));
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
    for (let rowIndex = 0; rowIndex < this.table.length; rowIndex++) {
        this.table[rowIndex].shift();
    }
};

/**
 * Removes a column from the right side of the table.
 * 
 */
PivotTable.prototype.deleteRight = function() {
    for (let rowIndex = 0; rowIndex < this.table.length; rowIndex++) {
        this.table[rowIndex].pop();
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
    for (let rowIndex = 0; rowIndex < this.table.length; rowIndex++) {
        this.table[rowIndex].splice(columnIndex, 1);
    }
};

/**
 * Builds a table row based on given parameters.
 * 
 * @param {number} rowIndex 
 * @param {number} columnStart 
 * @param {number} columnEnd 
 * @returns {array}
 */
PivotTable.prototype.buildRow = function(rowIndex, columnStart, columnEnd) { 
    
    let rowAxisRow = [];

    if (this.isColumnDimensionRow(rowIndex)) {
        return this.buildColumnAxisRow(rowIndex, columnStart, columnEnd);
    }

    rowIndex -= this.colAxis.dims;

    if (this.isRowDimensionColumn(columnStart)) {
        rowAxisRow = this.buildRowAxisRow(rowIndex, columnStart);
    }

    columnStart = Math.max(columnStart - this.rowAxis.dims, 0);
    columnEnd -= this.rowAxis.dims;

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

    // Build column axis (will create corner axis if column index is over row axis).
    let columnAxis = this.buildColumnAxisColumn(columnIndex, rowStart);

    if (this.isRowDimensionColumn(columnIndex)) {
        let rowAxis = this.buildRowAxisColumn(columnIndex, rowStart, rowEnd);
        return columnAxis.concat(rowAxis);
    }
    
    return columnAxis.concat(this.buildValueColumn(columnIndex, rowStart, rowEnd));
};

/**
 * Builds value portion of table row based on given parameters.
 * 
 * @param {number} rowIndex 
 * @param {number} columnStart 
 * @param {number} columnEnd 
 * @returns {array}
 */
PivotTable.prototype.buildValueRow = function(rowIndex, columnStart, columnEnd) {
    const row = [];

    for (let columnIndex = columnStart; columnIndex <= columnEnd; columnIndex++) {
        row.push(this.buildValueCell(columnIndex, rowIndex));
    }

    return row;
};

/**
 * Builds value portion of table column based on given parameters.
 * 
 * @param {number} columnIndex 
 * @param {number} rowStart 
 * @param {number} rowEnd 
 * @returns {array}
 */
PivotTable.prototype.buildValueColumn = function(columnIndex, rowStart, rowEnd) {
    const column = [];

    // offset row dimension
    columnIndex = Math.max(columnIndex - this.rowAxis.dims, 0);

    rowStart = Math.max(rowStart - this.colAxis.dims, 0);
    rowEnd -= this.colAxis.dims;
    
    for (let rowIndex = rowStart; rowIndex <= rowEnd; rowIndex++) {
        column.push(this.buildValueCell(columnIndex, rowIndex));
    }

    return column;
};

/**
 * Builds value cell based on row and column index pair.
 * 
 * @param {number} columnIndex 
 * @param {number} rowIndex 
 * @returns {object}
 */
PivotTable.prototype.buildValueCell = function(columnIndex, rowIndex) {

    rowIndex = this.getRowIndexWithHidden(rowIndex);
    columnIndex = this.getTrueColumnIndex(columnIndex);

    let value = this.valueLookup[rowIndex][columnIndex];
    let displayValue = value;

    if (this.doColPercentage()) {
        displayValue = this.getColumnPercentage(value, columnIndex);  
    }
    
    if (this.doRowPercentage()) {
        displayValue = this.getRowPercentage(value, rowIndex);
    }

    if (this.isRowGrandTotal(rowIndex) || this.isColumnGrandTotal(columnIndex)) {
        return new TotalCell(value, displayValue);
    }

    if (this.isColumnSubTotal(columnIndex) || this.isRowSubTotal(rowIndex)) {
        return new SubTotalCell(value, displayValue);
    }

    if (value === null || typeof(value) === 'undefined') {
        return new PlainValueCell(value, displayValue);
    }

    rowIndex = this.normalizeRowIndex(rowIndex);
    columnIndex = this.normalizeColumnIndex(columnIndex);
    
    let cell = new ValueCell(value, displayValue);
    let rric = this.getRRIC(rowIndex, columnIndex);

    cell.dxId = rric.getIdByIds(this.response.metaData.dimensions.dx);
    cell.peId = rric.getIdByIds(this.response.metaData.dimensions.pe);
    cell.ouId = rric.getIdByIds(this.response.metaData.dimensions.ou);

    cell.uuids = this.getCellUuids(columnIndex, rowIndex);

    this.uuidDimUuidsMap[cell.uuid] = cell.uuids;

    return cell; 
};

/**
 * Builds row axis dimension based on given parameters.
 * 
 * @returns {array}
 */
PivotTable.prototype.buildRowAxis = function() {
    
    const axis = [];

    if (!this.rowAxis.type) {

        if (this.doShowDimensionLabels()) {
            axis[0] = [new DimensionEmptyCell({ style: 'visibility: hidden;' })];
        }

        return axis;
    }
    
    for (let rowIndex = this.rowStart; rowIndex <= this.rowEnd - this.colAxis.dims; rowIndex++) {
        axis.push(this.buildRowAxisRow(rowIndex, this.columnStart));
    }

    return axis;
};

/**
 * Builds row axis dimension row based on given parameters.
 * 
 * @param {number} rowIndex 
 * @param {number} columnStart 
 * @returns {array}
 */
PivotTable.prototype.buildRowAxisRow = function(rowIndex, columnStart) {
    
    if (this.rowAxis.dims < columnStart) {
        return [];
    }

    if (!this.rowAxis.type) {
        return [new DimensionEmptyCell({ style: 'visibility: hidden;' })];
    }

    const row = [];

    for (let columnIndex = columnStart; columnIndex < this.rowAxis.dims; columnIndex++) {
        row.push(this.buildRowAxisCell(columnIndex, rowIndex));
    }

    return row;
};

/**
 * Builds column axis dimension row based on given parameters.
 * 
 * @param {number} rowIndex 
 * @param {number} columnStart 
 * @param {number} columnEnd 
 * @returns {array}
 */
PivotTable.prototype.buildColumnAxisRow = function(rowIndex, columnStart, columnEnd) {
    
    const row = [];

    if (this.colAxis.dims < rowIndex) {
        return row;
    }

    if (this.isRowDimensionColumn(columnStart)) {
        Object.assign(row, this.buildCornerAxisRow(rowIndex, columnStart));
    }

    columnStart += row.length;

    columnStart -= this.rowAxis.dims;
    columnEnd   -= this.rowAxis.dims;

    for (let columnIndex = row.length; columnStart <= columnEnd; columnIndex++, columnStart++) {
        row[columnIndex] = this.buildColumnAxisCell(rowIndex, columnStart);
    }

    return row;
};

/**
 * Builds row axis dimension column based on given parameters.
 * 
 * @param {number} columnIndex 
 * @param {number} rowStart 
 * @param {number} rowEnd 
 * @returns {array}
 */
PivotTable.prototype.buildRowAxisColumn = function(columnIndex, rowStart, rowEnd) {
    
    const column = [];
    
    // if requested column at index is not visible return empty array
    if (this.rowAxis.dims < columnIndex) {
        return column;
    }

    // if there is no axis dimension fill with blank invisible cells
    if (!this.rowAxis.type) {
        
        for (let rowIndex = 0; rowIndex <= rowEnd - rowStart; rowIndex++) {
            column[rowIndex] = new DimensionEmptyCell({ style: 'visibility: hidden;' });
        }

        return column;
    }

    // offset column dimension
    rowStart = Math.max(rowStart - this.colAxis.dims, 0);
    rowEnd -= this.colAxis.dims;

    for (let rowIndex = rowStart; rowIndex <= rowEnd; rowIndex++) {
        column.push(this.buildRowAxisCell(columnIndex, rowIndex));
    }

    return column;
};

/**
 * Builds row axis cell based on row and column index pair.
 * 
 * @param {number} columnIndex 
 * @param {number} rowIndex 
 * @returns {object}
 */
PivotTable.prototype.buildRowAxisCell = function(columnIndex, rowIndex) {

    rowIndex = this.getRowIndexWithHidden(rowIndex);

    let config = {};
    let displayValue = NO_BREAK_SPACE;

    if (this.isRowSubTotal(rowIndex)) {

        config.colSpan = this.rowAxis.dims - columnIndex;
        config.hidden = columnIndex !== this.columnStart;

        return new DimensionSubTotalCell(displayValue, config);
    }

    if (this.isRowGrandTotal(rowIndex)) {

        config.colSpan = this.rowAxis.dims - columnIndex;

        if (columnIndex !== 0) {
            config.sort = TOTAL_SORT;
            config.generateUuid = true;
            config.hidden = true;
        }

        displayValue = columnIndex === 0 ? 'Total' : NO_BREAK_SPACE;
        
        return new DimensionGrandTotalCell(displayValue, config)
    }

    rowIndex = this.normalizeRowIndex(rowIndex);

    config = this.getRowAxisObject(columnIndex, rowIndex);
    config.showHierarchy = this.doShowHierarchy();

    displayValue = this.response.getItemName(config.id, config.showHierarchy, true)

    return new RowAxisCell(displayValue, config);
};

/**
 * Builds column axis cell based on row and column index pair
 * 
 * @param {number} rowIndex 
 * @param {number} columnIndex 
 * @returns {object}
 */
PivotTable.prototype.buildColumnAxisCell = function(rowIndex, columnIndex) {

    columnIndex = this.getTrueColumnIndex(columnIndex);

    let config = {};
    let displayValue = NO_BREAK_SPACE;

    if (this.isColumnSubTotal(columnIndex)) {
        
        config.hidden = rowIndex !== this.rowStart;
        config.rowSpan = this.colAxis.dims - rowIndex;
        
        return new DimensionSubTotalCell(displayValue, config);
    }
    
    if (this.isColumnGrandTotal(columnIndex)) {

        config.hidden = rowIndex !== this.rowStart;
        config.rowSpan = this.colAxis.dims - rowIndex;
        config.sort = rowIndex === this.rowStart && this.doSortableColumnHeaders() ? TOTAL_SORT : null;
        config.generateUuid = rowIndex !== 0;

        displayValue = rowIndex === 0 ? 'Total' : NO_BREAK_SPACE;

        return new DimensionGrandTotalCell(displayValue, config);
    }

    columnIndex = this.normalizeColumnIndex(columnIndex);

    config = this.getColumnAxisObject(rowIndex, columnIndex)

    config.showHierarchy = this.doShowHierarchy();
    config.sort = this.getRowSortId(rowIndex, columnIndex);

    displayValue = this.response.getItemName(config.id, config.showHierarchy, true);

    return new ColumnAxisCell(displayValue, config);
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

    for (let columnIndex = this.columnStart; columnIndex <= this.columnEnd; columnIndex++) {
        axis.push(this.buildColumnAxisColumn(columnIndex, this.rowStart));
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
    
    if (this.colAxis.dims < rowStart) {
        return [];
    }
    
    if (this.isRowDimensionColumn(columnIndex)) {
        return this.buildCornerAxisColumn(columnIndex, rowStart);
    }

    columnIndex -= this.rowAxis.dims;

    const column = [];

    for (let rowIndex = rowStart; rowIndex < this.colAxis.dims; rowIndex++) {
        column.push(this.buildColumnAxisCell(rowIndex, columnIndex));
    }

    return column;
};

/**
 * Builds corner axis dimension.
 * 
 * @returns {array}
 */
PivotTable.prototype.buildCornerAxis = function() {
    const cornerAxis = [];

    for (let rowIndex = 0; rowIndex < this.colAxis.dims; rowIndex++) {
        cornerAxis[rowIndex] = this.buildCornerAxisRow(rowIndex, 0);
    }

    return cornerAxis;
};

/**
 * Builds corner axis dimension column based on given parameters.
 * 
 * @param {number} columnIndex 
 * @param {number} rowStart 
 * @returns {array}
 */
PivotTable.prototype.buildCornerAxisColumn = function(columnIndex, rowStart) {
    
    const column = [];

    if (!this.doShowDimensionLabels()) {

        let colSpan = this.rowAxis.dims - columnIndex;
        let rowSpan = this.colAxis.dims - rowStart;

        let hidden = columnIndex !== this.columnStart;

        column.push(new DimensionEmptyCell({ colSpan, rowSpan, hidden }));

        for (let rowIndex = rowStart + 1; rowIndex < this.colAxis.dims; rowIndex++) {
            rowSpan = this.colAxis.dims - rowIndex;
            column.push(new DimensionEmptyCell({ colSpan, rowSpan, hidden: true }));
        }

        return column;
    }

    if (columnIndex === this.rowAxis.dims - 1) {

        for (let rowIndex = rowStart; rowIndex < this.colAxis.dims - 1; rowIndex++) {
            column.push(new DimensionLabelCell(this.getColumnAxisLabel(rowIndex)));
        }
        
        column.push(new DimensionLabelCell(this.getCrossAxisLabel()));

        return column;
    }

    for (let rowIndex = rowStart; rowIndex < this.colAxis.dims - 1; rowIndex++) {
        column.push(new DimensionLabelCell(NO_BREAK_SPACE));
    }

    column.push(new DimensionLabelCell(this.getRowAxisLabel(columnIndex)));

    return column;
};

/**
 * Builds corner axis dimension row based on given parameters.
 * 
 * @param {number} rowIndex 
 * @param {number} columnStart 
 * @returns {array}
 */
PivotTable.prototype.buildCornerAxisRow = function(rowIndex, columnStart) {
    
    const row = [];

    if (!this.doShowDimensionLabels()) {

        let colSpan = this.rowAxis.dims - columnStart;
        let rowSpan = this.colAxis.dims - rowIndex;

        let hidden = columnStart === this.columnStart;

        row.push(new DimensionEmptyCell({ colSpan, rowSpan, hidden }));

        for (let columnIndex=columnStart + 1; columnIndex < this.rowAxis.dims; columnIndex++) {
            colSpan = this.rowAxis.dims - columnIndex;
            row.push(new DimensionEmptyCell({ colSpan, rowSpan, hidden: true }));
        }

        return row;
    }

    if (rowIndex === this.colAxis.dims - 1 || this.colAxis.dims === 0) {
        
        for (let columnIndex = columnStart; columnIndex < this.rowAxis.dims - 1; columnIndex++) {
            row.push(new DimensionLabelCell(this.getRowAxisLabel(columnIndex)));
        }

        row.push(new DimensionLabelCell(this.getCrossAxisLabel()));

        return row;
    }

    for (let columnIndex = columnStart; columnIndex < this.rowAxis.dims - 1; columnIndex++) {
        row.push(new DimensionLabelCell(NO_BREAK_SPACE));
    }

    row.push(new DimensionLabelCell(this.getColumnAxisLabel(rowIndex)));

    return row;
};

/**
 * Update value of total object.
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

PivotTable.prototype.valueLookupInsert = function(value, rowIndex, columnIndex) {

    if (!this.valueLookup[rowIndex]) {
        this.valueLookup[rowIndex] = {};
    }

    this.valueLookup[rowIndex][columnIndex] = value 

    this.valueCounter += 1;
}


/**
 * Initializes lookup tables.
 * TODO: ugly function
 */
PivotTable.prototype.initializeLookups = function() {

    let tableRowSize = this.rowSize;
    let tableColumnSize = this.columnSize;

    if (this.doRowTotals()) {
        tableColumnSize -= 1;
    }

    if (this.doColTotals()) {
        tableRowSize -= 1;
    }

    const totalMap = {};

    for (let rowIndex = 0; rowIndex < tableRowSize; rowIndex += this.isSubRowIndex(rowIndex + 1) ? 2 : 1) {    
        for (let columnIndex = 0; columnIndex < tableColumnSize; columnIndex += this.isSubColumnIndex(columnIndex + 1) ? 2 : 1) {

            let valueObject = this.getValueObject(rowIndex, columnIndex);

            let nextRowTotalIndex = this.getNextTotalRowIndex();
            let nextColumnTotalIndex = this.getNextTotalColumnIndex();
            let nextRowSubTotalIndex = this.getNextSubRowIndex(rowIndex);
            let nextColumnSubTotalIndex = this.getNextSubColumnIndex(columnIndex);

            if (valueObject) {
                this.valueLookupInsert(valueObject.empty ? null : valueObject.value, rowIndex, columnIndex);
            }

            this.rowTotalLookup[rowIndex] += valueObject.value;
            this.columnTotalLookup[columnIndex] += valueObject.value;
            
            this.rowTotalLookup[nextRowTotalIndex] += valueObject.value;
            this.columnTotalLookup[nextColumnTotalIndex] += valueObject.value;

            // calculate sub totals
            if (this.doColSubTotals()) {
                this.rowTotalLookup[nextRowSubTotalIndex] += valueObject.value;
                this.updateValueTotal(nextRowSubTotalIndex, columnIndex, valueObject, totalMap);
            }

            if (this.doRowSubTotals()) {
                this.columnTotalLookup[nextColumnSubTotalIndex] += valueObject.value;
                this.updateValueTotal(rowIndex, nextColumnSubTotalIndex, valueObject, totalMap);
            } 

            // calculate totals
            if (this.doColTotals()) {
                this.updateValueTotal(nextRowTotalIndex, columnIndex, valueObject, totalMap);
            }

            if (this.doRowTotals()) {
                this.updateValueTotal(rowIndex, nextColumnTotalIndex, valueObject, totalMap);
            }
            
            // calculate intersection totals
            if (this.doRowTotals() && this.doColTotals()) {
                this.updateValueTotal(nextRowTotalIndex, nextColumnTotalIndex, valueObject, totalMap);
            }

            if (this.doColSubTotals() && this.doRowSubTotals()) {
                this.updateValueTotal(nextRowSubTotalIndex, nextColumnSubTotalIndex, valueObject, totalMap);
            } 

            if (this.doColTotals() && this.doRowSubTotals()) {
                this.updateValueTotal(nextRowTotalIndex, nextColumnSubTotalIndex, valueObject, totalMap);
            }

            if (this.doRowTotals() && this.doColSubTotals()) {
                this.updateValueTotal(nextRowSubTotalIndex, nextColumnTotalIndex, valueObject, totalMap);
            } 
        }
    }

    let rowTotalIndices = Object.keys(totalMap);

    for (let i = 0; i < rowTotalIndices.length; i++) {

        let columnTotalIndicies = Object.keys(totalMap[rowTotalIndices[i]]);
        
        for (let j = 0; j < columnTotalIndicies.length; j++) {

            let rowIndex = rowTotalIndices[i];
            let columnIndex = columnTotalIndicies[j];
            
            if (!this.valueLookup[rowIndex]) {
                this.valueLookup[rowIndex] = {};
            }

            if (totalMap[rowIndex][columnIndex].counter !== totalMap[rowIndex][columnIndex].empty) {

                let total = this.getTrueTotal(
                    totalMap[rowIndex][columnIndex].numerator,
                    totalMap[rowIndex][columnIndex].denominator || 1,
                    totalMap[rowIndex][columnIndex].factor / totalMap[rowIndex][columnIndex].counter);
                    
                this.valueLookupInsert(total, rowIndex, columnIndex);
            }
        }        
    }
};






/**
 * Creates a row axis render map.
 * 
 * @returns {object}
 */
PivotTable.prototype.createRowRenderMap = function() {
    
    const map = [];
    
    for (let rowIndex = 0; rowIndex < this.rowSize; rowIndex++) {
        
        if (!this.isRowEmpty(rowIndex) || !this.doHideEmptyRows()) {
            map.push(rowIndex);
            continue;
        }

        this.numberOfEmptyRows += 1;
        
        for (let columnIndex = 0; columnIndex < this.rowAxis.span.length; columnIndex++) {
            this.decremenetRowAxisSpan(this.normalizeRowIndex(rowIndex), columnIndex);
        }
    }

    return map;
};

/**
 * Creates a column axis render map.
 * 
 * @returns {object}
 */
PivotTable.prototype.createColumnRenderMap = function() {
    
    let map = [];

    for (let columnIndex = 0; columnIndex < this.columnSize; columnIndex++) {
        
        if (!this.isColumnEmpty(columnIndex) || !this.doHideEmptyColumns()) {
            map.push(columnIndex);
            continue;
        }

        this.numberOfEmptyColumns += 1;

        for (let rowIndex = 0; rowIndex < this.colAxis.span.length - 1; rowIndex++) {
            this.decrementColumnAxisSpan(this.normalizeColumnIndex(columnIndex), rowIndex);
        }
    }

    return map;
};








/**
 * Returns row index constrained against the height of the table.
 * 
 * @param {number} rowIndex 
 * @returns {number}
 */
PivotTable.prototype.constrainHeight = function(rowIndex) {
    return Math.min(this.getRowAxisSize() - this.numberOfEmptyRows, rowIndex);
};
/**
 * Returns column index constrained against the width of the table.
 * 
 * @param {number} columnIndex 
 * @returns {number}
 */
PivotTable.prototype.constrainWidth = function(columnIndex) {
    return Math.min(this.getColumnAxisSize() - this.numberOfEmptyColumns, columnIndex);
};
/**
 * Normalizes given row index based on previous sub column rows.
 * 
 * @param {number} rowIndex 
 * @returns {number}
 */
PivotTable.prototype.normalizeRowIndex = function(rowIndex) {
    
    if (this.doColSubTotals()) {
        rowIndex = Math.max(0, rowIndex - Math.floor(rowIndex / (this.rowAxis.uniqueFactor + 1)));
    }
    
    return rowIndex;
};
/**
 * Normalizes given column index based on previous sub row columns.
 * 
 * @param {number} columnIndex 
 * @returns {number}
 */
PivotTable.prototype.normalizeColumnIndex = function(columnIndex) {
    
    if (this.doRowSubTotals()) {
        return Math.max(0, columnIndex - Math.floor(columnIndex / (this.colAxis.uniqueFactor + 1)));    
    }
    
    return columnIndex;
};

/**
 * Builds table filter.
 * 
 * @param {number} span 
 * @returns {array}
 */
PivotTable.prototype.buildTableFilter = function(span) {
    
    if (!this.filters) {
        return [];
    }

    return [
        [this.buildHtmlCell(new FilterCell(this.getRecordNames(), this.getTopBarSpan(span)))]
    ];
};

/**
 * Builds table title.
 * 
 * @param {number} span 
 * @returns 
 */
PivotTable.prototype.buildTableTitle = function(span) {
    
    if (!this.title) {
        return [];
    }

    return [
        [this.buildHtmlCell(new FilterCell(this.title, this.getTopBarSpan(span)))]
    ];
};

/**
 * Gets legends.
 * 
 * @param {string} dxId 
 * @returns
 */
PivotTable.prototype.getLegends = function(dxId) {
    return this.appManager.getLegendSetById(this.getLegendSetId(dxId)).legends;
};

/**
 * Gets legend set.
 * 
 * @param {string} dxId 
 * @returns 
 */
PivotTable.prototype.getLegendSet = function(dxId) {
    
    if (!dxId) {
        return null;
    }

    return this.response.metaData.items[dxId].legendSet
};

/**
 * Converts table cell to html string
 * 
 * @param {object} config 
 * @returns {string}
 */
PivotTable.prototype.buildHtmlCell = function(cell) {

    // validation
    if (!isObject(cell) || cell.hidden || cell.collapsed) {
        return '';
    }

    if (isString(cell.sort)) {
        this.sortableIdObjects.push({     
            id: cell.sort,
            uuid: cell.uuid,
        });
    }

    if (cell.type === VALUE_CELL) {
        this.valueUuids.push(cell.uuid);
    }

    if (cell.type === DIMENSION_CELL) {
        this.dimensionUuids.push(cell.uuid);
    }

    let style = this.getBaseCellStyling(cell);

    if (cell.isValue) {

        if (!this.options.unclickable) {
            cell.cls += ' pointer';
        }

        let legends;
        let bgColor;

        if (this.doLegendDisplayByDataItem() && this.getLegendSet(cell.dxId)) {
            legends = this.getLegends(cell.dxId);
        } else {
            legends = this.legendSet ? this.legendSet.legends || [] : [];
        }

        for (let i = 0; i < legends.length; i++) {
            if (numberConstrain(cell.value, legends[i].startValue, legends[i].endValue) === cell.value) {
                bgColor = legends[i].color;
            }
        }

        if (this.doLegendDisplayStyleFill() && bgColor) {
            style += `
                background-color:${bgColor};
                color:${isColorBright(bgColor) ? BLACK_COLOR : WHITE_COLOR};
            `;
        }

        if (this.doLegendDisplayStyleText() && bgColor) {
            style += `color:${bgColor};`;
        }
    }

    style += cell.style ? cell.style : '';

    return `
        <td data-ou-id="${cell.ouId || ''}"
            data-period-id="${cell.peId || ''}"
            class="${cell.cls}"
            id="${cell.uuid || ''}"
            title="${cell.title || ''}"
            style="${style}"
            colspan="${cell.colSpan || ''}"
            rowSpan="${cell.rowSpan || ''}"
        >
            ${this.getHtmlValue(cell)}
        </td>
    `;
};

/**
 * Converts array of table cells to array of html strings
 * 
 * @param {array} rows 
 * @returns {array}
 */
PivotTable.prototype.buildHtmlRows = function(rows) {
    return rows.map(row => this.buildHtmlRow(row));
};

/**
 * Converts array of table cells to array of html strings
 * 
 * @param {array} row 
 * @returns {array}
 */
PivotTable.prototype.buildHtmlRow = function(row) {
    return row.map(cell => this.buildHtmlCell(cell));
};

/**
 * Converts array of table cells to html strings
 * 
 * @param {any} htmlArray 
 * @returns {array}
 */
PivotTable.prototype.buildHtmlTableRows = function(htmlArray) {
    return htmlArray.reduce((rows, row) => 
        rows + this.buildHtmlTableRow(row.join('')), '');
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
    const padding = this.getTopPadding();
    const cell = new TopPaddingCell(padding);

    return this.buildHtmlCell(cell);
};

/**
 * Builds bottom padding cell
 * 
 * @returns {string}
 */
PivotTable.prototype.buildBottomPaddingHtmlCell = function() {
    const padding = this.getBottomPadding();
    const cell = new BottomPaddingCell(padding);

    return this.buildHtmlCell(cell);
};

/**
 * Builds left padding cell
 * 
 * @returns {string}
 */
PivotTable.prototype.buildLeftPaddingHtmlCell = function() {
    const padding = this.getLeftPadding();
    const cell = new LeftPaddingCell(padding);

    return this.buildHtmlCell(cell);
};

/**
 * Builds right padding cell
 * 
 * @returns {string}
 */
PivotTable.prototype.buildRightPaddingHtmlCell = function() {
    const padding = this.getRightPadding();
    const cell = new RightPaddingCell(padding);

    return this.buildHtmlCell(cell);
};

/**
 * Buidlds html table body
 * 
 * @param {array} htmlArray 
 * @returns {string}
 */
PivotTable.prototype.buildHtmlTableBody = function(htmlArray) {
    return `
        <tbody>
            ${this.doClipping() ? this.buildTopPaddingHtmlRow() : ''}
            ${this.buildHtmlTableRows(htmlArray)}
            ${this.doClipping() ? this.buildBottomPaddingHtmlRow() : ''}
        </tbody>
    `;
};

PivotTable.prototype.buildHtmlTableRow = function(htmlRow) {
    return htmlRow ? `
        <tr> 
            ${this.doClipping() ? this.buildLeftPaddingHtmlCell() : ''}
            ${htmlRow}
            ${this.doClipping() ? this.buildRightPaddingHtmlCell() : ''}
        </tr>
    ` : '';  
};

/**
 * Build html table
 * 
 * @param {array} htmlArray 
 * @returns {string}
 */
PivotTable.prototype.buildHtmlTable = function() {
    let cls = 'pivot user-select';
    let style = `display:flex!important; overflow:visible;`;

    cls += this.displayDensity ? ' displaydensity-' + this.displayDensity : '';
    cls += this.fontSize       ? ' fontsize-' + this.fontSize : '';

    const htmlArray = arrayClean([].concat(
        this.options.skipTitle || this.rowStart > 0 ? [] : this.buildTableTitle(this.table[0].length),
        this.buildTableFilter(this.table[0].length),
        this.buildHtmlRows(this.table)
    ));

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

    const rowAxis = this.buildRowAxis();
    const colAxis = this.buildColumnAxis();

    const values = this.buildValueTable();

    for (let rowIndex = 0; rowIndex < rowAxis.length; rowIndex++) {
        rowAxis[rowIndex].push(...values[rowIndex]);
    }

    this.table = toRow(colAxis).concat(rowAxis);
};

/**
 * Renders table in form of html string.
 * 
 * @returns {string}
 */
PivotTable.prototype.render = function() {

    this.valueUuids = [];
    this.dimensionUuids = [];
    this.sortableIdObjects = [];

    if (this.doHideEmptyRows() && isEmpty(this.rowAxisLookup) &&
        this.doHideEmptyColumns() && isEmpty(this.columnAxisLookup)) {
        return "There is no data to display, and empty rows and columns are hidden.";
    }

    if (this.doHideEmptyRows() && isEmpty(this.rowAxisLookup)) {
        return "There is no data to display, and empty rows are hidden.";
    }

    if (this.doHideEmptyColumns() && isEmpty(this.columnAxisLookup)) {
        return "There is no data to display, and empty columns are hidden.";
    }

    this.updateDimensionSpan();

    return this.buildHtmlTable();
};

PivotTable.prototype.renderCard = function() {

    let value = this.getSingleValue();

    let card = `
        <span style="display:block;font-size:8em;">
            ${value ? value : 'Empty'}
        </span>
    `;

    let title = `
        <span style="display:block;fontcolor:#555;font-size:18px;">
            ${this.title ? this.title : ''}
        </span>
    `;

    let subtitle = `
        <span style="display:block;fontcolor:#555;font-size:14px;">
            ${this.getSubtitle()}
        </span>
    `;

    return `
        <div style="width=100%;height:100%;display:flex;flex-direction:column;justify-content:center;align-items:center;">
            ${card} <br />
            ${title}
            ${subtitle}
        </div>
    `;
}


/**
 * Updates the table given a new column start and row start.
 * 
 * @param {number} columnStart 
 * @param {number} rowStart 
 * @returns {string}
 */
PivotTable.prototype.update = function(columnStart, rowStart) {

    // decrease rowStart by one if top title is present
    if (rowStart > 0 && !this.options.skipTitle) {
        rowStart -= 1;
    }

    const columnEnd = this.getColumnEnd(columnStart);
    const rowEnd = this.getRowEnd(rowStart);

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
    this.rowAxis.spanMap[dimensionIndex][Math.floor(rowIndex / this.rowAxis.span[dimensionIndex])] -= 1;
};

/**
 * Decreses the column span by 1 of the associated dimension at 
 * given column index.
 * 
 * @param {number} columnIndex index of column dimension
 * @param {number} dimensionIndex dimension id
 */
PivotTable.prototype.decrementColumnAxisSpan = function(columnIndex, dimensionIndex) {
    this.colAxis.spanMap[dimensionIndex][Math.floor(columnIndex / this.colAxis.span[dimensionIndex])] -= 1;
};

/**
 * Builds value table based on given parameters
 * 
 * @param {number} rowStart 
 * @param {number} rowEnd 
 * @param {number} columnStart 
 * @param {number} columnEnd 
 * @returns {array}
 */
PivotTable.prototype.buildValueTable = function() {

    const rowEnd = this.rowEnd - this.getNumberOfVisibleColumnDimensions();
    const columnEnd = this.columnEnd - this.getNumberOfVisibleRowDimensions();

    let rowSize = rowEnd - this.rowStart;
    let colSize = columnEnd - this.columnStart;

    let table = [];

    if (this.doClipping()) {
        rowSize = Math.min(rowSize, this.rowSize);
        colSize = Math.min(colSize, this.columnSize);
    }

    for (let i = 0, rowIndex = this.rowStart; i <= rowSize; i++, rowIndex++) {
        
        table.push([]);
        
        for (let j = 0, columnIndex = this.columnStart; j <= colSize; j++, columnIndex++) {
            
            if (this.doSortableColumnHeaders()) {
                
                let totalIdComb = new ResponseRowIdCombination(this.refs, [TOTAL_SORT, this.rowAxis.ids[rowIndex]]);
                
                this.idValueMap[totalIdComb.get()] = this.isRowEmpty(rowIndex) ? 
                    null : this.getRowTotal(rowIndex);
            }

            table[i].push(this.buildValueCell(columnIndex, rowIndex));
        }
    }

    return table;
};

/**
 * Updates row axis dimension spans based on current render area.
 * 
 */
PivotTable.prototype.updateRowAxisDimensionSpan = function() {
    
    if (!this.rowAxis.type) {
        return;
    }

    // the max span allowed for all columns combined
    const rowSpanLimit = this.getRowRenderLimit(); 

    // number of visible row dimensions
    const visibleRowDimensions = this.getNumberOfVisibleRowDimensions();

    // number of visible column dimensions
    const visibleColumnDimensions = this.getNumberOfVisibleColumnDimensions();

    for (let i=0, columnIndex=this.columnStart; i < visibleRowDimensions; i++, columnIndex++) {

        let lastId = null;
        let rowSpanCounter = 0;

        for (let j=visibleColumnDimensions, rowIndex=this.getRowValueOffset(); j < this.table.length; j++, rowIndex++) {      

            let cell = this.table[j][i];

            if (!this.isCellValid(cell) || this.isRowHidden(rowIndex)) {
                continue;
            }

            if (this.isCellDimensionTotal(cell)) {
                rowSpanCounter += 1;
                cell.hidden = i !== 0;
                continue;
            }

            // hide all but the first cell which share the same id
            if (cell.hidden = lastId === cell.oldestSibling.uuid) {
                lastId = cell.oldestSibling.uuid;
                continue;
            }

            cell.rowSpan = this.getUpdatedRowSpan(rowIndex, columnIndex);
            
            // limit row span to height of table
            if (cell.rowSpan + rowSpanCounter > rowSpanLimit) {
                cell.rowSpan = rowSpanLimit - rowSpanCounter;
            }

            lastId = cell.oldestSibling.uuid;
            rowSpanCounter += cell.rowSpan;
        }
    }
};

/**
 * Updates column axis dimension span based on current render area.
 * 
 */
PivotTable.prototype.updateColumnAxisDimensionSpan = function() {
    
    if (!this.colAxis.type) {
        return;  
    }

    // the max span allowed for all columns combined
    const colSpanLimit = this.getColumnRenderLimit();
    
    // number of visible column dimensions
    const visibleColumnDimensions = this.getNumberOfVisibleColumnDimensions();

    // number of visible row dimensions
    const visibleRowDimensions = this.getNumberOfVisibleRowDimensions();

    for (let i = 0, rowIndex = this.rowStart; i < visibleColumnDimensions ; i++, rowIndex++) {

        // counts the collective span of the entire column
        let colSpanCounter = 0;

        let lastId = null;

        for (let j=visibleRowDimensions, columnIndex=this.getColumnValueOffset(); j < this.table[i].length; j++, columnIndex++) {      

            let cell = this.table[i][j];

            // check cell validity and if its hidden
            if (!this.isCellValid(cell) || this.isColumnHidden(columnIndex)) {
                continue;
            }

            // if a (sub)total cell, top most cell will span entier dimension
            if (this.isCellDimensionTotal(cell)) {
                colSpanCounter += 1;
                cell.hidden = i !== 0;
                continue;
            }

            // hide all but the first cell which share the same id
            if (cell.hidden = lastId === cell.oldestSibling.uuid) {
                lastId = cell.oldestSibling.uuid;
                continue;
            }

            // get colSpan based cell location
            cell.colSpan = this.getUpdatedColumnSpan(columnIndex, rowIndex);

            // limit col span to width of table
            if (cell.colSpan + colSpanCounter > colSpanLimit) {
                cell.colSpan = colSpanLimit - colSpanCounter;
            }

            lastId = cell.oldestSibling.uuid;
            colSpanCounter += cell.colSpan;
        }
    }
};

/**
 * Updates corner axis dimension span based on current render area.
 * 
 */
PivotTable.prototype.updateCornerAxisDimensionSpan = function() {

    // number of visible column dimensions
    const visibleColumnDimensions = this.getNumberOfVisibleColumnDimensions();
    
    // number of visible row dimensions
    const visibleRowDimensions = this.getNumberOfVisibleRowDimensions();

    for (let rowIndex = 0; rowIndex < visibleRowDimensions; rowIndex++) {
        for (let columnIndex = 0; columnIndex < visibleColumnDimensions; columnIndex++) {

            // get cell from table
            let cell = this.table[columnIndex][rowIndex];

            // check that cell is valid
            if (!this.isCellValid(cell)) {
                continue;
            }

            // labeled cells will always be visible as they have a row/col span of 1
            if (cell.type === LABELED_CELL) {
                cell.hidden = false;
            }

            // all empty cells will be hidden except for the upper left which spans the entire corner
            if (cell.type === EMPTY_CELL) {
                cell.hidden = !(rowIndex === 0 && columnIndex === 0);
            }
        }
    }
};

/**
 * Utility function for updating dimension span.
 * 
 */
PivotTable.prototype.updateDimensionSpan = function() {
    this.updateCornerAxisDimensionSpan();
    this.updateColumnAxisDimensionSpan();
    this.updateRowAxisDimensionSpan();
};

/**
 * Returns some table info in form of string.
 * 
 * @returns {string}
 */
PivotTable.prototype.info = function() {
    return {
        "rows:": Object.keys(this.valueLookup).length,
        "columns:": Object.keys(this.valueLookup[0]).length,
        "cells": Object.keys(this.valueLookup).length * Object.keys(this.valueLookup[0]).length,
    };
};

/**
 * Prints info
 * 
 * @returns {string}
 */
PivotTable.prototype.printInfo = function() {
    console.log(this.info());
};