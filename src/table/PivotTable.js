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
         getUniqueFactor } from './PivotTableUtils';

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

export const PivotTable = function(refs, layout, response, colAxis, rowAxis, options={}) {

    this.options = {
        renderLimit: 50000,
        dynamic: true,
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
        numberType: !!layout.numberType,
        ...options,
    }

    this.cellHeight = 25;
    this.cellWidth = 120;

    this.title = layout.title;
    this.digitGroupSeparator = layout.digitGroupSeparator;

    this.fontSize = layout.fontSize;
    this.displayDensity = layout.displayDensity;

    this.filters = layout.filters
    this.response = response;
    this.appManager = refs.appManager;
    this.optionConfig = refs.optionConfig

    this.visibleEmptyColumns = 0;
    this.visibleEmptyRows = 0;

    this.colAxis = colAxis;
    this.rowAxis = rowAxis;

    this.columnDimensionSize = colAxis.dims || 0;
    this.rowDimensionSize = rowAxis.dims || 1;

    this.legendSet = isObject(layout.legendSet) 
        ? this.appManager.getLegendSetById(layout.legendSet.id) : null;
        
    this.legendDisplayStyle = layout.legendDisplayStyle;
    this.legendDisplayStrategy = layout.legendDisplayStrategy;

    this.idValueMap = response.getIdMap(layout, 'value', 'idValueMap');

    this.uuidDimUuidsMap = {};    
    this.sortableIdObjects = [];

    this.colUniqueFactor = getUniqueFactor(colAxis);
    this.rowUniqueFactor = getUniqueFactor(rowAxis);

    this.columnDimensionNames = colAxis.type
        ? layout.columns.getDimensionNames(response) : [];
    this.rowDimensionNames = rowAxis.type
        ? layout.rows.getDimensionNames(response) : [];

    this.rowSize = this.getRowSize();
    this.columnSize = this.getColumnSize();

    this.valueLookup = this.createValueLookup();
    this.typeLookup  = this.createTypeLookup();
}

// setters
PivotTable.prototype.setCellWidth = function(width) {
    this.cellWidth = width;
};

PivotTable.prototype.setCellHeight = function(height) {
    this.cellHeight = height;
};

PivotTable.prototype.setViewportWidth = function(width) {
    this.viewportWidth = width;
};

PivotTable.prototype.setViewportHeight = function(height) {
    this.viewportHeight = height;
};

PivotTable.prototype.setColumnStart = function(index) {
    this.columnStart = Math.max(0, index);
};

PivotTable.prototype.setRowStart = function(index) {
    this.rowStart = Math.max(0, index);
};

PivotTable.prototype.setColumnEnd = function(index) {
    this.columnEnd = this.constrainWidth(
        Math.min(this.columnSize + rowAxis.dims - 1, index));
};

PivotTable.prototype.setRowEnd = function(index) {
    this.rowEnd = this.constrainHeight(
        Math.min(this.rowSize + this.columnDimensionSize - 1, index));
};

PivotTable.prototype.setColumnStartAndEnd = function(index) {
    this.setColumnStart(index);
    this.columnEnd = this.getColumnEnd(index);
};

PivotTable.prototype.setRowStartAndEnd = function(index) {
    this.setRowStart(index);
    this.rowEnd = this.getRowEnd(index);
};

PivotTable.prototype.setViewportSize = function(width=0, height=0) {
    this.setViewportWidth(width);
    this.setViewportHeight(height);
    this.build();
};

// options
PivotTable.prototype.doColTotals = function() {
    return this.options.showColTotals;
};

PivotTable.prototype.doRowTotals = function() {
    return this.options.showRowTotals;
};

PivotTable.prototype.doColSubTotals = function() {
    return this.options.showColSubTotals &&
        this.rowAxis.type && this.rowDimensionSize > 1;
};

PivotTable.prototype.doRowSubTotals = function() {
    return this.options.showRowSubTotals &&
        this.colAxis.type && this.columnDimensionSize > 1;
};

PivotTable.prototype.doColPercentage = function() {
    return this.options.numberType === this.optionConfig.getNumberType().percentofcolumn.id;
};

PivotTable.prototype.doRowPercentage = function() {
    return this.options.numberType === this.optionConfig.getNumberType().percentofrow.id;
};

PivotTable.prototype.doSortableColumnHeaders = function() {
    return this.rowAxis.type && this.rowDimensionSize === 1;
};

PivotTable.prototype.doHideEmptyRows = function() {
    return this.options.hideEmptyRows &&
        this.colAxis.type && this.rowAxis.type;
};

PivotTable.prototype.doHideEmptyColumns = function() {
    return this.options.hideEmptyColumns &&
        this.colAxis.type && this.rowAxis.type;
};

PivotTable.prototype.doShowDimensionLabels = function() {
    return this.options.showDimensionLabels
};

PivotTable.prototype.doTableClipping = function() {
    return this.options.dynamic;
};

PivotTable.prototype.doStickyColumns = function() {
    return this.options.stickyColumnDimension;
};

PivotTable.prototype.doStickyRows = function() {
    return this.options.stickyRowDimension;
};

PivotTable.prototype.doShowHierarchy = function() {
    return !!this.options.showHierarchy;
};

PivotTable.prototype.doLegendDisplayByDataItem = function() {
    return this.legendDisplayStrategy === this.getLegendDisplayStrategyId('by_data_item');
};

PivotTable.prototype.doLegendDisplay = function() {
    return this.legendDisplayStrategy !== this.getLegendDisplayStrategyId('fixed');
};

PivotTable.prototype.doLegendDisplayStyleFill = function() {
    return this.legendDisplayStyle === this.getLegendDisplayStyleId('fill');
};

PivotTable.prototype.doLegendDisplayStyleText = function() {
    return this.legendDisplayStyle === this.getLegendDisplayStyleId('text');
};

// checkers
PivotTable.prototype.isColumnSubTotal = function(columnIndex) {
    return this.doRowSubTotals() && (columnIndex + 1) % (this.colUniqueFactor + 1) === 0;
};

PivotTable.prototype.isColumnGrandTotal = function(columnIndex) {
    return this.doRowTotals() && columnIndex === this.getColumnSize() - 1;
};

PivotTable.prototype.isRowSubTotal = function(rowIndex) {
    return this.doColSubTotals() && (rowIndex + 1) % (this.rowUniqueFactor + 1) === 0;
};

PivotTable.prototype.isRowGrandTotal = function(rowIndex) {
    return this.doColTotals() && rowIndex === this.rowSize - 1;
};

PivotTable.prototype.isRowEmpty = function(rowIndex) {
    return this.valueLookup[rowIndex][this.columnSize - 1] <= 0;
};

PivotTable.prototype.isColumnEmpty = function(columnIndex) {
    return this.valueLookup[this.rowSize - 1][columnIndex] <= 0;
};

PivotTable.prototype.isTextField = function(type) {
    return !arrayContains(['dimension', 'filter'], type);
};

// getters

PivotTable.prototype.getRecordNames = function() {
    return this.filters.getRecordNames(false, this.response, true);
};

PivotTable.prototype.getRowAxisObject = function(columnIndex, rowIndex) {
    return this.rowAxis.objects.all[columnIndex][rowIndex];
};

PivotTable.prototype.getColumnAxisObject = function(rowIndex, columnIndex) {
    return this.colAxis.objects.all[rowIndex][columnIndex];
};

PivotTable.prototype.getRowTotal = function(rowIndex) {
    return this.valueLookup[rowIndex][this.columnSize - 1];
};

PivotTable.prototype.getHtmlValue = function(cell) {
    if (cell.collapsed) {
        return '';
    }
    
    return this.isTextField(cell.type) ? this.getPrettyHtml(cell.htmlValue) : cell.htmlValue;
};

PivotTable.prototype.getPrettyHtml = function(htmlValue) {
    return this.optionConfig.prettyPrint(htmlValue, this.digitGroupSeparator);
};

PivotTable.prototype.getLegendDisplayStrategyId = function(type) {
    return this.optionConfig.getLegendDisplayStyle('fill').id;
};

PivotTable.prototype.getLegendDisplayStyleId = function(type) {
    return this.optionConfig.getLegendDisplayStrategy(type).id;
};

PivotTable.prototype.getNextTotalColumnIndex = function() {
    return this.columnSize - 1;
};

PivotTable.prototype.getNextTotalRowIndex = function() {
    return this.rowSize - 1;
};

PivotTable.prototype.getVisibleColumnDimensions = function() {
    return Math.max(0, this.columnDimensionSize - this.rowStart);
};

PivotTable.prototype.getVisibleRowDimensions = function() {
    return Math.max(0, this.rowDimensionSize - this.columnStart);
};

PivotTable.prototype.getViewportWidth = function() {
    return this.viewportWidth;
};

PivotTable.prototype.getViewportHeight = function() {
    return this.viewportHeight;
};

PivotTable.prototype.getViewportWidthIndex = function(offset=1) {
    return Math.floor(this.viewportWidth / this.cellWidth) + offset;
};

PivotTable.prototype.getViewportHeightIndex = function(offset=1) {
    return Math.floor(this.viewportHeight / this.cellHeight) + offset;
};

PivotTable.prototype.getRowAxisSize = function() {
    return this.rowSize + this.columnDimensionSize - 1;
};

PivotTable.prototype.getColumnAxisSize = function() {
    return this.columnSize + this.rowDimensionSize - 1;
};

PivotTable.prototype.getRowDimensionSize = function() {
    return this.rowDimensionSize || 0;
};

PivotTable.prototype.getColumnDimensionSize = function() {
    return this.columnDimensionSize || 0;
};

PivotTable.prototype.getTopPadding = function() {
    let padding = this.rowStart * this.cellHeight;

    if (!this.options.skipTitle && this.rowStart > 0) {
        padding += this.cellHeight;
    }

    return padding;
};

PivotTable.prototype.getLeftPadding = function() {
    return this.columnStart * this.cellWidth;
};

PivotTable.prototype.getBottomPadding = function() {
    return (this.rowSize - this.rowEnd) * this.cellHeight;
};

PivotTable.prototype.getRightPadding = function() {
    return (this.columnSize - this.columnEnd) * this.cellWidth;
};

PivotTable.prototype.getLegendSetId = function(dxId) {
    return this.response.metaData.items[dxId].legendSet;
};

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

PivotTable.prototype.getValueCell = function(columnIndex, rowIndex) {
    let value = this.valueLookup[rowIndex][columnIndex];
    switch(this.typeLookup[rowIndex][columnIndex]) {
        case 0: return PlainValueCell(value);
        case 1: return ValueSubTotalCell(value);
        case 2: return ValueTotalCell(value);
        default: return null;
    }
};

PivotTable.prototype.getNextSubColumnIndex = function(columnIndex) {
    return columnIndex + Math.floor(columnIndex / this.colUniqueFactor) +
        (this.colUniqueFactor - (columnIndex % this.colUniqueFactor));
};

PivotTable.prototype.getNextSubRowIndex = function(rowIndex) {
    return rowIndex + Math.floor(rowIndex / (this.rowUniqueFactor)) +
        (this.rowUniqueFactor - (rowIndex % this.rowUniqueFactor));
};

PivotTable.prototype.getUuidObjectMap = function() {
    return objectApplyIf(
        (this.colAxis ? this.colAxis.uuidObjectMap || {} : {}),
        (this.rowAxis ? this.rowAxis.uuidObjectMap || {} : {})
    );
};

PivotTable.prototype.getAdjustedColSpan = function(cell, y) {
    if (cell.children) {
        return cell.oldestSibling.children * 
            this.colAxis.span[y + 1] - cell.siblingPosition;
    }

    return cell.colSpan;;
};

PivotTable.prototype.getAdjustedRowSpan = function(cell, x) {
    if (cell.children) {
        return cell.oldestSibling.children * 
            this.rowAxis.span[x + 1] - cell.siblingPosition;
    }

    return cell.rowSpan;;
};

PivotTable.prototype.getColumnEnd = function(index) {
    return this.doTableClipping() ? 
        this.constrainWidth(this.getViewportWidthIndex() + (index ? index : this.columnStart)) :
        this.getColumnAxisSize();
};
    
PivotTable.prototype.getRowEnd = function(index) {
    return this.doTableClipping() ?
        this.constrainHeight(this.getViewportHeightIndex() + (index ? index : this.rowStart)) :
        this.getRowAxisSize();
};

PivotTable.prototype.getRowSortId = function(index) {
    if (this.doSortableColumnHeaders() && index === this.columnDimensionSize - 1 ) {
        return this.colAxis.ids[index];
    }
    return null;
};

PivotTable.prototype.getColumnAxisLabel = function(index) {
    if (this.columnDimensionSize) {
        return this.response.getNameById(this.columnDimensionNames[index]);
    }
    return null;
};

PivotTable.prototype.getRowAxisLabel = function(index) {
    if (this.rowDimensionSize) {
        return this.response.getNameById(this.rowDimensionNames[index]);    
    }
    return null;
};

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
    if (!this.doShowDimensionLabels()) {
        let rowDims = this.rowDimensionSize || 0;

        if (!this.colAxis.type && this.rowAxis.type) {
            return rowDims + 1;
        }
        if (this.colAxis.type && this.rowAxis.type) {
            return span + (rowDims > 1 ? rowDims - 1 : rowDims);
        }
    }

    return span;
};

PivotTable.prototype.getVisibleEmptyRows = function(rowStart, rowEnd) {
    let counter = 0;
    for (let y = rowStart; y < rowEnd; y++) {
        counter += this.isRowEmpty(y) ? 1 : 0;
    }
    return counter;
}

PivotTable.prototype.getVisibleEmptyColumns = function(columnStart, columnEnd) {
    let counter = 0;
    for (let y = columnStart; y < columnEnd; y++) {
        counter += this.isColumnEmpty(y) ? 1 : 0;
    }
    return counter;
}

PivotTable.prototype.getValue = function(rowIndex, columnIndex) {
    const rric = new ResponseRowIdCombination();
    
    // TODO: THIS NEEDS FIXING: PERFORMANCE BOTTLENECK
    if (this.colAxis.type) rric.add(this.colAxis.ids[columnIndex]);
    if (this.rowAxis.type) rric.add(this.rowAxis.ids[rowIndex]);

    const value = this.idValueMap[rric.get()],
          n = parseFloat(value);

    if (isBoolean(value)) {
        return 1;
    }

    if (!isNumber(n) || n != value) {
        return  0;
    }

    return n;
};

PivotTable.prototype.addRight = function(columnIndex, rowStart, rowEnd) {
    const column = this.buildColumn(columnIndex, rowStart, rowEnd);
    for (let i = 0; i < column.length; i++) {
        this.table[i].push(column[i]);
    }
};

PivotTable.prototype.addLeft = function(columnIndex, rowStart, rowEnd) {
    const column = this.buildColumn(columnIndex, rowStart, rowEnd);
    for (let i = 0; i < column.length; i++) {
        this.table[i].unshift(column[i]);
    }
};

PivotTable.prototype.addTop = function(rowIndex, columnStart, columnEnd) {
    this.table.unshift(this.buildRow(rowIndex, columnStart, columnEnd))
};

PivotTable.prototype.addBottom = function(rowIndex, columnStart, columnEnd) {
    this.table.push(this.buildRow(rowIndex, columnStart, columnEnd));
};

PivotTable.prototype.deleteLeft = function() {
    for (let i = 0; i < this.table.length; i++) {
        this.table[i].shift();
    }
};

PivotTable.prototype.deleteRight = function() {
    for (let i = 0; i < this.table.length; i++) {
        this.table[i].pop();
    }
};

PivotTable.prototype.deleteTop = function() {
    this.table.shift();
};

PivotTable.prototype.deleteBottom = function() {
    this.table.pop();
};

PivotTable.prototype.buildRow = function(rowIndex, columnStart, columnEnd) { 
    let rowAxisRow = [];

    if (rowIndex < this.columnDimensionSize) {
        return this.buildColumnAxisRow(rowIndex, columnStart, columnEnd + 1);
    }

    rowIndex -= this.columnDimensionSize;

    if (columnStart < this.rowDimensionSize) {
        rowAxisRow = this.buildRowAxisRow(rowIndex, columnStart);
        columnStart = 0
    } else {
        columnStart -= this.rowDimensionSize;
    }

    // TODO: UGLY HACK
    columnEnd - 1

    return rowAxisRow.concat(this.buildValueRow(rowIndex, columnStart, columnEnd));
};

PivotTable.prototype.buildValueRow = function(rowIndex, columnStart, columnEnd) {
    const row = [];

    for (let i=0, x=columnStart, cell; x < columnEnd; i++, x++) {
        cell = this.getValueCell(x, rowIndex);

        if (cell) {
            row[i] = cell
        }
    }

    return row;
};

PivotTable.prototype.buildValueColumn = function(columnIndex, rowStart, rowEnd) {
    const column = [];
    
    for (let i=0, y=rowStart; y < rowEnd; i++, y++) {
        column[i] = this.getValueCell(columnIndex, y);
    }

    return column; 
};

// row axis building functions
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

PivotTable.prototype.buildRowAxisColumn = function(columnIndex, rowStart, rowEnd) {
    if (this.rowDimensionSize < columnIndex) {
        return [];
    }

    const column = [],
          colspan = this.rowDimensionSize - columnIndex,
          isTop  = this.columnStart !== columnIndex;

    if (!this.rowAxis.type) {
        for (let i = 0; i < rowEnd - rowStart; i++) {
            column[i] = DimensionEmptyCell(1, 1, false, 'visibility: hidden;');
        }
        return column;
    }

    for (let i = 0, y = rowStart; y < rowEnd; i++, y++) {

        if (this.isRowSubTotal(y)) {
            column[i] = DimensionSubTotalCell('&nbsp;', colspan, 1, true, !isTop);
            continue;
        }

        if (this.isRowGrandTotal(y)) {
            if (isTop) column[i] = DimensionGrandTotalCell('Total', colspan, 1, false, false);
            else       column[i] = DimensionSubTotalCell('&nbsp;', colspan, 1, true, true);
            continue;
        }

        column[i] = this.buildRowAxisCell(columnIndex, this.normalizeRowIndex(y));
    }
    return column;
};

PivotTable.prototype.buildRowAxisRow = function(rowIndex, columnStart) {
    if (this.rowDimensionSize < columnStart) {
        return [];
    }

    if (!this.rowAxis.type) {
        return [DimensionEmptyCell(1, 1, false, 'visibility: hidden;')];
    }

    if (this.isRowSubTotal(rowIndex)) {
        return this.buildSubTotalAxisRow(columnStart);
    }

    if (this.isRowGrandTotal(rowIndex)) {
        return this.buildGrandTotalAxisRow(columnStart);
    }

    if (this.doColSubTotals()) {
        rowIndex = this.normalizeRowIndex(rowIndex);
    }
    
    const row = [];

    for (let i = 0, x = columnStart; x < this.rowDimensionSize; i++, x++) {
        row[i] = this.buildRowAxisCell(x, rowIndex);
    }

    return row;
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


// column axis build functions
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

PivotTable.prototype.buildColumnAxisCell = function(rowIndex, columnIndex) {
    const axisObject = this.getColumnAxisObject(rowIndex, columnIndex);

    return ColumnAxisCell(
        axisObject,
        this.response,
        this.doShowHierarchy(),
        !(axisObject.rowSpan || axisObject.colSpan),
        this.getRowSortId(rowIndex));
};

PivotTable.prototype.buildRowAxisCell = function(columnIndex, rowIndex) {
    const axisObject = this.getRowAxisObject(columnIndex, rowIndex);

    return RowAxisCell(
        axisObject,
        this.response,
        this.doShowHierarchy(),
        !(axisObject.rowSpan || axisObject.colSpan));
};

PivotTable.prototype.buildColumnAxisRow = function(rowIndex, columnStart, columnEnd) {
    
    const row = [];
    
    if (this.columnDimensionSize < rowIndex) {
        return row;
    }
    
    let x = columnStart;

    if (x < this.rowDimensionSize) {
        let corner = this.buildCornerAxisRow(rowIndex, columnStart);
        for (let i = 0; i < corner.length; i++, x++) {
            row[i] = corner[i];
        }
    }

    x         -= this.rowDimensionSize;
    columnEnd -= this.rowDimensionSize;

    const rowspan = this.columnDimensionSize - rowIndex,
          firstIteration = rowIndex === this.rowStart;

    for (let i = row.length; x < columnEnd; i++, x++) {
        
        if (this.isColumnSubTotal(x)) {
            if (i === 0) row[i] = DimensionSubTotalCell('&nbsp;', 1, rowspan, true, false);
            else         row[i] = DimensionSubTotalCell('&nbsp;', 1, rowspan, true, true);
            continue;
        }

        if (this.isColumnGrandTotal(x)) {
            if (firstIteration) row[i] = DimensionGrandTotalCell('Total', 1, rowspan, this.doSortableColumnHeaders(), false);
            else                row[i] = DimensionSubTotalCell('&nbsp;', 1, rowspan, true, true);
            continue;
        }

        row[i] = this.buildColumnAxisCell(rowIndex, this.normalizeColumnIndex(x));
    }
    return row;
};
    
PivotTable.prototype.buildColumnAxisColumn = function(columnIndex, rowStart) {
    if (this.columnDimensionSize < rowStart) {
        return [];
    }
    
    if (columnIndex < this.rowDimensionSize) {
        return this.buildCornerAxisColumn(columnIndex, rowStart);
    }

    columnIndex -= this.rowDimensionSize

    if (this.isColumnSubTotal(columnIndex)) {
        return this.buildSubTotalAxisColumn(rowStart);
    }

    if (this.isColumnGrandTotal(columnIndex)) {
        return this.buildGrandTotalAxisColumn(rowStart);
    }

    const column = [];

    columnIndex = this.normalizeColumnIndex(columnIndex);

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

// corner axis building functions
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

PivotTable.prototype.transformColPercentage = function() {
    const table = this.table;
    for (let i = 0; i < table.length; i++) {
        for (let j = 0; j < table[i].length; j++) {
            if (!table[i][j].empty) {
                table[i][j].htmlValue = getPercentageHtml(table[i][j].value, columnTotalLookup[j]);
            }
            if (this.valueLookup[this.getRowSize() - 1][j] === 0) {
                table[i][j].empty = true;
                table[i][j].htmlValue = '&nbsp;';
            }
        }
    }
};

PivotTable.prototype.transformRowPercentage = function() {
    const table = this.table;
    for (let i = 0; i < table.length; i++) {
        for (let j = 0; j < table[i].length; j++) {
            if (!table[i][j].empty) {
                table[i][j].htmlValue = getPercentageHtml(table[i][j].value, rowTotalLookup[i]);
            }
            if (this.valueLookup[i][this.getColumnSize() - 1] === 0) {
                table[i][j].empty = true;
                table[i][j].htmlValue = '&nbsp;';
            }
        }
    }
};

PivotTable.prototype.createValueLookup = function() {

    const lookup = buildTable2D(this.rowSize, this.columnSize, 0);

    for (let i=0, y=0; i < this.rowAxis.size; i++, y++) {

        if (this.doColSubTotals() && (y + 1) % (this.rowUniqueFactor + 1) === 0) {
            y++;
        }

        for (let j=0, x=0, value; j < this.colAxis.size; j++, x++) {

            if (this.doRowSubTotals() && (x + 1) % (this.colUniqueFactor + 1) === 0) {
                x++;
            }

            value = this.getValue(i, j);

            lookup[y][x] = value;

            // calculate sub totals
            if (this.doColSubTotals()) lookup[this.getNextSubRowIndex(i)][x]    += value;
            if (this.doRowSubTotals()) lookup[y][this.getNextSubColumnIndex(j)] += value;

            // calculate grand totals
            if (this.doColTotals()) lookup[this.getNextTotalRowIndex()][x]    += value;
            if (this.doRowTotals()) lookup[y][this.getNextTotalColumnIndex()] += value;

            // calculate intersection totals
            if (this.doRowTotals() && this.doColTotals())       lookup[this.getNextTotalRowIndex()][this.getNextTotalColumnIndex()] += value;
            if (this.doColSubTotals() && this.doRowSubTotals()) lookup[this.getNextSubRowIndex(i)][this.getNextSubColumnIndex(j)]   += value;

            if (this.doRowTotals() && this.doRowSubTotals()) lookup[this.getNextTotalRowIndex()][this.getNextSubColumnIndex(j)] += value;
            if (this.doColSubTotals() && this.doColTotals()) lookup[this.getNextSubRowIndex(i)][this.getNextTotalColumnIndex()] += value;

        }
    }

    return lookup;
};
    
PivotTable.prototype.createTypeLookup = function() {
    const lookup = buildTable2D(this.rowSize || 1, this.columnSize || 1, 0);
    for (let y = 0; y < lookup.length; y++) {
        for (let x = 0, type; x < lookup[y].length; x++) {

            // calculate sub totals
            if (this.isRowSubTotal(y)) lookup[y][x] = 1;
            if (this.isColumnSubTotal(x)) lookup[y][x] = 1;

            // calculate grand totals
            if (this.isColumnGrandTotal(x)) lookup[y][x] = 2;
            if (this.isRowGrandTotal(y)) lookup[y][x] = 2;
            
            // calculate intersection totals
            if (this.isColumnSubTotal(x) && this.isRowSubTotal(y)) lookup[y][x] = 1;
            if (this.isColumnGrandTotal(x) && this.isRowGrandTotal(y)) lookup[y][x] = 2;
        }
    }
    return lookup;
};

// utils
PivotTable.prototype.printSummary = function() {
    console.log(
        "rows:", this.valueLookup.length,
        "columns:", this.valueLookup[0].length,
        "cells", this.valueLookup.length * this.valueLookup[0].length);
};

PivotTable.prototype.constrainHeight = function(index) {
    return Math.min(this.getRowAxisSize(), index);
};

PivotTable.prototype.constrainWidth = function(index) {
    return Math.min(this.getColumnAxisSize(), index);
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

PivotTable.prototype.hideEmptyRows = function() {

    this.visibleEmptyRows = 0;
    
    let recursive = false,
        hiddenRows = 0;

    for (let i = Math.max(0, this.columnDimensionSize - this.rowStart), dimLeaf; i < this.table.length; i++) {
        
        if (this.isRowEmpty(i - (this.columnDimensionSize - this.rowStart))) {
            
            this.visibleEmptyRows += 1;

            if (this.columnStart < this.rowDimensionSize) {
                dimLeaf = this.table[i][this.rowDimensionSize - 1 - this.columnStart];

                if (dimLeaf.collapsed) continue;

                if (dimLeaf.type === 'dimensionSubtotal') {
                    this.table[i][0].collapsed = true;
                }

                if (dimLeaf && !dimLeaf.knicked) {
                    hiddenRows++;                
                    dimLeaf.knicked = true;
                    this.recursiveReduce(dimLeaf, 'rowSpan');
                }
            }

            this.table[i][0].collapsed = true;
            for (let j = 0; j < this.table[i].length; j++) {
                this.table[i][j].collapsed = true;
            }
        }
    }

    for (let i = 0; i < hiddenRows; i++) {
        if (this.isRowEmpty(this.rowEnd)) {
            recursive = true;
        }
        this.setRowEnd(this.rowEnd + 1)
        this.addBottom(this.rowEnd, this.columnStart, this.columnEnd);
    }

    if (recursive) {
        this.hideEmptyRows();
    }
};

PivotTable.prototype.hideEmptyColumns = function() {
    
    this.visibleEmptyColumns = 0;
    
    let recursive = false,
        hiddenColumns = 0;

    for (let i = Math.max(0, this.rowDimensionSize - this.columnStart), dimLeaf; i < this.table[1].length; i++) {
        if (this.isColumnEmpty(i - (this.rowDimensionSize - this.columnStart))) {

            this.visibleEmptyColumns += 1;
            
            if (this.rowStart < this.columnDimensionSize) {
                dimLeaf = this.table[this.columnDimensionSize - 1 - this.rowStart][i];
                
                if (dimLeaf.collapsed) continue;

                if (dimLeaf.type === 'dimensionSubtotal') {
                    this.table[0][i].collapsed = true;
                }

                if (dimLeaf && !dimLeaf.knicked) {
                    hiddenColumns++;                
                    dimLeaf.knicked = true;
                    this.recursiveReduce(dimLeaf, 'colSpan');
                }
            }
            
            this.table[0][i].collapsed = true;
            for (let j = 0; j < this.table.length; j++) {
                this.table[j][i].collapsed = true;
            }
        }
    }

    for (let i = 0; i < hiddenColumns; i++) {
        if (this.isColumnEmpty(this.columnEnd)) {
            recursive = true;
        }
        this.setColumnEnd(this.columnEnd + 1)
        this.appendTableColumn(this.columnEnd, this.rowStart, this.rowEnd);
    }

    if (recursive) {
        this.hideEmptyColumns();
    }
};

PivotTable.prototype.recursiveReduce = function(obj, span) {
    if (!obj.children) {
        obj.collapsed = true;

        if (obj.parent && obj.parent.oldestSibling) {
            obj.parent.oldestSibling.children--;
            obj.parent.oldestSibling[span]--;
        }
    }

    if (obj.parent) {
        this.recursiveReduce(obj.parent);
    }
};

PivotTable.prototype.transformColPercentage = function(table) {
    for (let i = 0; i < table.length; i++) {
        for (let j = 0; j < table[i].length; j++) {
            if (!table[i][j].empty) {
                table[i][j].htmlValue = getPercentageHtml(table[i][j].value, columnTotalLookup[j]);
            }
            if (valueLookup[this.rowSize - 1][j] === 0) {
                table[i][j].empty = true;
                table[i][j].htmlValue = '&nbsp;';
            }
        }
    }
};

PivotTable.prototype.transformRowPercentage = function(table) {
    for (let i = 0; i < table.length; i++) {
        for (let j = 0; j < table[i].length; j++) {
            if (!table[i][j].empty) {
                table[i][j].htmlValue = getPercentageHtml(table[i][j].value, rowTotalLookup[i]);
            }
            if (valueLookup[i][this.columnSize - 1] === 0) {
                table[i][j].empty = true;
                table[i][j].htmlValue = '&nbsp;';
            }
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
    const legendSetId = this.getLegendSetId(config.dxId)
    return this.appManager.getLegendSetById(legendSetId).legends;
}

PivotTable.prototype.getLegendSet = function(dxId) {

    if (!dxId) {
        return null;
    }

    return this.response.metaData.items[config.dxId].legendSet
}

PivotTable.prototype.buildHtmlCell = function(config) {

    // validation
    if (!isObject(config) || config.hidden || config.collapsed) {
        return '';
    }

    if (isString(config.sort)) {
        this.sortableIdObjects.push({     
            id: config.sort,
            uuid: config.uuid
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
            style += `background-color:${bgColor}; color:${isColorBright(bgColor) ? 'black' : 'white'};`;
        }

        if (this.doLegendDisplayStyleText() && bgColor) {
            style += `color:${bgColor};`;
        }
    }
    
    if (this.doTableClipping() || this.doStickyColumns() || this.doStickyRows()) {
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
    if (this.doTableClipping()) {
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
}

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
}

PivotTable.prototype.buildTopPaddingHtmlRow = function() {
    const cell = this.buildTopPaddingHtmlCell();

    if (cell) {
        return `<tr>${cell}</tr>`;
    }

    return  '';
}

PivotTable.prototype.buildBottomPaddingHtmlRow = function() {
    const cell = this.buildBottomPaddingHtmlCell();
    
    if (cell) {
        return `<tr>${cell}</tr>`;
    }

    return  '';
}

PivotTable.prototype.buildTopPaddingHtmlCell = function() {

    const padding = this.getTopPadding(),
             cell = VerticalPaddingCell(padding, 'top-padding');

    return this.buildHtmlCell(cell);
}

PivotTable.prototype.buildBottomPaddingHtmlCell = function() {

    const padding = this.getBottomPadding(),
            cell  = VerticalPaddingCell(padding, 'bottom-padding');

    return this.buildHtmlCell(cell);
}

PivotTable.prototype.buildLeftPaddingHtmlCell = function() {

    const padding = this.getLeftPadding(),
            cell  = HorizontalPaddingCell(padding, 'left-padding');

    return this.buildHtmlCell(cell);
}

PivotTable.prototype.buildRightPaddingHtmlCell = function() {

    const padding = this.getRightPadding(),
            cell  = HorizontalPaddingCell(padding, 'right-padding');

    return this.buildHtmlCell(cell);
}

PivotTable.prototype.buildHtmlTableHead = function(htmlArray) {
    let cls        = '';

    if (this.doStickyColumns()) {
        cls += 'pivot-sticky-column-2';
    }

    return `
        <thead class="${cls}">
            ${this.doTableClipping() ? this.buildTopPaddingHtmlRow() : ''}
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
            ${this.doTableClipping() ? this.buildTopPaddingHtmlRow() : ''}
            ${this.buildHtmlTableRows(htmlArray, startRowIndex, endRowIndex)}
            ${this.doTableClipping() ? this.buildBottomPaddingHtmlRow() : ''}
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

PivotTable.prototype.render = function() {
    
    if (this.doHideEmptyColumns()) {
        this.hideEmptyColumns();
    }

    if (this.doHideEmptyRows()) {
        this.hideEmptyRows();
    }

    if (this.doTableClipping()) {
        this.updateDimensionSpan();
    }

    let htmlArray = arrayClean([].concat(
        this.options.skipTitle || this.rowStart > 0 ? [] : this.buildTableTitle(this.table[0].length),
        this.buildTableFilter(this.table[0].length),
        this.buildHtmlRows(this.table)
    ));

    return this.buildHtmlTable(htmlArray);
};

PivotTable.prototype.update = function(columnStart, rowStart) {

    if (rowStart > 0 && !this.options.skipTitle) {
        rowStart -= 1;
    }

    const columnEnd = this.getColumnEnd(columnStart),
          rowEnd    = this.getRowEnd(rowStart);

    while (columnStart !== this.columnStart || rowStart !== this.rowStart) {
        this.applyChange(columnStart, columnEnd, rowStart, rowEnd);
    }

    return this.render();
};

PivotTable.prototype.applyChange = function(columnStart, columnEnd, rowStart, rowEnd) {
    
    if (this.columnStart > columnStart) {
        this.columnStart--;
        this.addLeft(this.columnStart, this.rowStart, this.rowEnd);
    }

    if (this.columnEnd < columnEnd + this.visibleEmptyColumns) {
        this.columnEnd++;
        this.addRight(this.columnEnd, this.rowStart, this.rowEnd);
    }

    if (this.rowStart > rowStart) {
        this.rowStart--;
        this.addTop(this.rowStart, this.columnStart, this.columnEnd);
    }

    if (this.rowEnd < rowEnd + this.visibleEmptyRows) {
        this.rowEnd++;
        this.addBottom(this.rowEnd, this.columnStart, this.columnEnd);
    }

    if (this.rowStart < rowStart) {
        this.rowStart++;
        this.deleteTop();
    }

    if (this.rowEnd > rowEnd + this.visibleEmptyRows) {
        this.rowEnd--;
        this.deleteBottom();
    }
    
    if (this.columnStart < columnStart) {
        this.columnStart++;
        this.deleteLeft();
    } 

    if (this.columnEnd > columnEnd  + this.visibleEmptyColumns) {
        this.columnEnd--;
        this.deleteRight();
    }
};

PivotTable.prototype.buildValueTable = function(rowStart, rowEnd, columnStart, columnEnd) {


    rowEnd -= this.columnDimensionSize;
    columnEnd -= this.rowDimensionSize;

    const rowSize = (rowEnd - rowStart + 1) || 1,
          colSize = (columnEnd - columnStart + 1) || 1;


    let table = buildTable2D(rowSize, colSize);

    for (let i=0, y=rowStart; i < table.length; i++, y++) {
        for (let j=0, x=columnStart; j < table[i].length; j++, x++) {

            if (this.doSortableColumnHeaders()) {
                let totalIdComb = new ResponseRowIdCombination(this.refs, ['total', this.rowAxis.ids[y]]);
                this.idValueMap[totalIdComb.get()] = this.isRowEmpty(y) ? null : this.getRowTotal(y);
            }

            table[i][j] = this.getValueCell(x, y);
        }
    }
    
    if (this.doRowPercentage()) this.transformRowPercentage(table);
    if (this.doColPercentage()) this.transformColPercentage(table);

    return table;
};


PivotTable.prototype.updateRowAxisDimensionSpan = function() {

    if (!this.rowAxis.type) {
        return;
    }

    const rowSpanLimit = this.rowEnd - this.rowStart + 1;

    for (let i=0, x=this.columnStart, cell; i < this.rowDimensionSize - this.columnStart; i++, x++) {
        for (let j=0, rowSpanCounter=0; j < this.table.length; j++) {

            cell = this.table[j][i];

            if (cell.collapsed) {
                continue;
            }

            cell.rowSpan = this.getAdjustedRowSpan(cell, x);
            cell.hidden  = this.checkAxisHiddenParameters(cell, i, j);

            if (j === 0 && cell.type === 'empty') {
                rowSpanCounter += Math.max(0, this.columnDimensionSize - this.rowStart);
                continue;
            }

            if (rowSpanCounter >= rowSpanLimit || cell.hidden) {
                cell.hidden = true;

                if (cell.type === 'dimensionSubtotal') {
                    rowSpanCounter += 1;
                }

                continue;
            }

            if (cell.rowSpan + rowSpanCounter > rowSpanLimit) {
                cell.rowSpan = rowSpanLimit - rowSpanCounter;
            }

            rowSpanCounter += cell.rowSpan;
        }
    }
};


PivotTable.prototype.updateColumnAxisDimensionSpan = function() {


    const colSpanLimit = this.columnEnd - this.columnStart + 1;

    for (let i=0, y=this.rowStart, cell; i < this.columnDimensionSize - this.rowStart; i++, y++) {
        for (let j=0, colSpanCounter=0; j < this.table[i].length; j++) {

            cell = this.table[i][j];

            if (cell.collapsed) {
                continue;
            }

            cell.colSpan = this.getAdjustedColSpan(cell, y);
            cell.hidden  = this.checkAxisHiddenParameters(cell, i, j);

            if (j === 0 && cell.type === 'empty') {
                colSpanCounter += Math.max(0, this.rowDimensionSize - this.columnStart);
                continue;
            }

            if (colSpanCounter >= colSpanLimit || cell.hidden) {
                cell.hidden = true;

                if (cell.type === 'dimensionSubtotal') {
                    colSpanCounter += 1;
                }

                continue;
            }

            if (cell.colSpan + colSpanCounter > colSpanLimit) {
                cell.colSpan = colSpanLimit - colSpanCounter;
            }

            colSpanCounter += cell.colSpan;
        }
    }
};

PivotTable.prototype.updateDimensionSpan = function() {
    this.updateColumnAxisDimensionSpan();
    this.updateRowAxisDimensionSpan();
}

PivotTable.prototype.getAdjustedColSpan = function(cell, y) {
    if (cell.children) {
        return cell.oldestSibling.children *
            this.colAxis.span[y + 1] - cell.siblingPosition;
    }

    return cell.colSpan;;
};
    
PivotTable.prototype.getAdjustedRowSpan = function(cell, x) {
    if (cell.children) {
        return cell.oldestSibling.children * 
            this.rowAxis.span[x + 1] - cell.siblingPosition;
    }

    return cell.rowSpan;;
};

PivotTable.prototype.checkAxisHiddenParameters = function(cell, i, j) {
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

PivotTable.prototype.buildValueColumn = function(columnIndex, rowStart, rowEnd) {
    const column = [];
    
    for (let i=0, y=rowStart; y < rowEnd; i++, y++) {
        column[i] = this.getValueCell(columnIndex, y);
    }

    return column; 
};

PivotTable.prototype.buildColumn = function(columnIndex, rowStart, rowEnd) {
    const columnAxis = this.buildColumnAxisColumn(columnIndex, rowStart);

    if (rowStart > this.columnDimensionSize) {
        rowStart -= this.columnDimensionSize;
    }
    
    rowEnd -= this.columnDimensionSize - 1

    if (columnIndex < this.rowDimensionSize) {
        return columnAxis.concat(this.buildRowAxisColumn(columnIndex, rowStart, rowEnd));
    }

    columnIndex -= this.rowDimensionSize;

    let valueTable = this.buildValueColumn(columnIndex, rowStart, rowEnd),
        column = columnAxis.concat(valueTable);

    return column;
};