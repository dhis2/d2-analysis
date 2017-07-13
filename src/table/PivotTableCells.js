import { ResponseRowIdCombination } from '../api/ResponseRowIdCombination';
import { getRoundedHtmlValue } from './PivotTableUtils';
import uuid from 'd2-utilizr/lib/uuid';

/** @description factory function for cell with default options.
 *  @returns {object}
 */
const DefaultCell = () => {
    return {
        htmlValue: '&nbsp;',
        collapsed: false,
        hidden:    false,
        empty:     false,
        colSpan:   1,
        rowSpan:   1,
        width:     120,
        height:    25,
    };
};

/** @description factory function for value sub total cells.
 *  @param   {number} value 
 *  @returns {object}
 */
export const ValueSubTotalCell = (value) => {
    const cell = DefaultCell();

    cell.value     = value;
    cell.type      = 'valueSubtotal';
    cell.cls       = 'pivot-value-subtotal';

    cell.empty     = value <= 0;
    
    cell.htmlValue = cell.empty ? '&nbsp;' : getRoundedHtmlValue(value);

    return cell;
};

/** @description factory function for value grand total cells.
 *  @param   {number} value 
 *  @returns {object}
 */
export const ValueGrandTotalCell = (value) => {
    const cell = DefaultCell();

    cell.value     = value;
    cell.type      = 'valueTotalSubgrandtotal';
    cell.cls       = 'pivot-value-total-subgrandtotal';

    cell.empty     = value <= 0;

    cell.htmlValue = cell.empty ? '&nbsp;' : getRoundedHtmlValue(value);

    return cell;
};

/** @description factory functon for column axis cells.
 *  @param   {any} parentCell 
 *  @param   {any} response 
 *  @param   {any} showHierarchy 
 *  @param   {any} hidden 
 *  @returns {object}
 */
export const RowAxisCell = (axisObject, response, showHierarchy, hidden) => {
    const cell = axisObject;

    cell.collapsed = false;
    cell.hidden    = false;
    cell.empty     = false;
    cell.width     = 120;
    cell.height    = 25;

    cell.type      = 'rowDimension';
    cell.cls       = 'pivot-dim td-nobreak' + (showHierarchy ? ' align-left' : '');

    cell.noBreak   = true;
    cell.hidden    = hidden;

    cell.htmlValue = response.getItemName(cell.id, showHierarchy, true);

    return cell;
};

/** @description factory function for row axis cells.
 *  @param   {object} parentCell 
 *  @param   {object} resoonse
 *  @param   {boolean} showHierarchy
 *  @param   {boolean} hidden 
 *  @param   {string} sort
 *  @returns {object}
 */
export const ColumnAxisCell = (axisObject, response, showHierarchy, hidden, sort) => {
    const cell = axisObject;

    cell.collapsed = false;
    cell.hidden    = false;
    cell.empty     = false;
    cell.width     = 120;
    cell.height    = 25;

    cell.type      = 'columnDimension';
    cell.cls       = 'pivot-dim';

    cell.noBreak   = false;
    cell.hidden    = hidden;

    cell.sort      = sort ? sort : null; 
    
    cell.htmlValue = response.getItemName(cell.id, showHierarchy, true);

    return cell;
};

/** @description factory function for dimension sub total cells.
 *  @param   {string} value 
 *  @param   {number} colSpan 
 *  @param   {number} rowSpan 
 *  @param   {boolean} empty 
 *  @param   {boolean} hidden 
 *  @returns {object}
 */
export const DimensionSubTotalCell = (value, colSpan, rowSpan, empty, hidden) => {
    const cell = DefaultCell();

    cell.value     = value;
    cell.type      = 'dimensionSubtotal';
    cell.cls       = 'pivot-dim-subtotal';

    cell.colSpan   = colSpan;
    cell.rowSpan   = rowSpan;

    cell.empty     = empty;
    cell.hidden    = hidden;

    return cell;
};

/** @description factory function for dimension grand total cells.
 *  @param {string}  value 
 *  @param {number}  colSpan 
 *  @param {number}  rowSpan 
 *  @param {boolean} sort 
 *  @param {boolean} generateUuid 
 *  @returns 
 */
export const DimensionGrandTotalCell = (value, colSpan, rowSpan, sort, generateUuid) => {
    const cell = DefaultCell();

    cell.value   = value;
    cell.type    = 'dimensionSubtotal';
    cell.cls     = 'pivot-dim-total';

    cell.colSpan = colSpan;
    cell.rowSpan = rowSpan;

    cell.sort    = sort ? 'total' : null;
    cell.uuid    = generateUuid ? uuid() : null;

    cell.htmlValue = value;

    return cell;
};

/** @description factory function for dimension empty cells.
 *  @param   {number} colSpan 
 *  @param   {number} rowSpan 
 *  @param   {number} hidden 
 *  @returns {object}
 */
export const DimensionEmptyCell = (colSpan, rowSpan, hidden) => {
    const cell = DefaultCell();

    cell.value     = '&nbsp;';
    cell.type      = 'empty';
    cell.cls       = 'pivot-empty';

    cell.colSpan   = colSpan;
    cell.rowSpan   = rowSpan;

    cell.hidden    = hidden;

    return cell;
};

/** @description factory function for labeled dimension cell.
 *  @param   {string} value 
 *  @returns {object} 
 */
export const DimensionLabelCell = (value) => {
    const cell = DefaultCell();

    cell.value = value;
    cell.type  = 'labeled';
    cell.cls   = 'pivot-dim-label';

    cell.htmlValue = value;

    return cell;
};

/** @description factory function for padding cells.
 *   @param   {number}  width 
 *   @param   {number}  height 
 *   @param   {number}  colSpan 
 *   @param   {number}  rowSpan 
 *   @param   {boolean} hidden 
 *   @returns {object}
 */
export const PaddingCell = (width, height, colSpan, rowSpan, hidden) => {
    const cell = DefaultCell();

    cell.value     = '&nbsp;';
    cell.type      = 'padding';
    cell.cls       = 'pivot-padding';

    cell.width     = width;
    cell.height    = height;

    cell.colSpan   = colSpan;
    cell.rowSpan   = rowSpan;

    cell.hidden    = hidden;

    return cell;
};


// TODO: THESE NEED WORK

export const ValueCell = (value, response, rric, uuids) => {
    const cell  = DefaultCell();
    
    cell.uuid       = uuid();
    cell.uuids      = uuids;

    cell.empty      = value === -1;
    cell.value      = value === -1 ? 0 : value;
    cell.htmlValue  = value === -1 ? '&nbsp;' : value;

    cell.type       = 'value';
    cell.cls        = 'pivot-value' + (cell.empty ? ' cursor-default' : '');

    cell.dxId       = rric.getIdByIds(response.metaData.dimensions.dx);
    cell.peId       = rric.getIdByIds(response.metaData.dimensions.pe);
    cell.ouId       = rric.getIdByIds(response.metaData.dimensions.ou);

    return cell;
};





    const updateLeftHtmlColumn = () => {
        replaceColumns(currentHtmlTable, 0, 2, getHtmlTableColumns(0, 2));
    }

    const updateRightHtmlColumn = () => {
        replaceColumns(currentHtmlTable, currentHtmlTable[2].length, currentHtmlTable[2].length - 2, getHtmlTableColumns(currentHtmlTable[2].length, currentHtmlTable[2].length - 2));
    }

    const updateTopHtmlRow = () => {
        replaceRows(currentHtmlTable, 0, 2, getHtmlTableColumns(0, 2));
    }

    const updateBottomHtmlRow = () => {
        replaceRows(currentHtmlTable, currentHtmlTable.lenght - 2, currentHtmlTable.lenght, getHtmlTableColumns(currentHtmlTable.lenght - 2, currentHtmlTable.lenght));            
    }

    const replaceRows = (table, startReplace, endReplace, items) => {
        table.splice(startReplace, endReplace, ...items);
    }

    const replaceColumns = (table, startReplace, endReplace, items) => {
        table.map((value, index) => { return value.splice(startReplace, endReplace, ...items[index]) });
    }

    const appendColumn = (table, column) => {
        table.map((value, index) => { value.push(column[index]) });
    }

    const prependColumn = (table, column) => {
        table.map((value, index) => { value.unshift(column[index]) });
    }

    const appendRow = (table, row) => {
        table.push(row);
    } 

    const prependRow = (table, row) => {
        table.unshift(row);
    } 

    const replaceColumnDimensionHtml = (table, rowStart, columns) => {
        replaceColumns(table, 0, colAxis.dims - rowStart + 1, columns);
    }

    const replaceRowDimensionHtml = (table, columnStart, rows) => {
        replaceRows(table, 0, rowAxis.dims - columnStart + 1, rows);
    }

    const getColumnDimensionHtml = (rowStart) => {
        return getHtmlTableColumns(0, rowAxis.dims - rowStart + 1)
    }

    const getRowDimensionHtml = (columnStart) => {
        return getHtmlTableRows(0, colAxis.dims - columnStart + 1)
    }

    const getHtmlTableColumns = (startColumn, endColumn) => {
        return buildHtmlRows(currentTable.map((value) =>  { return value.slice(startColumn, endColumn)}));
    }

    const getHtmlTableRows = (rowStart, rowEnd) => {
        return buildHtmlRows(currentTable.slice(rowStart, rowEnd));
    }

    const appendHtmlColumn = (table, column) => {
        table.map((value, index) => { return value.push(column[index]) });
    }

    const prependHtmlColumn = () => {
        table.map((value, index) => { return value.unshift(column[index]) });
    }

    const deleteLeftHtmlColumn = () => {
        return array.map((value) => { return val.slice(0, -1)  });
    }

    const updateHtmlTable = () => {

        if (t.columnStart < rowAxis.dims) {
            replaceRowDimensionHtml(currentHtmlTable, 0, getRowDimensionHtml(0));
        }

        if (t.rowStart < colAxis.dims) {
            replaceColumnDimensionHtml(currentHtmlTable, 0, getColumnDimensionHtml(0));
        }

        updateLeftHtmlColumn();
        updateRightHtmlColumn();
        updateTopHtmlRow();
        updateBottomHtmlRow();
    }