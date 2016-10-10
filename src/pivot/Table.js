import isString from 'd2-utilizr/lib/isString';
import isNumber from 'd2-utilizr/lib/isNumber';
import isArray from 'd2-utilizr/lib/isArray';
import isObject from 'd2-utilizr/lib/isObject';
import isBoolean from 'd2-utilizr/lib/isBoolean';
import isDefined from 'd2-utilizr/lib/isDefined';
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
        dimensionConfig = klass.dimensionConfig,
        optionConfig = klass.optionConfig;

    options = options || {};

    // init
    var getRoundedHtmlValue,
        getTdHtml,
        getValue,
        roundIf,
        getNumberOfDecimals,
        prettyPrint,
        doColTotals,
        doRowTotals,
        doColSubTotals,
        doRowSubTotals,
        doSortableColumnHeaders,
        getColAxisHtmlArray,
        getRowHtmlArray,
        rowAxisHtmlArray,
        getColTotalHtmlArray,
        getGrandTotalHtmlArray,
        getTotalHtmlArray,
        getTopBarSpan,
        getFilterHtmlArray,
        getTitle,
        getHtml,
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
        },
        colUniqueFactor = getUniqueFactor(colAxis),
        rowUniqueFactor = getUniqueFactor(rowAxis),
        valueItems = [],
        valueObjects = [],
        totalColObjects = [],
        uuidDimUuidsMap = {},
        legendSet = isObject(layout.legendSet) ? appManager.getLegendSetById(layout.legendSet.id) : null,
        tdCount = 0,
        htmlArray,
        dimensionNameMap = dimensionConfig.getDimensionNameMap(),
        objectNameMap = dimensionConfig.getObjectNameMap(),
        idValueMap = response.getIdValueMap(layout),
        sortableIdObjects = []; //todo

    getRoundedHtmlValue = function(value, dec) {
        dec = dec || 2;
        return parseFloat(roundIf(value, 2)).toString();
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
        tdCount = tdCount + 1;

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
        htmlValue = !arrayContains(['dimension', 'filter'], config.type) ? prettyPrint(htmlValue, layout.digitGroupSeparator) : htmlValue;

        cls += config.hidden ? ' td-hidden' : '';
        cls += config.collapsed ? ' td-collapsed' : '';
        cls += isValue ? ' pointer' : '';
        //cls += bgColor ? ' legend' : (config.cls ? ' ' + config.cls : '');
        cls += config.cls ? ' ' + config.cls : '';

        // if sorting
        if (isString(metaDataId)) {
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
            html += 'style="' + (bgColor && isValue ? 'color:' + bgColor + '; ' : '') + '">' + htmlValue + '</td>';
        //}

        return html;
    };

    getValue = function(str) {
        var n = parseFloat(str);

        if (isBoolean(str)) {
            return 1;
        }

        // return string if
        // - parsefloat(string) is not a number
        // - string is just starting with a number
        // - string is a valid date
        //if (!isNumber(n) || n != str || new Date(str).toString() !== 'Invalid Date') {
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

    prettyPrint = function(number, separator) {
        var oc = optionConfig,
            spaceId = oc.getDigitGroupSeparator('space').id,
            noneId = oc.getDigitGroupSeparator('none').id;

        separator = separator || spaceId;

        if (separator === noneId) {
            return number;
        }

        return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, oc.getDigitGroupSeparatorValueById(separator) || '');
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

    doSortableColumnHeaders = function() {
        return (rowAxis.type && rowAxis.dims === 1);
    };

    getColAxisHtmlArray = function() {
        var a = [],
            columnDimensionNames = colAxis.type ? layout.columns.getDimensionNames(response) : [],
            rowDimensionNames = rowAxis.type ? layout.rows.getDimensionNames(response) : [],
            getFilterRow,
            getEmptyNameTdConfig,
            getEmptyHtmlArray;

        //getFilterRow = function() {


        getEmptyNameTdConfig = function(config) {
            config = config || {};

            return getTdHtml({
                cls: config.cls ? ' ' + config.cls : 'pivot-empty',
                colSpan: config.colSpan ? config.colSpan : 1,
                rowSpan: config.rowSpan ? config.rowSpan : 1,
                htmlValue: config.htmlValue ? config.htmlValue : '&nbsp;'
            });
        };

        getEmptyHtmlArray = function(i) {
            var a = [];

            // if not the intersection cell
            if (i < colAxis.dims - 1) {
                if (rowAxis.type && rowAxis.dims) {
                    for (var j = 0; j < rowAxis.dims - 1; j++) {
                        a.push(getEmptyNameTdConfig({
                            cls: 'pivot-dim-label'
                        }));
                    }
                }

                a.push(getEmptyNameTdConfig({
                    cls: 'pivot-dim-label',
                    htmlValue: response.getNameById(columnDimensionNames[i]) // objectNameMap[columnDimensionNames[i]].name
                }));
            }
            else {
                if (rowAxis.type && rowAxis.dims) {
                    for (var j = 0; j < rowAxis.dims - 1; j++) {
                        a.push(getEmptyNameTdConfig({
                            cls: 'pivot-dim-label',
                            htmlValue: response.getNameById(rowDimensionNames[j]) //(objectNameMap[rowDimensionNames[j]] || {}).name
                        }));
                    }
                }

                a.push(getEmptyNameTdConfig({
                    cls: 'pivot-dim-label',
                    htmlValue: response.getNameById(rowDimensionNames[j]) + (colAxis.type && rowAxis.type ? '&nbsp;/&nbsp;' : '') + response.getNameById(columnDimensionNames[i])
                }));
            }

            return a;
        };

        if (!colAxis.type) {

            // show row dimension labels
            if (rowAxis.type && layout.showDimensionLabels) {
                var dimLabelHtml = [];

                // labels from row object names
                for (var i = 0; i < rowDimensionNames.length; i++) {
                    dimLabelHtml.push(getEmptyNameTdConfig({
                        cls: 'pivot-dim-label',
                        htmlValue: response.getNameById(rowDimensionNames[i])
                    }));
                }

                // pivot-transparent-column unnecessary

                a.push(dimLabelHtml);
            }

            return a;
        }

        // for each col dimension
        for (var i = 0, dimHtml; i < colAxis.dims; i++) {
            dimHtml = [];

            if (layout.showDimensionLabels) {
                dimHtml = dimHtml.concat(getEmptyHtmlArray(i));
            }
            else if (i === 0) {
                dimHtml.push(colAxis.type && rowAxis.type ? getEmptyNameTdConfig({
                    colSpan: rowAxis.dims,
                    rowSpan: colAxis.dims
                }) : '');
            }

            for (var j = 0, obj, spanCount = 0, condoId, totalId; j < colAxis.size; j++) {
                spanCount++;
                condoId = null;
                totalId = null;

                obj = colAxis.objects.all[i][j];
                obj.type = 'dimension';
                obj.cls = 'pivot-dim';
                obj.noBreak = false;
                obj.hidden = !(obj.rowSpan || obj.colSpan);
                obj.htmlValue = response.getItemName(obj.id, layout.showHierarchy, true);

                // sortable column headers. last dim only.
                if (i === colAxis.dims - 1 && doSortableColumnHeaders()) {

                    //condoId = colAxis.ids[j].split('-').join('');
                    condoId = colAxis.ids[j];
                }

                dimHtml.push(getTdHtml(obj, condoId));

                if (i === 0 && spanCount === colAxis.span[i] && doRowSubTotals() ) {
                    dimHtml.push(getTdHtml({
                        type: 'dimensionSubtotal',
                        cls: 'pivot-dim-subtotal cursor-default',
                        rowSpan: colAxis.dims,
                        htmlValue: '&nbsp;'
                    }));

                    spanCount = 0;
                }

                if (i === 0 && (j === colAxis.size - 1) && doRowTotals()) {
                    totalId = doSortableColumnHeaders() ? 'total' : null;

                    dimHtml.push(getTdHtml({
                        uuid: uuid(),
                        type: 'dimensionTotal',
                        cls: 'pivot-dim-total',
                        rowSpan: colAxis.dims,
                        htmlValue: 'Total'
                    }, totalId));
                }
            }

            a.push(dimHtml);
        }

        return a;
    };

    getRowHtmlArray = function() {
        var a = [],
            axisAllObjects = [],
            xValueObjects,
            totalValueObjects = [],
            mergedObjects = [],
            valueItemsCopy,
            colAxisSize = colAxis.type ? colAxis.size : 1,
            rowAxisSize = rowAxis.type ? rowAxis.size : 1,
            recursiveReduce;

        recursiveReduce = function(obj) {
            if (!obj.children) {
                obj.collapsed = true;

                if (obj.parent) {
                    obj.parent.oldestSibling.children--;
                }
            }

            if (obj.parent) {
                recursiveReduce(obj.parent.oldestSibling);
            }
        };

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

                axisAllObjects.push(row);
            }
        }
        else {
            if (layout.showDimensionLabels) {
                axisAllObjects.push([{
                    type: 'transparent',
                    cls: 'pivot-transparent-row'
                }]);
            }
        }


//axisAllObjects = [ [ dim, dim ]
//                   [ dim, dim ]
//                   [ dim, dim ]
//                   [ dim, dim ] ];

        // value
        for (var i = 0, valueItemsRow, valueObjectsRow; i < rowAxisSize; i++) {
            valueItemsRow = [];
            valueObjectsRow = [];

            for (var j = 0, rric, value, responseValue, htmlValue, empty, _uuid, uuids; j < colAxisSize; j++) {
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
                    htmlValue = '&nbsp;';
                    empty = true;
                }

                valueItemsRow.push(value);
                valueObjectsRow.push({
                    uuid: _uuid,
                    type: 'value',
                    cls: 'pivot-value' + (empty ? ' cursor-default' : ''),
                    value: value,
                    htmlValue: htmlValue,
                    empty: empty,
                    uuids: uuids
                });

                // map element id to dim element ids
                uuidDimUuidsMap[_uuid] = uuids;
            }

            valueItems.push(valueItemsRow);
            valueObjects.push(valueObjectsRow);
        }

        // totals
        if (colAxis.type && doRowTotals()) {
            for (var i = 0, empty = [], total = 0; i < valueObjects.length; i++) {
                for (j = 0, obj; j < valueObjects[i].length; j++) {
                    obj = valueObjects[i][j];

                    empty.push(obj.empty);
                    total += obj.value;
                }

                // row totals
                totalValueObjects.push({
                    type: 'valueTotal',
                    cls: 'pivot-value-total',
                    value: total,
                    htmlValue: arrayContains(empty, false) ? getRoundedHtmlValue(total) : '',
                    empty: !arrayContains(empty, false)
                });

                // add row totals to idValueMap to make sorting on totals possible
                if (doSortableColumnHeaders()) {
                    var totalIdComb = new ResponseRowIdCombination(['total', rowAxis.ids[i]]),
                        isEmpty = !arrayContains(empty, false);

                    idValueMap[totalIdComb.get()] = isEmpty ? null : total;
                }

                empty = [];
                total = 0;
            }
        }

        // hide empty rows (dims/values/totals)
        if (colAxis.type && rowAxis.type) {
            if (layout.hideEmptyRows) {
                for (var i = 0, valueRow, isValueRowEmpty, dimLeaf; i < valueObjects.length; i++) {
                    valueRow = valueObjects[i];
                    isValueRowEmpty = !arrayContains(arrayPluck(valueRow, 'empty'), false);

                    // if value row is empty
                    if (isValueRowEmpty) {

                        // hide values by adding collapsed = true to all items
                        for (var j = 0; j < valueRow.length; j++) {
                            valueRow[j].collapsed = true;
                        }

                        // hide totals by adding collapsed = true to all items
                        if (doRowTotals()) {
                            totalValueObjects[i].collapsed = true;
                        }

                        // hide/reduce parent dim span
                        dimLeaf = axisAllObjects[i][rowAxis.dims-1];
                        recursiveReduce(dimLeaf);
                    }
                }
            }
        }

        xValueObjects = valueObjects;

        // col subtotals
        if (doRowSubTotals()) {
            var tmpValueObjects = [];

            for (var i = 0, row, rowSubTotal, colCount; i < xValueObjects.length; i++) {
                row = [];
                rowSubTotal = 0;
                colCount = 0;

                for (var j = 0, item, collapsed = [], empty = []; j < xValueObjects[i].length; j++) {
                    item = xValueObjects[i][j];
                    rowSubTotal += item.value;
                    empty.push(!!item.empty);
                    collapsed.push(!!item.collapsed);
                    colCount++;

                    row.push(item);

                    if (colCount === colUniqueFactor) {
                        var isEmpty = !arrayContains(empty, false);
                        row.push({
                            type: 'valueSubtotal',
                            cls: 'pivot-value-subtotal' + (isEmpty ? ' cursor-default' : ''),
                            value: rowSubTotal,
                            htmlValue: isEmpty ? '&nbsp;' : getRoundedHtmlValue(rowSubTotal),
                            empty: isEmpty,
                            collapsed: !arrayContains(collapsed, false)
                        });

                        colCount = 0;
                        rowSubTotal = 0;
                        empty = [];
                        collapsed = [];
                    }
                }

                tmpValueObjects.push(row);
            }

            xValueObjects = tmpValueObjects;
        }

        // row subtotals
        if (doColSubTotals()) {
            var tmpAxisAllObjects = [],
                tmpValueObjects = [],
                tmpTotalValueObjects = [],
                getAxisSubTotalRow;

            getAxisSubTotalRow = function(collapsed) {
                var row = [];

                for (var i = 0, obj; i < rowAxis.dims; i++) {
                    obj = {};
                    obj.type = 'dimensionSubtotal';
                    obj.cls = 'pivot-dim-subtotal cursor-default';
                    obj.collapsed = arrayContains(collapsed, true);

                    if (i === 0) {
                        obj.htmlValue = '&nbsp;';
                        obj.colSpan = rowAxis.dims;
                    }
                    else {
                        obj.hidden = true;
                    }

                    row.push(obj);
                }

                return row;
            };

            // tmpAxisAllObjects
            for (var i = 0, row, collapsed = []; i < axisAllObjects.length; i++) {
                tmpAxisAllObjects.push(axisAllObjects[i]);
                collapsed.push(!!axisAllObjects[i][0].collapsed);

                // insert subtotal after last objects
                if (!isArray(axisAllObjects[i+1]) || !!axisAllObjects[i+1][0].root) {
                    tmpAxisAllObjects.push(getAxisSubTotalRow(collapsed));

                    collapsed = [];
                }
            }

            // tmpValueObjects
            for (var i = 0; i < tmpAxisAllObjects.length; i++) {
                tmpValueObjects.push([]);
            }

            for (var i = 0; i < xValueObjects[0].length; i++) {
                for (var j = 0, rowCount = 0, tmpCount = 0, subTotal = 0, empty = [], collapsed, item; j < xValueObjects.length; j++) {
                    item = xValueObjects[j][i];
                    tmpValueObjects[tmpCount++].push(item);
                    subTotal += item.value;
                    empty.push(!!item.empty);
                    rowCount++;

                    if (axisAllObjects[j][0].root) {
                        collapsed = !!axisAllObjects[j][0].collapsed;
                    }

                    if (!isArray(axisAllObjects[j+1]) || axisAllObjects[j+1][0].root) {
                        var isEmpty = !arrayContains(empty, false);

                        tmpValueObjects[tmpCount++].push({
                            type: item.type === 'value' ? 'valueSubtotal' : 'valueSubtotalTotal',
                            value: subTotal,
                            htmlValue: isEmpty ? '&nbsp;' : getRoundedHtmlValue(subTotal),
                            collapsed: collapsed,
                            cls: (item.type === 'value' ? 'pivot-value-subtotal' : 'pivot-value-subtotal-total') + (isEmpty ? ' cursor-default' : '')
                        });
                        rowCount = 0;
                        subTotal = 0;
                        empty = [];
                    }
                }
            }

            // tmpTotalValueObjects
            for (var i = 0, obj, collapsed = [], empty = [], subTotal = 0, count = 0; i < totalValueObjects.length; i++) {
                obj = totalValueObjects[i];
                tmpTotalValueObjects.push(obj);

                collapsed.push(!!obj.collapsed);
                empty.push(!!obj.empty);
                subTotal += obj.value;
                count++;

                if (count === rowAxis.span[0]) {
                    var isEmpty = !arrayContains(empty, false);

                    tmpTotalValueObjects.push({
                        type: 'valueTotalSubgrandtotal',
                        cls: 'pivot-value-total-subgrandtotal' + (isEmpty ? ' cursor-default' : ''),
                        value: subTotal,
                        htmlValue: isEmpty ? '&nbsp;' : getRoundedHtmlValue(subTotal),
                        empty: isEmpty,
                        collapsed: !arrayContains(collapsed, false)
                    });

                    collapsed = [];
                    empty = [];
                    subTotal = 0;
                    count = 0;
                }
            }

            axisAllObjects = tmpAxisAllObjects;
            xValueObjects = tmpValueObjects;
            totalValueObjects = tmpTotalValueObjects;
        }

        // merge dim, value, total
        for (var i = 0, row; i < xValueObjects.length; i++) {
            row = [];

            //if (rowAxis) {
                row = row.concat(axisAllObjects[i]);
            //}

            row = row.concat(xValueObjects[i]);

            if (colAxis.type) {
                row = row.concat(totalValueObjects[i]);
            }

            mergedObjects.push(row);
        }

        // create html items
        for (var i = 0, row; i < mergedObjects.length; i++) {
            row = [];

            for (var j = 0; j < mergedObjects[i].length; j++) {
                row.push(getTdHtml(mergedObjects[i][j]));
            }

            a.push(row);
        }

        return a;
    };

    getColTotalHtmlArray = function() {
        var a = [];

        if (rowAxis.type && doColTotals()) {
            var xTotalColObjects;

            // total col items
            for (var i = 0, total = 0, empty = []; i < valueObjects[0].length; i++) {
                for (var j = 0, obj; j < valueObjects.length; j++) {
                    obj = valueObjects[j][i];

                    total += obj.value;
                    empty.push(!!obj.empty);
                }

                // col total
                totalColObjects.push({
                    type: 'valueTotal',
                    value: total,
                    htmlValue: arrayContains(empty, false) ? getRoundedHtmlValue(total) : '',
                    empty: !arrayContains(empty, false),
                    cls: 'pivot-value-total'
                });

                total = 0;
                empty = [];
            }

            xTotalColObjects = totalColObjects;

            if (colAxis.type && doRowSubTotals()) {
                var tmp = [];

                for (var i = 0, item, subTotal = 0, empty = [], colCount = 0; i < xTotalColObjects.length; i++) {
                    item = xTotalColObjects[i];
                    tmp.push(item);
                    subTotal += item.value;
                    empty.push(!!item.empty);
                    colCount++;

                    if (colCount === colUniqueFactor) {
                        tmp.push({
                            type: 'valueTotalSubgrandtotal',
                            value: subTotal,
                            htmlValue: arrayContains(empty, false) ? getRoundedHtmlValue(subTotal) : '',
                            empty: !arrayContains(empty, false),
                            cls: 'pivot-value-total-subgrandtotal'
                        });

                        subTotal = 0;
                        colCount = 0;
                    }
                }

                xTotalColObjects = tmp;
            }

            // total col html items
            for (var i = 0; i < xTotalColObjects.length; i++) {
                a.push(getTdHtml(xTotalColObjects[i]));
            }
        }

        return a;
    };

    getGrandTotalHtmlArray = function() {
        var total = 0,
            empty = [],
            a = [];

        if (doRowTotals() && doColTotals()) {
            for (var i = 0, obj; i < totalColObjects.length; i++) {
                obj = totalColObjects[i];

                total += obj.value;
                empty.push(obj.empty);
            }

            if (colAxis.type && rowAxis.type) {
                a.push(getTdHtml({
                    type: 'valueGrandTotal',
                    cls: 'pivot-value-grandtotal',
                    value: total,
                    htmlValue: arrayContains(empty, false) ? getRoundedHtmlValue(total) : '',
                    empty: !arrayContains(empty, false)
                }));
            }
        }

        return a;
    };

    getTotalHtmlArray = function() {
        var dimTotalArray,
            colTotal = getColTotalHtmlArray(),
            grandTotal = getGrandTotalHtmlArray(),
            row,
            a = [];

        if (doColTotals()) {
            if (rowAxis.type) {
                dimTotalArray = [getTdHtml({
                    type: 'dimensionSubtotal',
                    cls: 'pivot-dim-total',
                    colSpan: rowAxis.dims,
                    htmlValue: 'Total'
                })];
            }

            row = [].concat(dimTotalArray || [], colTotal || [], grandTotal || []);

            a.push(row);
        }

        return a;
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

        var text = layout.filters.getRecordNames(false, layout.getResponse(), true);
        var row = [];

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

        var text = layout.title;
        var row = [];

        row.push(getTdHtml({
            type: 'filter',
            cls: 'pivot-filter cursor-default',
            colSpan: getTopBarSpan(span),
            title: text,
            htmlValue: text
        }));

        return [row];
    };

    getHtml = function() {
        var cls = 'pivot',
            table;

        cls += layout.displayDensity && layout.displayDensity !== optionConfig.getDisplayDensity('normal').id ? ' displaydensity-' + layout.displayDensity : '';
        cls += layout.fontSize && layout.fontSize !== optionConfig.getFontSize('normal').id ? ' fontsize-' + layout.fontSize : '';

        table = '<table class="' + cls + '">';

        for (var i = 0; i < htmlArray.length; i++) {
            table += '<tr>' + htmlArray[i].join('') + '</tr>';
        }

        return table += '</table>';
    };

    // get html
    (function() {
        var colAxisHtmlArray = getColAxisHtmlArray();
        var filterRowColSpan = (colAxisHtmlArray[0] || []).length;
        var rowDims = rowAxis.dims || 0;

        htmlArray = arrayClean([].concat(
            options.skipTitle ? [] : getTitle(filterRowColSpan) || [],
            getFilterHtmlArray(filterRowColSpan) || [],
            colAxisHtmlArray || [],
            getRowHtmlArray() || [],
            getTotalHtmlArray() || []
        ));
    }());

    // constructor
    t.html = getHtml(htmlArray);
    t.uuidDimUuidsMap = uuidDimUuidsMap;
    t.sortableIdObjects = sortableIdObjects;
    t.idValueMap = idValueMap;

    t.layout = layout;
    t.response = response;
    t.colAxis = colAxis;
    t.rowAxis = rowAxis;
    t.tdCount = tdCount;
};

Table.prototype.getUuidObjectMap = function() {
    return objectApplyIf((this.colAxis ? this.colAxis.uuidObjectMap || {} : {}), (this.rowAxis ? this.rowAxis.uuidObjectMap || {} : {}));
};
