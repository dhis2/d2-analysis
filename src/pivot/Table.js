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

import {ResponseRowIdCombination} from '../api/ResponseRowIdCombination';

export var Table;

Table = function(layout, response, colAxis, rowAxis, options) {
    var t = this,
        klass = Table,

        appManager = klass.appManager,
        uiManager = klass.uiManager,
        dimensionConfig = klass.dimensionConfig,
        optionConfig = klass.optionConfig;

    options = options || {};


    // table configurations
    const cellWidth = 120,
          cellHeight = 25;

    // inititalize global variables/functions
    
    // global functions

    console.log(response);

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
        changeToColPercentage,
        changeToRowPercentage,

        // cell creation
        createCell,

        // utils
        getValue,
        roundIf,
        getNumberOfDecimals,
        recursiveReduce,
        getUniqueFactor,
        tableLogger,
        getTableColumnSize,
        getTableRowSize,
        createMatrix,
        createValueMatrix,

    // global variables

        // table info
        previousColumnStart,
        previousColumnEnd,
        previousRowStart,
        previousRowEnd,
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
        valueMatrix,
        typeMatrix,

        // legend set
        legendSet = isObject(layout.legendSet) ? appManager.getLegendSetById(layout.legendSet.id) : null,
        legendDisplayStyle = layout.legendDisplayStyle,

        // utils
        dimensionNameMap = dimensionConfig.getDimensionNameMap(),
        objectNameMap = dimensionConfig.getObjectNameMap(),
        idValueMap = response.getIdValueMap(layout),
        sortableIdObjects = [], //todo
        tdCount = 0;

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

    colUniqueFactor = getUniqueFactor(colAxis);
    rowUniqueFactor = getUniqueFactor(rowAxis);
    columnDimensionNames = colAxis.type ? layout.columns.getDimensionNames(response) : [];
    rowDimensionNames = rowAxis.type ? layout.rows.getDimensionNames(response) : [];

    getRoundedHtmlValue = function(value, dec = 2) {
        return parseFloat(roundIf(value, 2)).toString();
    };

    getTableColumnSize = function() {
        let size = colAxis.size;

        if(doRowSubTotals()) size += colAxis.size / colUniqueFactor;
        if(doRowTotals()) size += 1

        return size;
    }

    getTableRowSize = function() {
        let size = rowAxis.size;

        if(doColSubTotals()) size += rowAxis.size / rowUniqueFactor;
        if(doColTotals()) size += 1

        return size;
    }

    createMatrix = function(x, y) {
        let matrix = new Array(x);
        for(let i = 0; i < x; i++) matrix[i] = new Array(y).fill(0);
        return matrix;
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

    getTdHtml = function(config, metaDataId) {
        var bgColor,
            legends,
            colSpan,
            rowSpan,
            htmlValue,
            displayDensity,
            fontSize,
            isNumeric = isObject(config) && isString(config.type) && config.type.substr(0,5) === 'value' && !config.empty,
            isValue = isNumeric && config.type === 'value',
            cls = '',
            html = '',
            getHtmlValue;

        getHtmlValue = function(config) {
            var str = config.htmlValue,
                n = parseFloat(config.htmlValue);

            if (config.collapsed) {
                return '';
            }

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
        }

        if (!isObject(config)) {
            return '';
        }

        if (config.hidden || config.collapsed) {
            return '';
        }

        // number of cells
        tdCount += 1;

        // background color from legend set
        if (isValue && legendSet) {
            var value = parseFloat(config.value);
            legends = legendSet.legends;

            for (var i = 0; i < legends.length; i++) {
                if (numberConstrain(value, legends[i].startValue, legends[i].endValue) === value) {
                    bgColor = legends[i].color;
                }
            }
        }

        colSpan = config.colSpan ? 'colspan="' + config.colSpan + '" ' : '';
        rowSpan = config.rowSpan ? 'rowspan="' + config.rowSpan + '" ' : '';
        htmlValue = getHtmlValue(config);
        htmlValue = !arrayContains(['dimension', 'filter'], config.type) ? optionConfig.prettyPrint(htmlValue, layout.digitGroupSeparator) : htmlValue;

        cls += config.hidden ? ' td-hidden' : '';
        cls += config.collapsed ? ' td-collapsed' : '';
        cls += isValue ? ' pointer' : '';
        //cls += bgColor ? ' legend' : (config.cls ? ' ' + config.cls : '');
        cls += config.cls ? ' ' + config.cls : '';

        // if sorting
        if (isString(config.sort)) {
            cls += ' td-sortable';

            sortableIdObjects.push({
                id: metaDataId,
                uuid: config.uuid
            });
        }

        html += '<td ' + (config.uuid ? ('id="' + config.uuid + '" ') : '');
        html += ' class="' + cls + '" ' + colSpan + rowSpan;
        html += config.title ? ' title="' + config.title + '" ' : '';

        if (legendDisplayStyle === optionConfig.getLegendDisplayStyle('fill').id) {
            if(bgColor) {
                var rgb = uiManager.hexToRgb(bgColor),
                    color = uiManager.isColorBright(rgb) ? 'black' : 'white';
                html += 'style="' + (config.width ? 'width:' + config.width + 'px!important;' : '') + 
                                    (config.width ? 'min-width:' + config.width + 'px!important;' : '') +
                                    (config.width ? 'max-width:' + config.width + 'px;' : '') +
                                    (config.height ? 'height:' + config.height + 'px!important;' : '') + 
                                    (config.height ? 'min-height:' + config.height + 'px!important;' : '') +
                                    (config.height ? 'max-height:' + config.height + 'px!important;' : '') +
                                    (doDynamicTableUpdate() ? 'overflow: hidden;' : '') +
                                    (doDynamicTableUpdate() ? 'text-overflow: ellipsis;' : '') +
                                    (doDynamicTableUpdate() ? 'white-space: nowrap;' : '') +
                                    (bgColor && isValue ? 'background-color:' + bgColor + '; color: ' + color + '; '  : '') + '">' + htmlValue + '</td>';
            } else {
                html += 'style="' + (config.width ? 'width:' + config.width + 'px!important;' : '') +
                                    (config.width ? 'min-width:' + config.width + 'px!important;' : '') +
                                    (config.width ? 'max-width:' + config.width + 'px;' : '') +
                                    (config.height ? 'height:' + config.height + 'px!important;' : '') + 
                                    (config.height ? 'min-height:' + config.height + 'px!important;' : '') +
                                    (config.height ? 'max-height:' + config.height + 'px!important;' : '') +
                                    (doDynamicTableUpdate() ? 'overflow: hidden;' : '') +
                                    (doDynamicTableUpdate() ? 'text-overflow: ellipsis;' : '') +
                                    (doDynamicTableUpdate() ? 'white-space: nowrap;' : '') +
                                    (bgColor && isValue ? 'background-color:' + bgColor + '; ' : '') + '">' + htmlValue + '</td>';
            }
        }

        if (legendDisplayStyle === optionConfig.getLegendDisplayStyle('text').id) {
            html += 'style="' + (config.width ? 'width:' + config.width + 'px!important;' : '') +
                                (config.width ? 'min-width:' + config.width + 'px!important;' : '') +
                                (config.width ? 'max-width:' + config.width + 'px!important;' : '') +
                                (config.height ? 'height:' + config.height + 'px!important;' : '') + 
                                (config.height ? 'min-height:' + config.height + 'px!important;' : '') +
                                (config.height ? 'max-height:' + config.height + 'px!important;' : '') +
                                (doDynamicTableUpdate() ? 'overflow: hidden;' : '') +
                                (doDynamicTableUpdate() ? 'text-overflow: ellipsis;' : '') +
                                (doDynamicTableUpdate() ? 'white-space: nowrap;' : '') +
                                (bgColor && isValue ? 'color:' + bgColor + '; ' : '') + '">' + htmlValue + '</td>';
        }

        return html;
    };

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

        // return string if
        // - parsefloat(string) is not a number
        // - string is just starting with a number
        // - string is a valid date
        // if (!isNumber(n) || n != str || new Date(str).toString() !== 'Invalid Date') {
        if (!isNumber(n) || n != str) {
            return 0;
        }

        return n;
    };

    roundIf = function(number, precision) {
        number = parseFloat(number);
        precision = parseFloat(precision);

        if (isNumber(number) && isNumber(precision)) {
            var numberOfDecimals = getNumberOfDecimals(number);
            return numberOfDecimals > precision ? numberToFixed(number, precision) : number;
        }

        return number;
    };

    getNumberOfDecimals = function(number) {
        var str = new String(number);
        return (str.indexOf('.') > -1) ? (str.length - str.indexOf('.') - 1) : 0;
    };

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

    //TODO: have all cell creation go through this function
    createCell = function(value, cls, type, {collapsed=false, hidden=false, empty=false, colSpan=1, rowSpan=1, generateUuid=false, numeric=false, title, width, height, sort, noBreak, dxId, uuids, htmlValue}) {
            var cell = {}

            cell.uuid = generateUuid ? uuid() : null;

            if(numeric) value = Math.max(0, value);

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

    hideEmptyColumns = function(valueTable, axisObjects) {
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

    hideEmptyRows = function(valueTable, axisObjects) {
        for(var i = 0, dimLeaf; i < valueTable.rows.length; i++) {
            if(valueTable.rows[i].isEmpty) {
                for(var j = 0; j < valueTable.rows[i].values.length; j++) {
                    valueTable.rows[i].values[j].collapsed = true;
                }
                dimLeaf = axisObjects[i][rowAxis.dims-1];
                if (dimLeaf) {
                    recursiveReduce(dimLeaf);
                    axisObjects[i][0].collapsed = true;
                }
            }
        }
    }

    changeToColPercentage = function(table) {
        for(var i = 0; i < table.length; i++) {
            for (var j = 0; j < table[i].length; j++) {
                if(!table[i][j].empty) {
                    table[i][j].htmlValue = getRoundedHtmlValue((table[i][j].value / valueMatrix[getTableRowSize() - 1][j]) * 100) + '%';
                }
            }
        }
    }

    changeToRowPercentage = function(table) {
        for(var i = 0; i < table.length; i++) {
            for (var j = 0; j < table[i].length; j++) {
                if(!table[i][j].empty) {
                    table[i][j].htmlValue = getRoundedHtmlValue((table[i][j].value / valueMatrix[i][getTableColumnSize() - 1]) * 100) + '%';
                }    
            }
        }
    }

    const getValueCell = function(x, y) {

        let cell = null,
            value = valueMatrix[y][x];

        switch(typeMatrix[y][x]) {
            case 0: {
                let rric = new ResponseRowIdCombination(),
                    uuids = [],
                    rowPos = doColSubTotals() ? y - Math.floor(y / rowUniqueFactor) : y,
                    colPos = doRowSubTotals() ? x - Math.floor(x / colUniqueFactor) : x;
                
                rric.add(colAxis.type ? colAxis.ids[colPos] : '');
                rric.add(rowAxis.type ? rowAxis.ids[rowPos] : '');

                if (colAxis.type) {
                    uuids = uuids.concat(colAxis.objects.all[colAxis.dims - 1][colPos].uuids);
                }
                if (rowAxis.type) {
                    uuids = uuids.concat(rowAxis.objects.all[rowAxis.dims - 1][rowPos].uuids);
                }

                cell = createCell(value, 'pivot-value', 'value', {generateUuid: true, uuids: uuids, empty: value < 0, dxId: rric.getDxIdByIds(response.metaData.dx), numeric: true});

                uuidDimUuidsMap[cell.uuid] = uuids;
            } break;
            
            // column sub total cell
            case 1: {
                cell = createCell(value, 'pivot-value-subtotal', 'valueSubtotal', {empty: valueMatrix[y, x] === 0, numeric: true});
            } break;

            // row sub total cell
            case 2: {
                cell = createCell(value, 'pivot-value-subtotal', 'valueSubtotal', {empty: valueMatrix[y, x] === 0, numeric: true});
            } break;
            
            // intersection sub total cell
            case 3: {
                cell = createCell(value, 'pivot-value-subtotal', 'valueSubtotal', {empty: valueMatrix[y, x] === 0, numeric: true});
            } break;

            // column total cell
            case 4: {
                cell = createCell(value, 'pivot-value-total-subgrandtotal', 'valueTotalSubgrandtotal', {empty: valueMatrix[y, x] === 0, numeric: true});
            } break;

            // row total cell
            case 5: {
                cell = createCell(value, 'pivot-value-total-subgrandtotal', 'valueTotalSubgrandtotal', {empty: valueMatrix[y, x] === 0, numeric: true});
            } break;

            // intersection total cell
            case 6: {
                cell = createCell(value, 'pivot-value-total-subgrandtotal', 'valueTotalSubgrandtotal', {empty: valueMatrix[y, x] === 0, numeric: true});
            } break;
        }

        return cell;
    }

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
    
    // return getRowAxisObjectArray(rowPosition, rowPosition, columnPosition);
    getRowAxisObjectArray = function(rowStart=0, rowEnd, columnStart=0, columnEnd) {
        
        rowStart = Math.max(0, rowStart - colAxis.dims);
        
        // initiate axis array
        const rowAxisArray = new Array(rowEnd - rowStart),
              maxRowSpan = rowEnd - rowStart;

        if(!rowAxis.type) {
            if (layout.showDimensionLabels) {
                rowAxisArray[0] = [{ type: 'transparent', cls: 'pivot-transparent-row' }];
            }
            return rowAxisArray;
        }

        for (var i = 0, y = rowStart; i < rowAxisArray.length; i++, y++) {
            rowAxisArray[i] = new Array(rowAxis.dims - Math.min(columnStart, rowAxis.dims));
            for (var j = 0, x = columnStart, rowSpanCounter = 0, obj, rowPos; j < rowAxisArray[i].length; j++, x++) {

                if(doColSubTotals() && (y + 1) % (rowUniqueFactor + 1) === 0) {
                    if (j === 0) rowAxisArray[i][j] = createCell('&nbsp;', 'pivot-dim-subtotal', 'dimensionSubtotal', {colSpan: rowAxis.dims - x, empty: true}); 
                    else         rowAxisArray[i][j] = createCell(null, 'pivot-dim-subtotal', 'dimensionSubtotal', {colSpan: rowAxis.dims - x, hidden: true});
                    rowSpanCounter++;
                    continue;
                }

                if(doColTotals() && y === getTableRowSize() - 1) {
                    if (j === 0) rowAxisArray[i][j] = createCell('Total', 'pivot-dim-total', 'dimensionSubtotal', {colSpan: rowAxis.dims - x});
                    else         rowAxisArray[i][j] = createCell(null, 'pivot-dim-subtotal', 'dimensionSubtotal', {colSpan: rowAxis.dims - x, hidden: true})
                    continue;
                }

                rowPos = doColSubTotals() ? y - Math.floor(y / (rowUniqueFactor + 1)) : y;

                // TODO: Find a better way without clone
                obj = clone(rowAxis.objects.all[x][rowPos]);
                obj.type = 'dimension';
                obj.cls = 'pivot-dim td-nobreak' + (layout.showHierarchy ? ' align-left' : '');
                obj.noBreak = true;
                obj.width = doDynamicTableUpdate() ? cellWidth : null,
                obj.height = doDynamicTableUpdate() ? cellHeight : null,
                obj.htmlValue = response.getItemName(obj.id, layout.showHierarchy, true);
                obj.hidden = !(obj.rowSpan || obj.colSpan);

                if(obj.hidden && y === rowStart) {
                    obj.hidden = false;
                    obj.rowSpan = obj.oldestSibling.rowSpan - ((doColSubTotals() ? y - Math.floor(y / (rowUniqueFactor + 1)) : y) % obj.oldestSibling.rowSpan);
                }

                if(obj.rowSpan && rowSpanCounter + obj.rowSpan > maxRowSpan && !obj.hidden) {
                    obj.rowSpan = Math.max(maxRowSpan - rowSpanCounter, 1);
                }

                if(rowSpanCounter !== maxRowSpan && !obj.hidden) {
                    rowSpanCounter += obj.rowSpan ? obj.rowSpan : 0;
                }

                rowAxisArray[i][j] = obj;
            }
        }
        return rowAxisArray;
    }

    getColAxisObjectArray = function(columnStart=0, columnEnd, rowStart=0, maxColSpan) {
        if (!colAxis.type) return getDimensionColArray();

        const colAxisArray = new Array(colAxis.dims - Math.min(rowStart, colAxis.dims));

        maxColSpan = maxColSpan ? maxColSpan : columnEnd - columnStart + rowAxis.dims;

        for (var i = 0, y = rowStart; i < colAxisArray.length; i++, y++) {;

            colAxisArray[i] = new Array(columnStart < rowAxis.dims ? columnEnd + (rowAxis.dims - columnStart) : columnEnd + rowAxis.dims - columnStart);

            // if (layout.showDimensionLabels && columnStart === 0) {
            //     colAxisArray[i] = colAxisArray[i].concat(getEmptyHtmlArray(i));
            // }
            
            for (var j = 0, x = columnStart, colSpanCounter = 0, colPos, obj; j < colAxisArray[i].length; j++, x++) {

                // create left corner cell
                if(x < rowAxis.dims) {
                    if (i === 0) colAxisArray[i][j] = createCell('&nbsp;', 'pivot-empty', 'empty', {colSpan: rowAxis.dims - x, rowSpan: colAxis.dims - y, hidden: x !== columnStart});
                    else         colAxisArray[i][j] = createCell(null, 'pivot-empty', 'empty', {hidden: true, colSpan: rowAxis.dims, rowSpan: colAxis.dims - x});
                    colSpanCounter++;
                    continue;
                }

                // create sub row total space cell
                if(doRowSubTotals() && (Math.max(0, x - rowAxis.dims) + 1) % (colUniqueFactor + 1) === 0) {
                    if (i === 0) colAxisArray[i][j] = createCell('&nbsp;', 'pivot-dim-subtotal', 'dimensionSubtotal', {rowSpan: colAxis.dims- y, empty: true});
                    else         colAxisArray[i][j] = createCell('&nbsp;', 'pivot-dim-subtotal', 'dimensionSubtotal', {rowSpan: colAxis.dims - i, empty: true, hidden: true});
                    colSpanCounter++;
                    continue;
                }

                // cereate total row space cell
                if(doRowTotals() && Math.max(0, x - rowAxis.dims) === getTableColumnSize() - 1) {
                    if (i === 0) colAxisArray[i][j] = createCell('Total', 'pivot-dim-total', 'dimensionTotal', {sort: doSortableColumnHeaders() ? 'total' : null, rowSpan: colAxis.dims - y, generateUuid: true});
                    else         colAxisArray[i][j] = createCell(null, 'pivot-dim-subtotal cursor-default', 'dimensionSubtotal', {hidden: true});
                    continue;
                }

                colPos = doRowSubTotals() ? Math.max(0, x - rowAxis.dims) - Math.floor(Math.max(0, x - rowAxis.dims) / (colUniqueFactor + 1)) : Math.max(0, x - rowAxis.dims);
                
                obj = clone(colAxis.objects.all[y][colPos]);
                obj.type = 'dimension';
                obj.cls = 'pivot-dim';
                obj.sort = doSortableColumnHeaders() && y === colAxis.dims - 1 ? colAxis.ids[colPos] : null; 
                obj.noBreak = false;
                obj.hidden = !(obj.rowSpan || obj.colSpan);
                obj.width = doDynamicTableUpdate() ? cellWidth : null,
                obj.height = doDynamicTableUpdate() ? cellHeight : null,
                obj.htmlValue = response.getItemName(obj.id, layout.showHierarchy, true);

                if(obj.hidden && Math.max(0, x - rowAxis.dims) === Math.max(0, columnStart - rowAxis.dims)) {
                    obj.hidden = false;
                    obj.colSpan = obj.oldestSibling.colSpan - (Math.max(0, x - rowAxis.dims) % obj.oldestSibling.colSpan);
                }

                if(colSpanCounter === maxColSpan) obj.hidden = true;

                if(obj.colSpan && colSpanCounter + obj.colSpan > maxColSpan && !obj.hidden) {
                    obj.colSpan = Math.max(maxColSpan - colSpanCounter, 1);
                }

                if(colSpanCounter !== maxColSpan && !obj.hidden) {
                    colSpanCounter += obj.colSpan ? obj.colSpan : 0;
                }

                colAxisArray[i][j] = obj;
            }
        }
        return colAxisArray;
    };

    createValueMatrix = function(rows, columns) {

        const matrix = createMatrix(rows, columns);
        typeMatrix = createMatrix(rows, columns);

        for (var i = 0, rowShift=0; i < rowAxis.size; i++) {
            for (var j = 0, columnShift=0, rric, empty, value, responseValue; j < colAxis.size; j++) {

                empty = false;

                rric = new ResponseRowIdCombination();
                rric.add(colAxis.type ? colAxis.ids[j] : '');
                rric.add(rowAxis.type ? rowAxis.ids[i] : '');

                responseValue = idValueMap[rric.get()];

                if (isDefined(responseValue)) {
                    value = getValue(responseValue);
                } else {
                    value = 0;
                    empty = true;
                }
                
                if (doColSubTotals() && i % rowUniqueFactor === 0 && i !== 0 && j === 0) rowShift += 1;
                if (doRowSubTotals() && j % colUniqueFactor === 0 && j !== 0) columnShift += 1;

                if(doColSubTotals() && doRowSubTotals()) {
                    matrix[i + rowShift + (rowUniqueFactor - (i % rowUniqueFactor))][j + columnShift + (colUniqueFactor - (j % colUniqueFactor))] += value;
                    typeMatrix[i + rowShift + (rowUniqueFactor - (i % rowUniqueFactor))][j + columnShift + (colUniqueFactor - (j % colUniqueFactor))] = 3;
                }

                if(doColSubTotals()) {
                    matrix[i + rowShift + (rowUniqueFactor - (i % rowUniqueFactor))][j + columnShift] += value;
                    typeMatrix[i + rowShift + (rowUniqueFactor - (i % rowUniqueFactor))][j + columnShift] = 1;
                    if (doRowTotals()) {
                        matrix[i + rowShift + (rowUniqueFactor - (i % rowUniqueFactor))][getTableColumnSize() - 1] += value;
                        typeMatrix[i + rowShift + (rowUniqueFactor - (i % rowUniqueFactor))][getTableColumnSize() - 1] = 4;
                    }
                }

                if(doRowSubTotals()) {
                    matrix[i + rowShift][j + columnShift + (colUniqueFactor - (j % colUniqueFactor))] += value;
                    typeMatrix[i + rowShift][j + columnShift + (colUniqueFactor - (j % colUniqueFactor))] = 2;
                    if (doRowTotals()) {
                        matrix[getTableRowSize() - 1][j + columnShift + (colUniqueFactor - (j % colUniqueFactor))] += value;
                        typeMatrix[getTableRowSize() - 1][j + columnShift + (colUniqueFactor - (j % colUniqueFactor))] = 5;
                    }
                }

                if(doRowTotals() && doColTotals()) {
                    matrix[getTableRowSize() - 1][ getTableColumnSize() - 1] += value;
                    typeMatrix[getTableRowSize() - 1][ getTableColumnSize() - 1] = 6;
                }

                if(doRowTotals()) {
                    matrix[getTableRowSize() - 1][j + columnShift] += value;
                    typeMatrix[getTableRowSize() - 1][j + columnShift] = 5;
                }

                if(doColTotals()) {
                    matrix[i + rowShift][getTableColumnSize() - 1] += value;
                    typeMatrix[i + rowShift][getTableColumnSize() - 1] = 4;
                }

                matrix[i + rowShift][j + columnShift] = empty ? -1 : value;
                typeMatrix[i + rowShift][j + columnShift] = 0;
            }
        }
        return matrix;
    }

    getValueObjectArray = function(columnStart = 0, rowStart = 0, columnEnd, rowEnd) {

        rowStart = Math.max(0, rowStart - colAxis.dims);
        columnStart = Math.max(0, columnStart - rowAxis.dims);

        const table = new Array(rowEnd - rowStart);
        for (var i = 0, y = rowStart; i < table.length; i++, y++) {
            table[i] = new Array(columnEnd - columnStart);
            for (var j = 0, x = columnStart, value, cell, totalIdComb; j < table[i].length; j++, x++) {

                if (doSortableColumnHeaders()) {
                    totalIdComb = new ResponseRowIdCombination(['total', rowAxis.ids[y]]);
                    // idValueMap[totalIdComb.get()] = false ? null : cellCounter['totalRowAllCells' + x];
                }

                table[i][j] = getValueCell(x, y);
            }
        }

        // do row percentages
        if(doRowPercentage()) {
            changeToRowPercentage(table);
        }

        // do column percentages
        if(doColPercentage()) {
            changeToColPercentage(table);
        }

        // // hide empty columns
        // if(doHideEmptyColumns()) {
        //     hideEmptyColumns(table, colAxisAllObjects);
        // }

        // // hide empty rows
        // if(doHideEmptyRows()) {
        //     hideEmptyRows(table, rowAxisAllObjects);
        // }

        return table;
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
        if (!layout.filters) {
            return;
        }

        var text = layout.filters.getRecordNames(false, layout.getResponse(), true),
            row = [];

        row.push(getTdHtml({
            type: 'filter',
            cls: 'pivot-filter cursor-default',
            colSpan: getTopBarSpan(span),
            title: text,
            htmlValue: text
        }));

        return [row];
    };

    getTitle = function(span) {
        if (!layout.title) {
            return;
        }

        var text = layout.title, row = [];

        row.push(getTdHtml({
            type: 'filter',
            cls: 'pivot-filter cursor-default',
            colSpan: getTopBarSpan(span),
            title: text,
            htmlValue: text,
        }));

        return [row];
    };

    combineTable = function(rowAxisComb, colAxisComb, values) {
        const table = [];
        for (let i = 0; i < values.length; i++) {
            table.push(rowAxisComb[i].concat(values[i]));
        }
        return colAxisComb.concat(table);
    };

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

    const getSingleRowAxisRow = function(y, columnStart) {
        const row = [];
        for(var i = 0, x = columnStart, rowPos, obj; x < rowAxis.dims; i++, x++) {
            
            if(doColSubTotals() && (y + 1) % (rowUniqueFactor + 1) === 0) {
                if (i === 0) row.push(createCell('&nbsp;', 'pivot-dim-subtotal', 'dimensionSubtotal', {colSpan: rowAxis.dims - x, empty: true})); 
                else         row.push(createCell(null, 'pivot-dim-subtotal', 'dimensionSubtotal', {colSpan: rowAxis.dims - x, hidden: true}));
                continue;
            }

            if(doColTotals() && y === getTableRowSize() - 1) {
                if (i === 0) row.push(createCell('Total', 'pivot-dim-total', 'dimensionSubtotal', {colSpan: rowAxis.dims - x}));
                else         row.push(createCell(null, 'pivot-dim-subtotal', 'dimensionSubtotal', {colSpan: rowAxis.dims - x, hidden: true}))
                continue;
            }

            rowPos = doColSubTotals() ? y - Math.floor(y / (rowUniqueFactor + 1)) : y;
            obj = clone(rowAxis.objects.all[x][rowPos]);
            obj.type = 'dimension';
            obj.cls = 'pivot-dim td-nobreak' + (layout.showHierarchy ? ' align-left' : '');
            obj.noBreak = true;
            obj.width = doDynamicTableUpdate() ? cellWidth : null,
            obj.height = doDynamicTableUpdate() ? cellHeight : null,
            obj.htmlValue = response.getItemName(obj.id, layout.showHierarchy, true);
            obj.hidden = !(obj.rowSpan || obj.colSpan);
            row.push(obj);
        }
        return row;
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

    const getTableRenderWidth = function() {
        return Math.floor(document.body.clientWidth / cellWidth);
    }

    const getTableRenderHeight = function() {
        return Math.floor(document.body.clientHeight / cellHeight);
    }

    const buildTable = function(columnStart, columnEnd, rowStart, rowEnd) {
        return combineTable(
            getRowAxisObjectArray(rowStart, rowEnd, columnStart),
            getColAxisObjectArray(columnStart, columnEnd, rowStart),
            getValueObjectArray(columnStart, rowStart, columnEnd, rowEnd)
        );
    }

    const getColumnAxisColumn = function(rowPosition, columnPosition) {
        return getColAxisObjectArray(columnPosition, columnPosition - 1, rowPosition);
    }

    const getValueObjectRow = function(rowPosition, columnPosition, size) {
        const row = new Array(size);
        for(let i=0, x=columnPosition ; i < row.length; i++, x++) {
            row[i] = getValueCell(x, rowPosition);
        }
        return row;
    }

    const getValueObjectColumn = function(rowPosition, columnPosition, size) {
        const column = new Array(size);
        for(let i=0, y=rowPosition ; i < column.length; i++, y++) {
            column[i] = [getValueCell(columnPosition, y)];
        }
        return column;
    }

    const deleteRow = function(table, index) {
        table.splice(index, 1);
    }

    const deleteColumn = function(table, index) {
        for(var i = 0; i < table.length; i++) {
            table[i].splice(index, 1);
        }
    }

    const insertRow = function(table, item, index) {
        table.splice(index, 0, item);
    }

    const insertColumn = function(table, item, index) {
        for(var i = 0; i < table.length; i++) {
            if(item[i]) table[i].splice(index, 0, item[i][0]);
        }
    }

    //TODO: Implement helper functions
    const appendColumn      = function() {};
    const prependColumn     = function() { };
    const appendRow         = function() { };
    const preprendRow       = function() { };

    const getTableRow = function(columnStart, columnEnd, rowStart) {
        if (rowStart < colAxis.dims) return getColAxisObjectArray(columnStart, columnEnd, rowStart)[0];
        const row = [];
        if (columnStart < rowAxis.dims) row.concat(getSingleRowAxisRow(rowStart, columnStart));
        return row.concat(getValueObjectRow(currentRowStart - rowAxis.dims, 0, currentColumnEnd));
    };

    const getTableColumn = function(columnStart, columnEnd, rowStart, rowEnd) {
        if (colStart < rowAxis.dims) return getColAxisObjectArray(columnStart, columnEnd, rowStart)[0];
        const column = [];
        if (rowStart < colAxis.dims) column.concat()
        return column.concat();
    };


    const updateTable = function(currentColumnStart, currentColumnEnd, currentRowStart, currentRowEnd) {

        if(currentColumnStart === 0) for(var i = 0; i < table[1].length; i++) table[i][0].hidden = true;
        if(currentRowStart === 0) currentTable[0][0].hidden = true;

        // row axis column comes into view from the left
        if(previousColumnStart > currentColumnStart && currentColumnStart < colAxis.dims) {
            insertColumn(
                currentTable,
                getColAxisObjectArray(currentColumnStart, 0, currentRowStart).concat(getRowAxisObjectArray(currentRowStart, currentRowEnd, currentColumnStart)),
                tableColStart
            );
        }

        // column goes out of view from the right
        if(previousColumnEnd > currentColumnEnd) {
            deleteColumn(currentTable, tableColEnd);
        }

        // value column comes into view from the left
        if(previousColumnStart > currentColumnStart  && currentColumnStart >= colAxis.dims) {
            insertColumn(
                currentTable,
                getColumnAxisColumn(currentRowStart, currentColumnStart).concat(getValueObjectColumn(Math.max(0, currentRowStart - colAxis.dims), Math.max(currentColumnEnd - rowAxis.dims), currentRowEnd - Math.max(0, currentRowStart - colAxis.dims))),
                tableColStart
            );
        }

        // column goes out of view from the left
        if(previousColumnStart < currentColumnStart) {
            deleteColumn(currentTable, tableColStart);
        } 

        // value column comes into view from the right
        if(previousColumnEnd < currentColumnEnd) {
            insertColumn(
                currentTable,
                getColumnAxisColumn(currentRowStart, currentColumnEnd).concat(getValueObjectColumn(Math.max(0, currentRowStart - colAxis.dims), Math.max(currentColumnEnd - rowAxis.dims), currentRowEnd - Math.max(0, currentRowStart - colAxis.dims))),
                tableColEnd
            );
        }

        // ROWS 

        // column axis row comes into view from the top
        if(previousRowStart > currentRowStart && currentRowStart < colAxis.dims) {
            insertRow(
                currentTable,
                getTableRow(currentColumnStart, currentColumnEnd, currentRowStart),
                tableRowStart
            );
        }

        // row goes out of view from the bottom
        if(previousRowEnd > currentRowEnd) {
            deleteRow(currentTable, tableRowEnd);
        }

        // value row comes into view from the top
        if(previousRowStart > currentRowStart && currentRowStart >= colAxis.dims) {
            insertRow(
                currentTable,
                getSingleRowAxisRow(Math.max(currentRowStart - colAxis.dims), currentColumnStart).concat(getValueObjectRow(currentRowStart - rowAxis.dims, 0, currentColumnEnd)),
                tableRowStart
            );
        }

        // row goues of out of view from the top
        if(previousRowStart < currentRowStart) {
            deleteRow(currentTable, tableRowStart);
        }

        // row comes into view from the bottom
        if(previousRowEnd < currentRowEnd) {
            insertRow(
                currentTable,
                getSingleRowAxisRow(Math.max(0, currentRowEnd - colAxis.dims), currentColumnStart).concat(getValueObjectRow(Math.max(0, currentRowEnd - colAxis.dims), 0, currentColumnEnd - Math.max(0, currentColumnStart - rowAxis.dims))),
                tableRowEnd
            );
        }

        previousRowStart = currentRowStart;
        previousRowEnd = currentRowEnd;
        previousColumnStart = currentColumnStart;
        previousColumnEnd = currentColumnEnd;
    }

    renderTable = function(rowStart=0, colStart=0) {

            // declare end cells
        let rowEnd = Math.min(getTableRenderHeight() + rowStart, getTableRowSize()),
            colEnd = Math.min(getTableRenderWidth() + colStart, getTableColumnSize()),

            // declare padding to simulate scroll
            topPad = rowStart * cellHeight,
            botPad = (getTableRowSize() - rowEnd) * cellHeight,
            rightPad = (colAxis.size - colEnd) * cellWidth,
            leftPad = colStart * cellWidth,

            // build table
            table = buildTable(colStart, colEnd, rowStart, rowEnd);

        // loop through each row of table
        for(let i = 0; i < table.length; i++) {

            // add left pad to table to start of array
            if(colStart > 0) {
                table[i].unshift(createCell(null, 'pivot-padding', 'padding', {width: leftPad}));
            }

            // add right pad to table to end of array
            if(rightPad > 0) {
                table[i].push(createCell(null, 'pivot-padding', 'padding', {width: rightPad}));
            }
        }

        // add top pad to table to start of array
        if(rowStart > 0) {
            table.unshift([createCell(null, 'pivot-padding', 'padding', {height: topPad, colSpan: (colEnd - colStart) + 1})]);
        }

        // add bottom pad to table to end of array
        if(botPad > 0) {
            table.push([createCell(null, 'pivot-padding', 'padding', {height: botPad, colSpan: (colEnd - colStart) + 1})]);
        }

        // create html array
        var htmlArray = arrayClean([].concat(
            // options.skipTitle ? [] : getTitle(table[0].length) || [],
            // getFilterHtmlArray(table[0].length) || [],
            getTableHtml(table)
        ));

        // turn html array into html string;
        return getHtml(htmlArray);
    };

    // get html
    (function() {
        valueMatrix = createValueMatrix(getTableRowSize(), getTableColumnSize());
    }());
    
    // constructor
    t.dynamic = doDynamicTableUpdate();
    t.update =  updateTable;
    t.render = renderTable;
    t.uuidDimUuidsMap = uuidDimUuidsMap;
    t.sortableIdObjects = sortableIdObjects;
    t.idValueMap = idValueMap;
    t.tdCount = tdCount;
    t.layout = layout;
    t.response = response;
    t.colAxis = colAxis;
    t.rowAxis = rowAxis;
};

Table.prototype.getUuidObjectMap = function() {
    return objectApplyIf((this.colAxis ? this.colAxis.uuidObjectMap || {} : {}), (this.rowAxis ? this.rowAxis.uuidObjectMap || {} : {}));
};
