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

        style: '',
    };
};

export const ValueCell = (value, response, rric, uuids, htmlValue) => {
    const cell  = DefaultCell();
    
    cell.uuid       = uuid();
    cell.uuids      = uuids;

    cell.value      = value;
    cell.htmlValue  = value === null || typeof(value) === 'undefined' ? 
        '&nbsp;' : htmlValue ? 
            htmlValue : value;
    
    cell.isValue    = !cell.empty;

    cell.type       = 'value';
    cell.cls        = 'pivot-value' + (cell.empty ? ' cursor-default' : '');

    cell.dxId       = rric.getIdByIds(response.metaData.dimensions.dx);
    cell.peId       = rric.getIdByIds(response.metaData.dimensions.pe);
    cell.ouId       = rric.getIdByIds(response.metaData.dimensions.ou);

    return cell;
};

export const PlainValueCell = (value, rric, response) => {
    const cell = DefaultCell();

    cell.value      = value;
    cell.type       = 'value';
    cell.cls        = 'pivot-value' + (cell.empty ? ' cursor-default' : ' pointer');

    cell.htmlValue  = typeof !value ? 
        '&nbsp;' : value;

    return cell;
}

export const ValueSubTotalCell = (value, htmlValue) => {
    const cell = DefaultCell();

    cell.value     = value;
    cell.type      = 'valueSubtotal';
    cell.cls       = 'pivot-value-subtotal';

    cell.empty     = value === null || typeof(value) === 'undefined';
    
    if (typeof value === 'string') {
        cell.htmlValue = value;
    } else {
        cell.htmlValue = cell.empty ? 
            '&nbsp;' : htmlValue ? 
                htmlValue : getRoundedHtmlValue(value);
    }

    return cell;
};

export const ValueTotalCell = (value, htmlValue) => {
    const cell = DefaultCell();

    cell.value     = value;
    cell.type      = 'valueTotal';
    cell.cls       = 'pivot-value-total-subgrandtotal';

    cell.empty     = value === null || typeof(value) === 'undefined';;

    if (typeof value === 'string') {
        cell.htmlValue = value;
    } else {
        cell.htmlValue = cell.empty ? 
            '&nbsp;' : htmlValue ? 
                htmlValue : getRoundedHtmlValue(value);
    }

    return cell;
};

export const RowAxisCell = (axisObject, response, showHierarchy, hidden) => {

    if (!axisObject) {
        return null;
    }

    const cell = axisObject;

    cell.collapsed = false;
    cell.hidden    = false;
    cell.empty     = false;
    cell.width     = 120;
    cell.height    = 25;

    cell.type      = 'dimension';
    cell.axis      = 'row';
    cell.cls       = 'pivot-dim pivot-row-dim td-nobreak'

    if (showHierarchy) {
        cell.csl += ' align-left';
    } 

    cell.noBreak   = true;
    cell.hidden    = typeof hidden === 'undefined' ? 
        !(axisObject.rowSpan || axisObject.colSpan) : hidden;

    let htmlValue = response.getItemName(cell.id, showHierarchy, true);

    cell.htmlValue = htmlValue;
    cell.title = htmlValue;

    return cell;
};

export const ColumnAxisCell = (axisObject, response, showHierarchy, sort, hidden) => {

    if (!axisObject) {
        return null;
    }

    const cell = axisObject;

    cell.collapsed = false;
    cell.hidden    = false;
    cell.empty     = false;
    
    cell.width     = 120;
    cell.height    = 25;

    cell.type      = 'dimension';
    cell.axis      = 'column';
    cell.cls       = 'pivot-dim pivot-col-dim';

    cell.noBreak   = false;
    cell.hidden    = typeof hidden === 'undefined' ? 
        !(axisObject.rowSpan || axisObject.colSpan) : hidden;

    if (sort) {
        cell.sort = sort;
        cell.cls += ' td-sortable';
    }
    
    let htmlValue = response.getItemName(cell.id, showHierarchy, true);

    cell.htmlValue = htmlValue;
    cell.title = htmlValue;

    return cell;
};

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

export const DimensionGrandTotalCell = (value, colSpan, rowSpan, sort, generateUuid, hidden=false) => {
    const cell = DefaultCell();

    cell.value   = value;
    cell.type    = 'dimensionTotal';
    cell.cls     = 'pivot-dim-total';

    cell.colSpan = colSpan;
    cell.rowSpan = rowSpan;

    cell.sort    = sort ? 'total' : null;
    cell.uuid    = generateUuid ? uuid() : null;

    cell.htmlValue = value;
    cell.hidden    = hidden;

    return cell;
};

export const DimensionEmptyCell = (colSpan, rowSpan, hidden, style) => {
    const cell = DefaultCell();

    cell.value     = '&nbsp;';
    cell.type      = 'empty';
    cell.cls       = 'pivot-empty';

    cell.colSpan   = colSpan;
    cell.rowSpan   = rowSpan;

    cell.width     = colSpan * 120;
    cell.height    = rowSpan * 25;

    cell.hidden    = hidden;

    cell.style     = style;

    return cell;
};

export const DimensionLabelCell = (value, dim) => {
    const cell = DefaultCell();

    cell.value = value;
    cell.type  = 'labeled';
    cell.cls   = 'pivot-dim-label';

    cell.dim = dim;
    cell.axis = 'row';

    cell.htmlValue = value;

    return cell;
};

export const PaddingCell = (width=0, height=0, colSpan, rowSpan, hidden) => {
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

export const HorizontalPaddingCell = (width=0, cls='', hidden) => {
    const cell = DefaultCell();
    
    if (typeof hidden === 'undefined') {
        hidden = width <= 0;
    }

    cell.value     = '&nbsp;';
    cell.type      = 'padding';
    cell.cls       = 'pivot-padding ';

    cell.cls       += cls;

    cell.width     = width;

    cell.hidden    = hidden;

    return cell;
};

export const VerticalPaddingCell = (height=0, cls='', hidden) => {
    const cell = DefaultCell();
    
    if (typeof hidden === 'undefined') {
        hidden = height <= 0;
    }

    cell.value     = '&nbsp;';
    cell.type      = 'padding';
    cell.cls       = 'pivot-padding ';

    cell.cls       += cls;

    cell.height    = height;

    cell.hidden    = hidden;

    return cell;
};

export const FilterCell = (text, colSpan) => {
    const cell = DefaultCell();

    cell.cls       = 'pivot-filter cursor-default',
    cell.type      = 'filter',
    
    cell.colSpan   = colSpan,
    cell.title     = text,
    cell.htmlValue = text

    return cell;
};