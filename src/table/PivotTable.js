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


        // table transformations
        hideEmptyColumns,
        hideEmptyRows,
        changeToColPercentage,
        changeToRowPercentage,
        setTotalCells,
        setEmptyCells,

        // cell creation
        createCell,

        // utils
        getValue,
        roundIf,
        getNumberOfDecimals,
        getHtmlValue,
        recursiveReduce,
        getUniqueFactor,
        isRowEmpty,
        isSingleRowEmpty,
        isColumnEmpty,
        getRowTotal,
        getSingleRowTotal,
        getColumnTotal,
        setCellValue,
        setCellEmpty,

    // global variables
        // table holders
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
        legendDisplayStrategy = layout.legendDisplayStrategy,

        // utils
        dimensionNameMap = dimensionConfig.getDimensionNameMap(),
        objectNameMap = dimensionConfig.getObjectNameMap(),
        idValueMap = response.getIdValueMap(layout),
        sortableIdObjects = [], //todo
        tdCount = 0,
        ignoreDimensionIds = ['dy'];

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
    columnDimensionNames = (colAxis.type ? layout.columns.getDimensionNames(response) : []).filter(name => !arrayContains(ignoreDimensionIds, name));
    rowDimensionNames = (rowAxis.type ? layout.rows.getDimensionNames(response) : []).filter(name => !arrayContains(ignoreDimensionIds, name));

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

    getHtmlValue = function(config, isValue) {
        if (config.collapsed) {
            return '';
        }

        var str = config.htmlValue,
            n = parseFloat(config.htmlValue);

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
    };

    getTdHtml = function(config, metaDataId) {
        var isNumeric = isObject(config) && isString(config.type) && config.type.substr(0,5) === 'value' && !config.empty;
        var isValue = isNumeric && config.type === 'value';
        var bgColor;
        var legends = [];

        // validation
        if (!isObject(config)) {
            return '';
        }

        if (config.hidden || config.collapsed) {
            return '';
        }

        // count number of cells
        tdCount = tdCount + 1;

        var attributes = [];
        var cls = [];
        var style = [];

        // html value
        var htmlValue = getHtmlValue(config, isValue);
        var ppHtmlValue = !arrayContains(['dimension', 'filter'], config.type) ? optionConfig.prettyPrint(htmlValue, layout.digitGroupSeparator) : htmlValue;

        // cls
        cls.push(...(config.cls ? config.cls.split(' ') : []));
        cls.push(config.hidden ? 'td-hidden' : null);
        cls.push(config.collapsed ? 'td-collapsed' : null);
        cls.push(isValue && !unclickable ? 'pointer' : null);
        cls.push(isString(config.sort) ? 'td-sortable' : null);

        if (isString(config.sort)) {
            sortableIdObjects.push({
                id: config.sort,
                uuid: config.uuid
            });
        }

        if (isValue) {
            var value = parseFloat(config.value);

            if (legendDisplayStrategy === optionConfig.getLegendDisplayStrategy('by_data_item').id) {
                if (config.dxId && response.metaData.items[config.dxId].legendSet) {
                    var legendSetId = response.metaData.items[config.dxId].legendSet,
                        _legendSet = appManager.getLegendSetById(legendSetId);

                    legends = _legendSet.legends;
                }
            } else {
                legends = legendSet ? legendSet.legends || [] : [];
            }

            for (var i = 0; i < legends.length; i++) {
                if (numberConstrain(value, legends[i].startValue, legends[i].endValue) === value) {
                    bgColor = legends[i].color;
                }
            }
        }

        if (legendDisplayStyle === optionConfig.getLegendDisplayStyle('fill').id) {
            if(bgColor) {
                var rgb = uiManager.hexToRgb(bgColor),
                    color = uiManager.isColorBright(rgb) ? 'black' : 'white';

                style.push(bgColor && isValue ? 'background-color:' + bgColor + '; color: ' + color + '; '  : '');
            } else {
                style.push(bgColor && isValue ? 'background-color:' + bgColor + '; ' : '');
            }
        }

        if (legendDisplayStyle === optionConfig.getLegendDisplayStyle('text').id) {
            style.push(bgColor && isValue ? 'color:' + bgColor + '; ' : '');
        }

        // attributes
        cls = arrayClean(cls);
        style = arrayClean(style);

        attributes.push('data-ou-id="' + (config.ouId || '') + '"');
        attributes.push('data-period-id="' + (config.peId || '') + '"');
        attributes.push(cls.length ? 'class="' + cls.join(' ') + '"' : null);
        attributes.push(style.length ? 'style="' + style.join(' ') + '"' : null);
        attributes.push(config.uuid ? 'id="' + config.uuid + '"' : null);
        attributes.push(config.colSpan ? 'colspan="' + config.colSpan + '"' : null);
        attributes.push(config.rowSpan ? 'rowSpan="' + config.rowSpan + '"' : null);
        attributes.push(config.title ? 'title="' + config.title + '"' : null);

        //if (legendColor && isValue) {
            //html += 'style="color:' + legendColor + ';padding:' + displayDensity + '; font-size:' + fontSize + ';"' + '>' + htmlValue + '</td>';
            //html += '>';
            //html += '<div class="legendCt">';
            //html += '<div class="number ' + config.cls + '" style="padding:' + displayDensity + '; padding-right:3px; font-size:' + fontSize + '">' + htmlValue + '</div>';
            //html += '<div class="arrowCt ' + config.cls + '">';
            //html += '<div class="arrow" style="border-bottom:8px solid transparent; border-right:8px solid ' + legendColor + '">&nbsp;</div>';
            //html += '</div></div></div></td>';
        //}
        //else {
        //    html += 'style="' + (legendColor && isValue ? 'color:' + legendColor + '; ' : '') + '">' + htmlValue + '</td>';
        //}

        return '<td ' + arrayClean(attributes).join(' ') + '>' + ppHtmlValue + '</td>';
    };

    getValue = function(str) {
        if (isBoolean(str)) {
            return 1;
        }

        var n = parseFloat(str);

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
        return layout.numberType === optionConfig.getNumberType().percentofcolumn.id;
    };

    doRowPercentage = function() {
        return layout.numberType === optionConfig.getNumberType().percentofrow.id;
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

    //TODO: have all cell creation go through this function
    createCell = function(value, cls, type, {collapsed=false, hidden=false, empty=false, colSpan=1, rowSpan=1, generateUuid=false, numeric=false, _uuid, title, width, height, sort = null, noBreak, dxId, uuids, htmlValue}) {
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
        cell.dxId = dxId;
        cell.uuids = uuids;
        cell.sort = sort;

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

    setCellValue = function(cell, value) {
        cell.value = value;
        cell.htmlValue = getRoundedHtmlValue(value);
    }

    setCellEmpty = function(cell) {
        cell.value = '',
        cell.htmlValue = '';
        cell.empty = true;
    }

    isRowEmpty = function(table, index) {
        for (var i = 0; i < table[index].length; i++) {
            if (!table[index][i].empty) {
                return false;
            }
        }
        return true;
    }

    isSingleRowEmpty = function (row) {
        for (var i=0; i < row.length; i++) {
            if(!row[i].empty && row[i].type === 'value') return false;
        }
        return true;
    }

    isColumnEmpty = function(table, index) {
        for (var i = 0; i < table.length; i++) {
            if (!table[i][index].empty) {
                return false;
            }
        }
        return true;
    }

    getRowTotal = function(table, index) {
        let total = 0;
        for(var i = 0; i < table[index].length; i++) {
            if (table[index][i].type === 'value') {
                total += table[index][i].value;
            }
        }
        return total;
    }

    getSingleRowTotal = function (row) {
        let total = 0;
        for (var i=0; i < row.length; i++) {
            if (row[i].type === 'value') {
                total += row[i].value;
            }
        }
        return total;
    }

    getColumnTotal = function(table, index) {
        let total = 0;
        for(var i = 0; i < table.length; i++) {
            if(table[i][index].type === 'value') {
                total += table[i][index].value;
            }
        }
        return total;
    }

    hideEmptyRows = function(table, axisObjects) {
        for(var i = 0, dimLeaf; i < table.length; i++) {
            if (isRowEmpty(table, i)) {
                for (var j = 0; j < table[i].length; j++) {
                    table[i][j].collapsed = true;
                }
                dimLeaf = axisObjects[i][rowAxis.dims-1];
                if (dimLeaf.type === 'dimensionSubtotal') {
                    axisObjects[i][0].collapsed = true;
                }
                recursiveReduce(dimLeaf);
            }
        }
    }

    hideEmptyColumns = function(table, axisObjects) {
        for(var i = 0, dimLeaf; i < table[1].length; i++) {
            if (isColumnEmpty(table, i)) {
                for (var j = 0; j < table.length; j++) {
                    table[j][i].collapsed = true;
                }
                dimLeaf = axisObjects[colAxis.dims-1][i + rowAxis.dims];
                if (dimLeaf.type === 'dimensionSubtotal') {
                    axisObjects[0][i + rowAxis.dims].collapsed = true;
                }
                recursiveReduce(dimLeaf, 'colSpan');
            }
        }
    }

    changeToColPercentage = function(table) {
        for(var i = 0; i < table.length; i++) {
            for (var j = 0; j < table[i].length; j++) {
                let columnTotal = getColumnTotal(table, j);
                if (!isColumnEmpty(table, j) && !table[i][j].empty && columnTotal !== 0) {
                    table[i][j].htmlValue = getRoundedHtmlValue((table[i][j].value / columnTotal) * 100) + '%';
                }
                if (columnTotal === 0) {
                    table[i][j].empty = true;
                    table[i][j].htmlValue = '&nbsp;';
                }
            }
        }
    }

    changeToRowPercentage = function(table) {
        for(var i = 0; i < table.length; i++) {
            for (var j = 0; j < table[i].length; j++) {
                let rowTotal = getRowTotal(table, i);
                if (!isRowEmpty(table, i) && !table[i][j].empty && rowTotal !== 0) {
                    table[i][j].htmlValue = getRoundedHtmlValue((table[i][j].value / rowTotal) * 100) + '%';
                }
                if (rowTotal === 0) {
                    table[i][j].empty = true;
                    table[i][j].htmlValue = '&nbsp;';
                }
            }
        }
    }

    recursiveReduce = function(obj, span) {
        if (!obj.children) {
            obj.collapsed = true;

            if (obj.parent && obj.parent.oldestSibling) {
                obj.parent.oldestSibling.children--;
                span && obj.parent.oldestSibling[span]--;
            }
        }

        if (obj.parent) {
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
                    if (i === 0) {
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


    setTotalCells = function (table) {

        var columnTotals = new Array(table[1].length).fill(0),
            columnSubTotals = new Array(table[1].length).fill(0);

        for (var i=0; i < table.length; i++) {
            for (var j=0, rowTotal=0, rowSubTotal=0, intersectRow = 0; j < table[i].length; j++) {

                var cell = table[i][j],
                    nextSubCell = j + ((colUniqueFactor + 1) - (j % (colUniqueFactor + 1))) - 1;

                switch (cell.type) {
                    case 'value-row-subtotal': {
                        setCellValue(cell, rowSubTotal);
                        rowSubTotal = 0;
                    } continue;

                    case 'value-column-subtotal': {
                        setCellValue(cell, columnSubTotals[j]);
                        intersectRow += columnSubTotals[j];
                        columnSubTotals[j] = 0;
                    } continue;

                    case 'value-intersect-subtotal': {
                        setCellValue(cell, columnSubTotals[j]);
                        columnSubTotals[j] = 0;
                    } continue;

                    case 'value-row-total':{
                        setCellValue(cell, rowTotal);
                    } continue;

                    case 'value-row-intersect-total': {
                        setCellValue(cell, intersectRow);
                    } continue;

                    case 'value-column-total': {
                        setCellValue(cell, columnTotals[j]);
                    } continue;

                    case 'value-column-intersect-total': {
                        setCellValue(cell, columnTotals[j]);
                    } continue;

                    case 'value-intersect-total': {
                        setCellValue(cell, columnTotals[j]);
                    } continue;
                }

                rowTotal += cell.value;
                rowSubTotal += cell.value;
                columnSubTotals[j] += cell.value;
                columnTotals[j] += cell.value;
                columnTotals[table[i].length - 1] += cell.value;

                if (colUniqueFactor > 1 && doColSubTotals()) {
                    columnSubTotals[nextSubCell] += cell.value;
                }

                if (colUniqueFactor > 1 && doColTotals()) {
                    columnTotals[nextSubCell] += cell.value;
                }
            }
        }
    }

    setEmptyCells = function (table) {

        var columnTotalEmpties = new Array(table[1].length).fill(0),
            columnSubEmpties = new Array(table[1].length).fill(0);

        for (var i=0; i < table.length; i++) {
            for (var j=0, rowTotalEmpty=0, rowSubEmpty=0, rowIntesectEmpty = 0; j < table[i].length; j++) {

                var cell = table[i][j],
                    nextSubCell = j + ((colUniqueFactor + 1) - (j % (colUniqueFactor + 1))) - 1;

                switch (cell.type) {
                    case 'value-row-subtotal': {
                        if (rowSubEmpty === colUniqueFactor) setCellEmpty(cell);
                        rowSubEmpty = 0;
                    } continue;

                    case 'value-column-subtotal': {
                        if (columnSubEmpties[j] === rowUniqueFactor) {
                            setCellEmpty(cell);
                            rowIntesectEmpty++;
                        }
                        columnSubEmpties[j] = 0;
                    } continue;

                    case 'value-intersect-subtotal': {
                        if (columnSubEmpties[j] === rowUniqueFactor * colUniqueFactor) setCellEmpty(cell);
                        columnSubEmpties[j] = 0;
                    } continue;

                    case 'value-row-total':{
                        if (rowTotalEmpty === colAxis.size) setCellEmpty(cell);
                    } continue;

                    case 'value-column-total': {
                        if (columnTotalEmpties[j] === rowAxis.size) setCellEmpty(cell);
                    } continue;

                    case 'value-row-intersect-total': {
                        if (rowIntesectEmpty === colAxis.size) setCellEmpty(cell);
                    } continue;

                    case 'value-column-intersect-total': {
                        if (columnTotalEmpties[j] === rowAxis.size * colUniqueFactor) setCellEmpty(cell);
                    } continue;

                    case 'value-intersect-total': {
                        if (columnTotalEmpties[j] === rowAxis.size * colAxis.size) setCellEmpty(cell);
                    } continue;
                }

                rowSubEmpty += cell.empty ? 1 : 0;
                rowTotalEmpty += cell.empty ? 1 : 0;
                columnSubEmpties[j] += cell.empty ? 1 : 0;
                columnTotalEmpties[j] += cell.empty ? 1 : 0;
                columnTotalEmpties[table[i].length - 1] += cell.empty ? 1 : 0;

                if (colUniqueFactor > 1 && doColSubTotals()) {
                    columnSubEmpties[nextSubCell] += cell.empty ? 1 : 0;
                }

                if (colUniqueFactor > 1 && doColTotals()) {
                    columnTotalEmpties[nextSubCell] += cell.empty ? 1 : 0;
                }

            }
        }
    }

    getValueObjectArray = function() {
        const colAxisSize = colAxis.type ? colAxis.size : 1,
              rowAxisSize = rowAxis.type ? rowAxis.size : 1,
              table = [];

        for (var i = 0; i < rowAxisSize; i++) {

            var row = [],
                subRow = [],
                totalRow = [];

            for (var j = 0, rric, value, responseValue, htmlValue, empty, _uuid, uuids, empty, totalIdComb; j < colAxisSize; j++) {
                rric = new ResponseRowIdCombination();
                empty = false;
                uuids = [];

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
                }

                var cell = {
                    uuid: _uuid,
                    type: 'value',
                    cls: 'pivot-value' + (empty ? ' cursor-default' : ''),
                    value: value,
                    htmlValue: htmlValue,
                    empty: empty,
                    uuids: uuids,
                    dxId: rric.getIdByIds(response.metaData.dimensions.dx),
                    peId: rric.getIdByIds(response.metaData.dimensions.pe),
                    ouId: rric.getIdByIds(response.metaData.dimensions.ou),
                }

                row.push(cell);

                // do column sub totals
                if ((j + 1) % colUniqueFactor === 0 && doRowSubTotals()) {
                    row.push(createCell(null, 'pivot-value-subtotal', 'value-row-subtotal', { numeric: true }));
                }

                // do column totals
                if (j === colAxisSize - 1 && doRowTotals()) {
                    row.push(createCell(null, 'pivot-value-total-subgrandtotal', 'value-row-total', { numeric: true }));

                    if (doSortableColumnHeaders()) {
                        totalIdComb = new ResponseRowIdCombination(refs, ['total', rowAxis.ids[i]]);
                        idValueMap[totalIdComb.get()] = isSingleRowEmpty(row) ? null : getSingleRowTotal(row);
                    }
                }

                // do row sub totals
                if ((i + 1) % rowUniqueFactor === 0 && doColSubTotals()) {
                    subRow.push(createCell(0, 'pivot-value-subtotal', 'value-column-subtotal', { numeric: true }));
                    if ((j + 1) % colUniqueFactor === 0 && doRowSubTotals()) {
                        subRow.push(createCell(null, 'pivot-value-subtotal', 'value-intersect-subtotal', { numeric: true }));
                    }

                    if (j === colAxisSize - 1 && doRowTotals()) {
                        subRow.push(createCell(null, 'pivot-value-total-subgrandtotal', 'value-row-intersect-total', { numeric: true }));
                    }
                }

                // do row totals
                if (i === rowAxisSize - 1 && doColTotals()) {
                    totalRow.push(createCell(null, 'pivot-value-total-subgrandtotal', 'value-column-total', { numeric: true }));
                    if ((j + 1) % colUniqueFactor === 0 && doRowSubTotals()) {
                        totalRow.push(createCell(null, 'pivot-value-total-subgrandtotal', 'value-column-intersect-total', { numeric: true }));
                    }

                    if (j === colAxisSize - 1 && doRowTotals()) {
                        totalRow.push(createCell(null, 'pivot-value-total-subgrandtotal', 'value-intersect-total', { numeric: true }));
                    }
                }

                // map element id to dim element ids
                uuidDimUuidsMap[_uuid] = uuids;
            }

            // push value row
            table.push(row);

            // push sub value row
            if (doColSubTotals() && subRow.length > 0) {
                table.push(subRow);
            }

            // push totasl value row
            if (doColTotals() && totalRow.length > 0) {
                table.push(totalRow);
            }
        }

        // update totals
        setTotalCells(table);

        // update empties
        setEmptyCells(table);

        // do row percentages
        if(doRowPercentage()) {
            changeToRowPercentage(table);
        }

        // do column percentages
        if(doColPercentage()) {
            changeToColPercentage(table);
        }

        // hide empty columns
        if(doHideEmptyColumns()) {
            hideEmptyColumns(table, colAxisAllObjects);
        }

        // hide empty rows
        if(doHideEmptyRows()) {
            hideEmptyRows(table, rowAxisAllObjects);
        }

        return table;
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
    t.html = renderTable();

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
