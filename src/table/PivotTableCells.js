import { getRoundedHtmlValue } from './PivotTableUtils';
import uuid from 'd2-utilizr/lib/uuid';

import { VALUE_CELL,
         SUB_TOTAL_CELL,
         TOTAL_CELL,
         DIMENSION_CELL,
         DIMENSION_SUB_TOTAL_CELL,
         DIMENSION_TOTAL_CELL,
         EMPTY_CELL,
         LABELED_CELL,
         PADDING_CELL,
         FILTER_CELL } from '../constants/table/TableCell';

export class TableCell {

    collapsed = false;
    hidden = false;
    empty = false;
    colSpan = 1;
    rowSpan = 1;
    width = 120;
    height = 25;
    style = '';
    
    constructor(config={}) {
        Object.assign(this, config);
    }
}

export class NumberCell extends TableCell {
    constructor(value, displayValue, config) {
        super(config);

        this.value = value;

        this.displayValue = typeof displayValue !== 'string' && typeof displayValue !== 'number'  ?
            '&nbsp;' : getRoundedHtmlValue(displayValue);

        this.title = this.displayValue;
    }
}

export class TextCell extends TableCell {
    constructor(displayValue, config) {
        super(config);

        this.displayValue = typeof displayValue !== 'string' && typeof displayValue !== 'number' ? 
            '&nbsp;' : displayValue;
        this.title = this.displayValue;
    }
}

export class ValueCell extends NumberCell {

    type = VALUE_CELL;
    cls = 'pivot-value pointer';
    
    constructor(value, displayValue, config) {
        super(value, displayValue, config);

        this.uuid = uuid();
    }
}

export class PlainValueCell extends NumberCell {

    type = VALUE_CELL;
    cls = 'pivot-value pointer';
    
    constructor(value, displayValue, config) {
        super(value, displayValue, config);
    }
}

export class SubTotalCell extends NumberCell {
    
    type = SUB_TOTAL_CELL;
    cls = 'pivot-value-subtotal';

    constructor(value, displayValue, config) {
        super(value, displayValue, config);
    }
};

export class TotalCell extends NumberCell {
    
    type = TOTAL_CELL;
    cls = 'pivot-value-total-subgrandtotal';

    constructor(value, displayValue, config) {
        super(value, displayValue, config);
    }
};

export class RowAxisCell extends TextCell {

    type = DIMENSION_CELL;
    cls = 'pivot-dim pivot-row-dim td-nobreak';
    axis = 'row'

    constructor(displayValue, config) {
        super(displayValue, config);

        if (this.showHierarchy) {
            this.csl += ' align-left';
        }
    }
}

export class ColumnAxisCell extends TextCell {

    type = DIMENSION_CELL;
    cls = 'pivot-dim pivot-col-dim';
    axis = 'column'

    constructor(displayValue, config) {
        super(displayValue, config);

        if (this.sort) {
            this.cls += ' td-sortable';
        }
    }
}

export class DimensionSubTotalCell extends TextCell {

    type = DIMENSION_SUB_TOTAL_CELL;
    cls = 'pivot-dim-subtotal';

    constructor(displayValue, config) {
        super(displayValue, config);
    }
}

export class DimensionGrandTotalCell extends TextCell {

    type = DIMENSION_TOTAL_CELL;
    cls = 'pivot-dim-total';

    constructor(value, displayValue, config) {
        super(value, displayValue, config);

        if (this.sortable) {
            this.sort = 'total';
        }

        if (this.generateUuid) {
            this.uuid = uuid();
        }
    }
}

export class DimensionEmptyCell extends TextCell {

    type = EMPTY_CELL;
    cls = 'pivot-empty';

    constructor(config) {
        super('&nbsp;', config);
    }
}

export class DimensionLabelCell extends TextCell {

    type = LABELED_CELL;
    cls = 'pivot-dim-label';
    axis = 'row';

    constructor(displayValue, config) {
        super(displayValue, config);
    }
}

export class PaddingCell extends TableCell {

    type = PADDING_CELL;
    displayValue = '&nbsp;';

    constructor(config) {
        super(config);
    }
}

export class BottomPaddingCell extends PaddingCell {

    cls = 'pivot-padding bottom-padding';
    
    constructor(heightInPixels, config) {
        super(config);

        this.hidden = heightInPixels <= 0;
        this.height = heightInPixels;
    }
}

export class TopPaddingCell extends PaddingCell {

    cls = 'pivot-padding top-padding';

    constructor(heightInPixels, config) {
        super(config);

        this.hidden = heightInPixels <= 0;
        this.height = heightInPixels;
    }
}

export class LeftPaddingCell extends PaddingCell {

    cls = 'pivot-padding left-padding';

    constructor(widthInPixels, config) {
        super(config);

        this.hidden = widthInPixels <= 0;
        this.width = widthInPixels;
    }
}


export class RightPaddingCell extends PaddingCell {

    cls = 'pivot-padding right-padding';

    constructor(widthInPixels, config) {
        super(config);

        this.hidden = widthInPixels <= 0;
        this.width = widthInPixels;
    }
}

export class FilterCell extends TableCell {

    type = FILTER_CELL;
    cls = 'pivot-filter cursor-default';

    constructor(displayValue, colSpan, config) {
        super(config);

        this.displayValue = displayValue;
        this.colSpan = colSpan;
    }
}


// export const PaddingCell = (width=0, height=0, colSpan, rowSpan, hidden) => {
//     const cell = DefaultCell();

//     cell.width     = width;
//     cell.height    = height;

//     cell.colSpan   = colSpan;
//     cell.rowSpan   = rowSpan;

//     cell.hidden    = hidden;

//     return cell;
// };

// export const HorizontalPaddingCell = (width=0, cls='', hidden) => {
//     const cell = DefaultCell();
    
//     if (typeof hidden === 'undefined') {
//         hidden = width <= 0;
//     }

//     cell.value     = '&nbsp;';
//     cell.type      = PADDING_CELL;
//     cell.cls       = 'pivot-padding ';

//     cell.cls       += cls;

//     cell.width     = width;

//     cell.hidden    = hidden;

//     return cell;
// };

// export const VerticalPaddingCell = (height=0, cls='', hidden) => {
//     const cell = DefaultCell();
    
//     if (typeof hidden === 'undefined') {
//         hidden = height <= 0;
//     }

//     cell.value     = '&nbsp;';
//     cell.type      = PADDING_CELL;
//     cell.cls       = 'pivot-padding ';

//     cell.cls       += cls;

//     cell.height    = height;

//     cell.hidden    = hidden;

//     return cell;
// };

// export const FilterCell = (text, colSpan) => {
//     const cell = DefaultCell();

//     cell.cls       = 'pivot-filter cursor-default',
//     cell.type      = FILTER_CELL,
    
//     cell.colSpan   = colSpan,
//     cell.title     = text,
//     cell.htmlValue = text

//     return cell;
// };


// /** @description factory function for cell with default options.
//  *  @returns {object}
//  */
// const DefaultCell = () => {
//     return {
//         htmlValue: '&nbsp;',

//         collapsed: false,
//         hidden:    false,
//         empty:     false,
        
//         colSpan:   1,
//         rowSpan:   1,
        
//         width:     120,
//         height:    25,

//         style: '',
//     };
// };

// export const ValueCell = (value, response, rric, uuids, htmlValue) => {
//     const cell  = DefaultCell();
    
//     cell.uuid       = uuid();
//     cell.uuids      = uuids;

//     cell.value      = value;
//     cell.htmlValue  = value === null || typeof(value) === 'undefined' ? 
//         '&nbsp;' : htmlValue ? 
//             htmlValue : value;
    
//     cell.isValue    = !cell.empty;

//     cell.type       = VALUE_CELL;
//     cell.cls        = 'pivot-value' + (cell.empty ? ' cursor-default' : '');

//     cell.dxId       = rric.getIdByIds(response.metaData.dimensions.dx);
//     cell.peId       = rric.getIdByIds(response.metaData.dimensions.pe);
//     cell.ouId       = rric.getIdByIds(response.metaData.dimensions.ou);

//     return cell;
// };

// export const PlainValueCell = (value, rric, response) => {
//     const cell = DefaultCell();

//     cell.value      = value;
//     cell.type       = VALUE_CELL;
//     cell.cls        = 'pivot-value' + (cell.empty ? ' cursor-default' : ' pointer');

//     cell.htmlValue  = typeof !value ? 
//         '&nbsp;' : value;

//     return cell;
// }

// export const ValueSubTotalCell = (value, htmlValue) => {
//     const cell = DefaultCell();

//     cell.value     = value;
//     cell.type      = SUB_TOTAL_CELL;
//     cell.cls       = 'pivot-value-subtotal';

//     cell.empty     = value === null || typeof(value) === 'undefined';
    
//     if (typeof value === 'string') {
//         cell.htmlValue = value;
//     } else {
//         cell.htmlValue = cell.empty ? 
//             '&nbsp;' : htmlValue ? 
//                 htmlValue : getRoundedHtmlValue(value);
//     }

//     return cell;
// };

// export const ValueTotalCell = (value, htmlValue) => {
//     const cell = DefaultCell();

//     cell.value     = value;
//     cell.type      = TOTAL_CELL;
//     cell.cls       = 'pivot-value-total-subgrandtotal';

//     cell.empty     = value === null || typeof(value) === 'undefined';;

//     if (typeof value === 'string') {
//         cell.htmlValue = value;
//     } else {
//         cell.htmlValue = cell.empty ? 
//             '&nbsp;' : htmlValue ? 
//                 htmlValue : getRoundedHtmlValue(value);
//     }

//     return cell;
// };

// export const RowAxisCell = (axisObject, response, showHierarchy, hidden) => {

//     if (!axisObject) {
//         return null;
//     }

//     const cell = axisObject;

//     cell.collapsed = false;
//     cell.hidden    = false;
//     cell.empty     = false;
//     cell.width     = 120;
//     cell.height    = 25;

//     cell.type      = DIMENSION_CELL;
//     cell.axis      = 'row';
//     cell.cls       = 'pivot-dim pivot-row-dim td-nobreak'

//     if (showHierarchy) {
//         cell.csl += ' align-left';
//     } 

//     cell.noBreak   = true;
//     cell.hidden    = typeof hidden === 'undefined' ? 
//         !(axisObject.rowSpan || axisObject.colSpan) : hidden;

//     let htmlValue = response.getItemName(cell.id, showHierarchy, true);

//     cell.htmlValue = htmlValue;
//     cell.title = htmlValue;

//     return cell;
// };

// export const ColumnAxisCell = (axisObject, response, showHierarchy, sort, hidden) => {

//     if (!axisObject) {
//         return null;
//     }

//     const cell = axisObject;

//     cell.collapsed = false;
//     cell.hidden    = false;
//     cell.empty     = false;
    
//     cell.width     = 120;
//     cell.height    = 25;

//     cell.type      = DIMENSION_CELL;
//     cell.axis      = 'column';
//     cell.cls       = 'pivot-dim pivot-col-dim';

//     cell.noBreak   = false;
//     cell.hidden    = typeof hidden === 'undefined' ? 
//         !(axisObject.rowSpan || axisObject.colSpan) : hidden;

//     if (sort) {
//         cell.sort = sort;
//         cell.cls += ' td-sortable';
//     }
    
//     let htmlValue = response.getItemName(cell.id, showHierarchy, true);

//     cell.htmlValue = htmlValue;
//     cell.title = htmlValue;

//     return cell;
// };

// export const DimensionSubTotalCell = (value, colSpan, rowSpan, empty, hidden) => {
//     const cell = DefaultCell();

//     cell.value     = value;
//     cell.type      = DIMENSION_SUB_TOTAL_CELL;
//     cell.cls       = 'pivot-dim-subtotal';

//     cell.colSpan   = colSpan;
//     cell.rowSpan   = rowSpan;

//     cell.empty     = empty;
//     cell.hidden    = hidden;

//     return cell;
// };

// export const DimensionGrandTotalCell = (value, colSpan, rowSpan, sort, generateUuid, hidden=false) => {
//     const cell = DefaultCell();

//     cell.value   = value;
//     cell.type    = DIMENSION_TOTAL_CELL;
//     cell.cls     = 'pivot-dim-total';

//     cell.colSpan = colSpan;
//     cell.rowSpan = rowSpan;

//     cell.sort    = sort ? 'total' : null;
//     cell.uuid    = generateUuid ? uuid() : null;

//     cell.htmlValue = value;
//     cell.hidden    = hidden;

//     return cell;
// };

// export const DimensionEmptyCell = (colSpan, rowSpan, hidden, style) => {
//     const cell = DefaultCell();

//     cell.value     = '&nbsp;';
//     cell.type      = EMPTY_CELL;
//     cell.cls       = 'pivot-empty';

//     cell.colSpan   = colSpan;
//     cell.rowSpan   = rowSpan;

//     cell.width     = colSpan * 120;
//     cell.height    = rowSpan * 25;

//     cell.hidden    = hidden;

//     cell.style     = style;

//     return cell;
// };

// export const DimensionLabelCell = (value, dim) => {
//     const cell = DefaultCell();

//     cell.value = value;
//     cell.type  = LABELED_CELL;
//     cell.cls   = 'pivot-dim-label';

//     cell.dim = dim;
//     cell.axis = 'row';

//     cell.htmlValue = value;

//     return cell;
// };

// export const PaddingCell = (width=0, height=0, colSpan, rowSpan, hidden) => {
//     const cell = DefaultCell();

//     cell.value     = '&nbsp;';
//     cell.type      = PADDING_CELL;
//     cell.cls       = 'pivot-padding';

//     cell.width     = width;
//     cell.height    = height;

//     cell.colSpan   = colSpan;
//     cell.rowSpan   = rowSpan;

//     cell.hidden    = hidden;

//     return cell;
// };

// export const HorizontalPaddingCell = (width=0, cls='', hidden) => {
//     const cell = DefaultCell();
    
//     if (typeof hidden === 'undefined') {
//         hidden = width <= 0;
//     }

//     cell.value     = '&nbsp;';
//     cell.type      = PADDING_CELL;
//     cell.cls       = 'pivot-padding ';

//     cell.cls       += cls;

//     cell.width     = width;

//     cell.hidden    = hidden;

//     return cell;
// };

// export const VerticalPaddingCell = (height=0, cls='', hidden) => {
//     const cell = DefaultCell();
    
//     if (typeof hidden === 'undefined') {
//         hidden = height <= 0;
//     }

//     cell.value     = '&nbsp;';
//     cell.type      = PADDING_CELL;
//     cell.cls       = 'pivot-padding ';

//     cell.cls       += cls;

//     cell.height    = height;

//     cell.hidden    = hidden;

//     return cell;
// };

// export const FilterCell = (text, colSpan) => {
//     const cell = DefaultCell();

//     cell.cls       = 'pivot-filter cursor-default',
//     cell.type      = FILTER_CELL,
    
//     cell.colSpan   = colSpan,
//     cell.title     = text,
//     cell.htmlValue = text

//     return cell;
// };