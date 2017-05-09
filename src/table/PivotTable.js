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

export var PivotTable;

PivotTable = function(refs, layout, response, colAxis, rowAxis, options = {}) {
    var t = this;

    var { appManager, uiManager, dimensionConfig, optionConfig } = refs;

    var { ResponseRowIdCombination } = refs.api;

    var { unclickable } = options;

    options = options || {};

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
        resizeRow,
        addColumn,
        compressTable,

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

    // global variables

        // table holders
        valueTable = { rows: [], columns: [], total: 0 },
        completeTableObjects,
        valueAllObjects = [],

        // row axis
        rowAxisAllObjects = [],
        rowUniqueFactor,
        rowDimensionNames,

        // col axis
        colAxisAllObjects = [],
        columnDimensionNames,
        colUniqueFactor,

        // uid
        uuidDimUuidsMap = {},

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

        //if (bgColor && isValue) {
            //html += 'style="color:' + bgColor + ';padding:' + displayDensity + '; font-size:' + fontSize + ';"' + '>' + htmlValue + '</td>';
            //html += '>';
            //html += '<div class="legendCt">';
            //html += '<div class="number ' + config.cls + '" style="padding:' + displayDensity + '; padding-right:3px; font-size:' + fontSize + '">' + htmlValue + '</div>';
            //html += '<div class="arrowCt ' + config.cls + '">';
            //html += '<div class="arrow" style="border-bottom:8px solid transparent; border-right:8px solid ' + bgColor + '">&nbsp;</div>';
            //html += '</div></div></div></td>';
        //}
        //else {
        //    html += 'style="' + (bgColor && isValue ? 'color:' + bgColor + '; ' : '') + '">' + htmlValue + '</td>';
        //}

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

    // TODO: rename to something more usefull
    addColumn = function(position, total, empty) {
        if(!valueTable.columns[position]) {
            valueTable.columns.push({ values: [], total: 0, empty: 0 });
        }
        valueTable.columns[position].total += total;
        valueTable.columns[position].isEmpty = empty;
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
        return false;
    }

    //TODO: have all cell creation go through this function
    createCell = function(value, cls, type, {collapsed=false, hidden=false, empty=false, colSpan=1, rowSpan=1, generateUuid=false, numeric=false, _uuid, title, width, height, sort, noBreak, dxId, uuids, htmlValue}) {
            var cell = {}

            cell.uuid = _uuid || generateUuid ? uuid() : null;

            cell.cls = cls;
            cell.value = value ? value : '';
            cell.cls += (empty ? ' cursor-default' : '');
            cell.colSpan = colSpan;
            cell.rowSpan = rowSpan;
            cell.empty = empty;
            cell.hidden = hidden;
            cell.type = type;

            cell.width = width ?  width : doDynamicTableUpdate() ? cellWidth : null;
            cell.height = height ? height : doDynamicTableUpdate() ? cellheight : null;
            
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
                console.log(dimLeaf);
                if (dimLeaf) {
                    recursiveReduce(dimLeaf);
                    // axisObjects[i][0].collapsed = true;
                }
            }
        }
    }

    changeToColPercentage = function(valueTable) {
        for(var i = 0; i < valueTable.rows.length; i++) {
            for (var j = 0; j < valueTable.rows[i].values.length; j++) {
                if(!valueTable.rows[i].values[j].empty) {
                    valueTable.rows[i].values[j].htmlValue = getRoundedHtmlValue((valueTable.rows[i].values[j].value / valueTable.columns[j].total) * 100) + '%';
                }
                
            }
        }
    }

    changeToRowPercentage = function(valueTable) {
        for(var i = 0; i < valueTable.rows.length; i++) {
            for (var j = 0; j < valueTable.rows[i].values.length; j++) {
                if(!valueTable.rows[i].values[j].empty) {
                    valueTable.rows[i].values[j].htmlValue = getRoundedHtmlValue((valueTable.rows[i].values[j].value / valueTable.rows[i].total) * 100) + '%';
                }    
            }
        }
    }

    compressTable = function(valueTable) {
        const valueObjects = [];
        for(var i = 0; i < valueTable.rows.length; i++) {
            for(var j = 0, valueRow = []; j < valueTable.rows[i].values.length; j++) {
                valueRow.push(valueTable.rows[i].values[j]);
            }
            valueObjects.push(valueRow);
        }
        return valueObjects;
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

    getRowAxisObjectArray = function() {
        const rowAxisArray = [];

        // dimension
        if (rowAxis.type) {
            for (var i = 0, row; i < rowAxis.size; i++) {
                row = [];

                for (var j = 0, obj, newObj; j < rowAxis.dims; j++) {
                    obj = rowAxis.objects.all[j][i];
                    obj.type = 'dimension';
                    obj.cls = 'pivot-dim td-nobreak' + (layout.showHierarchy ? ' align-left' : '');
                    obj.noBreak = true;
                    obj.width = doDynamicTableUpdate() ? 120 : null,
                    obj.height = doDynamicTableUpdate() ? 25 : null,
                    obj.hidden = !(obj.rowSpan || obj.colSpan);
                    obj.htmlValue = response.getItemName(obj.id, layout.showHierarchy, true);

                    row.push(obj);
                }

                rowAxisArray.push(row);

                if(doColSubTotals() && (i + 1) % rowUniqueFactor === 0) {
                    var axisRow = [];
                    axisRow.push(createCell('&nbsp;', 'pivot-dim-subtotal', 'dimensionSubtotal', {colSpan: rowAxis.dims, empty: true}));

                    for(var j = 1; j < rowAxis.dims; j++) {
                        axisRow.push(createCell(null, 'pivot-dim-subtotal', 'dimensionSubtotal', {colSpan: rowAxis.dims - j, hidden: true}));
                    }
                    
                    rowAxisArray.push(axisRow);
                }

                if(doColTotals() && i === rowAxis.size - 1) {
                    var axisRow = [];
                    axisRow.push(createCell('Total', 'pivot-dim-total', 'dimensionSubtotal', {colSpan: rowAxis.dims, empty: true}));
                    for(var j = 1; j < rowAxis.dims; j++) {
                        axisRow.push(createCell(null, 'pivot-dim-subtotal', 'dimensionSubtotal', {colSpan: rowAxis.dims - j, hidden: true}));
                    }
                    rowAxisArray.push(axisRow);
                }
            }
        }
        else {
            if (layout.showDimensionLabels) {
                rowAxisArray.push([{
                    type: 'transparent',
                    cls: 'pivot-transparent-row'
                }]);
            }
        }

        return rowAxisArray;
    }

    getColAxisObjectArray = function() {
        var colAxisArray = []
        if (!colAxis.type) {
            // show row dimension labels
            if (rowAxis.type && layout.showDimensionLabels) {
                colAxisArray.push([]);
                // colAxisArray from row object names
                for (var i = 0; i < rowDimensionNames.length; i++) {
                    colAxisArray[i].push(createCell(response.getNameById(rowDimensionNames[i]), 'pivot-dim-label', 'empty',  {}));
                }
            }
            return colAxisArray;
        }

        // for each col dimension
        for (var i = 0; i < colAxis.dims; i++) {
            colAxisArray.push([]);

            if (layout.showDimensionLabels) {
                colAxisArray[i] = colAxisArray[i].concat(getEmptyHtmlArray(i))
            }
            
            else if (colAxis.type && rowAxis.type) {
                if(i === 0) {
                    colAxisArray[i].push(createCell('&nbsp;', 'pivot-empty', 'empty', {colSpan: rowAxis.dims, rowSpan: colAxis.dims}));
                    for (var j = 0; j < rowAxis.dims - 1; j++) colAxisArray[i].push(createCell('', 'pivot-empty', 'empty', {hidden: true}));
                } else {
                    for (var j = 1; j <= rowAxis.dims; j++) colAxisArray[i].push(createCell(null, 'pivot-empty', 'empty', {hidden: true, colSpan: rowAxis.dims, rowSpan: colAxis.dims - j}));
                }
            }

            for (var j = 0, obj, spanCount = 0; j < colAxis.size; j++) {
                spanCount++;

                obj = colAxis.objects.all[i][j];
                obj.type = 'dimension';
                obj.cls = 'pivot-dim';
                obj.sort = doSortableColumnHeaders() && i === colAxis.dims - 1 ? colAxis.ids[j] : null; 
                obj.noBreak = false;
                obj.hidden = !(obj.rowSpan || obj.colSpan);
                obj.width = doDynamicTableUpdate() ? 120 : null,
                obj.height = doDynamicTableUpdate() ? 25 : null,
                obj.htmlValue = response.getItemName(obj.id, layout.showHierarchy, true);

                colAxisArray[i].push(obj);

                if (spanCount === colAxis.span[0] && doRowSubTotals() ) {
                    if(i === 0) {
                        colAxisArray[i].push(createCell('&nbsp;', 'pivot-dim-subtotal', 'dimensionSubtotal', {rowSpan: colAxis.dims, empty: true}));
                    }

                    else {
                        colAxisArray[i].push(createCell('&nbsp;', 'pivot-dim-subtotal', 'dimensionSubtotal', {rowSpan: colAxis.dims - i, empty: true, hidden: true}));
                    }

                    spanCount = 0;
                }

                if ((j === colAxis.size - 1) && doRowTotals()) {
                    var totalCell;
                    if(i === 0) {
                        totalCell = createCell('Total', 'pivot-dim-total', 'dimensionTotal', {sort: doSortableColumnHeaders() ? 'total' : null, rowSpan: colAxis.dims, generateUuid: true})
                    }

                    else {
                        totalCell = createCell(null, 'pivot-dim-subtotal cursor-default', 'dimensionSubtotal', {hidden: true});
                    }
                    
                    colAxisArray[i].push(totalCell);
                }
            }
        }

        return colAxisArray;
    };

    // TODO: find a better way to count empty/totals
    getValueObjectArray = function(startCell, endCell) {
        const colAxisSize = colAxis.type ? colAxis.size : 1,
              rowAxisSize = rowAxis.type ? rowAxis.size : 1,
              counterProxyHandler = {
                get: (target, name) => {
                    return target.hasOwnProperty(name) ? target[name] : 0;
                }
              };

        let cellCounter = new Proxy({}, counterProxyHandler);

        for (var i = 0; i < rowAxisSize; i++) {

            var row = { values: [], total: 0, empty: 0 },
                subValueRow = { values: [], total: 0, empty: 0 },
                totalValueRow = { values: [], total: 0, empty: 0 },
                colshift = 0;

            // reset counters
            cellCounter['emptyColumnSubCells'] = 0;
            cellCounter['emptyColumnAllCells'] = 0;
            cellCounter['totalColumnSubCells'] = 0;

            for (var j = 0, rric, value, responseValue, htmlValue, empty, _uuid, uuids, empty, totalIdComb; j < colAxisSize; j++) {
                rric = new ResponseRowIdCombination();
                empty = false;
                uuids = [];

                if(!valueTable.columns[j + colshift]) {
                    valueTable.columns.push({ values: [], total: 0, empty: 0 });
                }

                // meta data uid
                rric.add(colAxis.type ? colAxis.ids[j] : '');
                rric.add(rowAxis.type ? rowAxis.ids[i] : '');

                // value html element id
                _uuid = uuid();

                // get uuids array from colaxis/rowaxis leaf
                if (colAxis.type) {
                    uuids = uuids.concat(colAxis.objects.all[colAxis.dims - 1][j].uuids);
                }
                if (rowAxis.type) {
                    uuids = uuids.concat(rowAxis.objects.all[rowAxis.dims - 1][i].uuids);
                }

                // value, htmlValue
                responseValue = idValueMap[rric.get()];

                if (isDefined(responseValue)) {
                    value = getValue(responseValue);
                    htmlValue = responseValue;
                }
                else {
                    value = 0;
                    empty = true;
                    htmlValue = '&nbsp;';
                    cellCounter['emptyRowSubCells' + j] += 1
                    cellCounter['emptyRowAllCells' + j] += 1;
                    cellCounter['emptyColumnSubCells'] += 1;
                    cellCounter['emptyColumnAllCells'] += 1;
                }
                // var cell = createCell(value, 'pivot-value', 'value', {_uuid: _uuid, uuids: uuids, htmlValue: htmlValue, empty: empty, numeric: true, dxId: rric.getDxIdByIds(response.metaData.dx)})
                var cell = {
                    uuid: _uuid,
                    type: 'value',
                    cls: 'pivot-value' + (empty ? ' cursor-default' : ''),
                    value: value,
                    htmlValue: htmlValue,
                    empty: empty,
                    uuids: uuids,
                    width: doDynamicTableUpdate() ? 120 : null,
                    height: doDynamicTableUpdate() ? 25 : null,
                    dxId: rric.getDxIdByIds(response.metaData.dx),
                    rowSpan: 1,
                    colSpan: 1,
                }

                let emptySubRow = cellCounter['emptyRowSubCells' + j] % rowUniqueFactor === 0 && cellCounter['emptyRowSubCells' + j] !== 0,
                    emptySubCol = cellCounter['emptyColumnSubCells'] % colUniqueFactor === 0 && cellCounter['emptyColumnSubCells'] !== 0,
                    emptyTotalRow = cellCounter['emptyRowAllCells' + j] === rowAxisSize,
                    emptyTotalCol = cellCounter['emptyColumnAllCells'] === colAxisSize;

                row.values.push(cell);

                // update totals
                row.total += cell.value;

                cellCounter['columnTotal' + (j + colshift)] += cell.value;
                cellCounter['totalRowSubCells' + j] += cell.value;
                cellCounter['totalRowAllCells' + j] += cell.value;
                cellCounter['totalColumnSubCells'] += cell.value;

                valueTable.columns[j + colshift].total += cell.value;
                valueTable.columns[j + colshift].isEmpty = emptyTotalRow;

                // do row sub totals
                if((i + 1) % rowUniqueFactor === 0 && doColSubTotals()) {

                    cellCounter['totalIntersectSubCells'] += cellCounter['totalRowSubCells' + j];
                    cellCounter['totalIntersectAllCells'] += cellCounter['totalRowSubCells' + j];

                    subValueRow.total += cellCounter['totalRowSubCells' + j];
                    subValueRow.values.push(createCell(cellCounter['totalRowSubCells' + j], 'pivot-value-subtotal', 'valueSubtotal', {empty: emptySubRow && emptySubCol, numeric: true}));

                    if((j + 1) % colUniqueFactor === 0 && doRowSubTotals()) {
                        subValueRow.values.push(createCell(cellCounter['totalIntersectSubCells'], 'pivot-value-subtotal', 'valueSubtotal', {empty: emptySubCol && emptySubRow, numeric: true}));
                        cellCounter['totalIntersectSubCells'] = 0;
                    }

                    if(j === colAxisSize - 1 && doRowTotals()) {
                        subValueRow.values.push(createCell(cellCounter['totalIntersectAllCells'], 'pivot-value-total-subgrandtotal', 'valueTotalSubgrandtotal', {empty: emptyTotalCol && emptySubRow, numeric: true}));
                        cellCounter['totalIntersectAllCells'] = 0;
                    }

                    cellCounter['totalRowSubCells' + j] = 0;
                }

                // do column sub totals
                if((j + 1) % colUniqueFactor === 0 && doRowSubTotals()) {
                    colshift += 1;
                    row.values.push(createCell(cellCounter['totalColumnSubCells'], 'pivot-value-subtotal', 'valueSubtotal', {empty: emptySubCol, numeric: true}));
                    addColumn(j + colshift, cellCounter['totalColumnSubCells'], emptySubCol);
                    cellCounter['columnTotal' + (j + colshift)] += cellCounter['totalColumnSubCells'];
                    cellCounter['totalColumnSubCells'] = 0;
                }

                // do row totals
                if(i === rowAxisSize - 1 && doColTotals()) {
                    cellCounter['grandTotalIntersectSubCells'] += cellCounter['totalRowAllCells' + j];
                    cellCounter['grandTotalIntersectAllCells'] += cellCounter['totalRowAllCells' + j];

                    totalValueRow.values.push(createCell(cellCounter['totalRowAllCells' + j], 'pivot-value-total-subgrandtotal', 'valueTotalSubgrandtotal', {empty: emptyTotalRow, numeric: true}));

                    if((j + 1) % colUniqueFactor === 0 && doRowSubTotals()) {
                        totalValueRow.values.push(createCell(cellCounter['grandTotalIntersectSubCells'], 'pivot-value-total-subgrandtotal', 'valueTotalSubgrandtotal', {empty: emptyTotalRow && emptySubCol, numeric: true}));
                        cellCounter['grandTotalIntersectSubCells'] = 0;
                    }

                    if(j === colAxisSize - 1 && doRowTotals()) {
                        colshift += 1;
                        totalValueRow.values.push(createCell(cellCounter['grandTotalIntersectAllCells'], 'pivot-value-total-subgrandtotal', 'valueTotalSubgrandtotal', {empty: emptyTotalCol && emptyTotalRow, numeric: true}));
                        addColumn(j + colshift, cellCounter['grandTotalIntersectAllCells'], emptyTotalCol)
                        cellCounter['columnTotal' + (j + colshift)] += cellCounter['grandTotalIntersectAllCells'];
                    }

                    if (doSortableColumnHeaders()) {
                        totalIdComb = new ResponseRowIdCombination(['total', rowAxis.ids[i]]);
                        idValueMap[totalIdComb.get()] = emptyTotalRow ? null : cellCounter['totalRowAllCells' + j];
                    }

                    cellCounter['totalRowAllCells' + j] = 0;
                }

                // do column totals
                if(j === colAxisSize - 1 && doRowTotals()) {
                    row.values.push(createCell(row.total, 'pivot-value-total-subgrandtotal', 'valueTotalSubgrandtotal', {empty: emptyTotalCol, numeric: true}));
                }

                valueTable.total += value;
                row.isEmpty = emptyTotalCol;
                subValueRow.isEmpty = emptyTotalCol;

                // map element id to dim element ids
                uuidDimUuidsMap[_uuid] = uuids;
            }

            // push value row
            valueTable.rows.push(row);

            // push sub value row
            if(subValueRow.values.length > 0) {
                valueTable.rows.push(subValueRow);
            }

            // push total value row
            if(doColTotals() && totalValueRow.values.length > 0) {
                totalValueRow.total = valueTable.total;
                valueTable.rows.push(totalValueRow);
            }
        }

        // do row percentages
        if(doRowPercentage()) {
            changeToRowPercentage(valueTable);
        }

        // do column percentages
        if(doColPercentage()) {
            changeToColPercentage(valueTable);
        }

        // hide empty columns
        if(doHideEmptyColumns()) {
            hideEmptyColumns(valueTable, colAxisAllObjects);
        }

        // hide empty rows
        if(doHideEmptyRows()) {
            hideEmptyRows(valueTable, rowAxisAllObjects);
        }

        // return compressed valueTable
        return compressTable(valueTable);
    };

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
        const combinedTable = [];
        for (let i = 0; i < values.length; i++) {
            combinedTable.push(rowAxisComb[i].concat(values[i]));
        }
        return colAxisComb.concat(combinedTable);
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

    // resize row to colspan
    resizeRow = function(row, maxColSpan) {
        var colSpanCounter = 0;
        for (var i = 0; i < row.length; i++) {
            var currentCell = row[i];
            if(currentCell.colSpan && colSpanCounter + currentCell.colSpan > maxColSpan && !currentCell.hidden) {
                row[i] = clone(row[i]);
                row[i].colSpan = maxColSpan - colSpanCounter;
            }
            if(colSpanCounter !== maxColSpan && !currentCell.hidden) {
                colSpanCounter += currentCell.colSpan ? row[i].colSpan : 0;
            }
        }        
    }

    renderTable = function() {

        // create html array
        var htmlArray = arrayClean([].concat(
            options.skipTitle ? [] : getTitle(completeTableObjects[0].length) || [],
            getFilterHtmlArray(completeTableObjects[0].length) || [],
            getTableHtml(completeTableObjects)
        ));

        // turn html array into html string;
        return getHtml(htmlArray);
    };

    // get html
    (function() {
        // build col axis
        colAxisAllObjects = getColAxisObjectArray();

        // build row axis
        rowAxisAllObjects = getRowAxisObjectArray();

        // build value table
        valueAllObjects = getValueObjectArray();

        // combine axes with value table
        completeTableObjects = combineTable(rowAxisAllObjects, colAxisAllObjects, valueAllObjects);
    }());
    
    // constructor
    t.dynamic = doDynamicTableUpdate();
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

PivotTable.prototype.getUuidObjectMap = function() {
    return objectApplyIf((this.colAxis ? this.colAxis.uuidObjectMap || {} : {}), (this.rowAxis ? this.rowAxis.uuidObjectMap || {} : {}));
};
