import arrayFrom from 'd2-utilizr/lib/arrayFrom';
import arrayClean from 'd2-utilizr/lib/arrayClean';
import arrayInsert from 'd2-utilizr/lib/arrayInsert';
import objectApplyIf from 'd2-utilizr/lib/objectApplyIf';
import clone from 'd2-utilizr/lib/clone';
import isObject from 'd2-utilizr/lib/isObject';
import isString from 'd2-utilizr/lib/isString';
import {Record} from './Record.js';
import {ResponseHeader} from './ResponseHeader.js';
import {ResponseRow} from './ResponseRow.js';
import {ResponseRowIdCombination} from './ResponseRowIdCombination.js';

export var Response;

Response = function(config) {
    var t = this;
    t.klass = Response;

    config = isObject(config) ? config : {};

    // constructor
    t.headers = (config.headers || []).map(function(header) {
        return new t.klass.api.ResponseHeader(header);
    });

    t.metaData = config.metaData;

    t.rows = (config.rows || []).map(function(row) {
        return ResponseRow(row);
    });

    // transient
    t.nameHeaderMap = function() {
        var map = {};

        t.headers.forEach(function(header) {
            map[header.name] = header;
        });

        return map;
    }();

    // uninitialized
    t.idValueMap;

    // set index on Headers
    t.headers.forEach(function(header, index) {
        header.setIndex(index);
    });
};

Response.prototype.clone = function() {
    var t = this;

    return new t.klass.api.Response(t);
};

Response.prototype.getHeaderByName = function(name) {
    return this.nameHeaderMap[name];
};

Response.prototype.getHeaderIndexByName = function(name) {
    return this.nameHeaderMap[name].index;
};

Response.prototype.getOptionSetHeaders = function() {
    return t.headers.filter(header => isString(header.optionSet) || isArray(header.optionSet));
};

Response.prototype.getNameById = function(id) {
    return this.metaData.names[id] || '';
};

Response.prototype.getHierarchyNameById = function(id, isHierarchy, isHtml) {
    var metaData = this.metaData,
        name = '';

    if (isHierarchy && metaData.ouHierarchy.hasOwnProperty(id)) {
        var a = arrayClean(metaData.ouHierarchy[id].split('/'));
        a.shift();

        for (var i = 0; i < a.length; i++) {
            name += (isHtml ? '<span class="text-weak">' : '') + metaData.names[a[i]] + (isHtml ? '</span>' : '') + ' / ';
        }
    }

    return name;
};

Response.prototype.getIdsByDimensionName = function(dimensionName) {
    return this.metaData[dimensionName] || [];
};

Response.prototype.addOuHierarchyDimensions = function() {
    var t = this;

    var headers = t.headers,
        ouHierarchy = t.metaData.ouHierarchy,
        rows = t.rows,
        ouIndex,
        numLevels = 0,
        initArray = [],
        newHeaders = [],
        ou = 'ou',
        a;

    if (!ouHierarchy) {
        return;
    }

    // get ou index
    for (var i = 0, header; i < headers.length; i++) {
        if (headers[i].name === ou) {
            ouIndex = i;
            break;
        }
    }

    // get numLevels
    for (var i = 0; i < rows.length; i++) {
        numLevels = Math.max(numLevels, arrayClean(ouHierarchy[rows[i][ouIndex]].split('/')).length);
    }

    // init array
    for (var i = 0; i < numLevels; i++) {
        initArray.push('');
    }

    // extend rows
    for (var i = 0, row, ouArray; i < rows.length; i++) {
        row = rows[i];
        ouArray = objectApplyIf(arrayClean(ouHierarchy[row[ouIndex]].split('/')), clone(initArray));

        arrayInsert(row, ouIndex, ouArray);
    }

    // create new headers
    for (var i = 0; i < numLevels; i++) {
        newHeaders.push({
            column: 'Organisation unit',
            hidden: false,
            meta: true,
            name: 'ou',
            type: 'java.lang.String'
        });
    }

    arrayInsert(headers, ouIndex, newHeaders);

    return t;
};

Response.prototype.printResponseCSV = function() {
    var t = this;

    var headers = t.headers,
        names = t.metaData.names,
        rows = t.rows,
        csv = '',
        alink;

    // headers
    for (var i = 0; i < headers.length; i++) {
        csv += '"' + headers[i].column + '"' + (i < headers.length - 1 ? ',' : '\n');
    }

    // rows
    for (var i = 0; i < rows.length; i++) {
        for (var j = 0, val, isMeta; j < rows[i].length; j++) {
            val = rows[i][j];
            isMeta = headers[j].meta;

            csv += '"' + (isMeta && names[val] ? names[val] : val) + '"';
            csv += j < rows[i].length - 1 ? ',' : '\n';
        }
    }

    alink = document.createElement('a');
    alink.setAttribute('href', 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv));
    alink.setAttribute('download', 'data.csv');
    alink.click();
};

// dep 1

Response.prototype.getHeaderIndexOrder = function(dimensionNames) {
    var t = this,
        headerIndexOrder = [];

    dimensionNames.forEach(function(name) {
        headerIndexOrder.push(t.getHeaderIndexByName(name));
    });

    return headerIndexOrder;
};

Response.prototype.getIdsByDimensionNames = function(dimensionName) {
    var t = this,
        ids = [];

    dimensionName.forEach(function(name) {
        ids = ids.concat(t.getIdsByDimensionName(name) || []);
    });

    return arrayClean(ids);
};

Response.prototype.getItemName = function(id, isHierarchy, isHtml) {
    return this.getHierarchyNameById(id, isHierarchy) + this.getNameById(id);
};

Response.prototype.getRecordsByDimensionName = function(dimensionName) {
    var t = this;

    var metaData = this.metaData,
        ids = metaData[dimensionName],
        records = [];

    ids.forEach(function(id) {
        records.push((new t.klass.api.Record({
            id: id,
            name: metaData.names[id]
        })).val());
    });

    return records;
};

Response.prototype.getValueHeader = function() {
    return this.getHeaderByName('value');
};

// dep 2

Response.prototype.getValueHeaderIndex = function() {
    return this.getValueHeader().getIndex();
};

// dep 3

Response.prototype.getIdValueMap = function(layout) {
    if (this.idValueMap) {
        return this.idValueMap;
    }

    var t = this,
        headerIndexOrder = t.getHeaderIndexOrder(layout.getDimensionNames()),
        idValueMap = {},
        idCombination;

    this.rows.forEach(function(responseRow) {
        idCombination = new t.klass.api.ResponseRowIdCombination();

        headerIndexOrder.forEach(function(index) {
            idCombination.add(responseRow.getAt(index));
        });

        responseRow.setIdCombination(idCombination);

        idValueMap[idCombination.get()] = responseRow.getAt(t.getValueHeaderIndex());
    });

    return this.idValueMap = idValueMap;
};

// dep 4

Response.prototype.getValue = function(param, layout) {
    var id = param instanceof ResponseRowIdCombination ? param.get() : param;

    return this.getIdValueMap(layout)[id];
};

// dep 5

Response.prototype.getValues = function(paramArray, layout) {
    var t = this,
        values = [],
        id;

    paramArray = arrayFrom(paramArray);

    paramArray.forEach(function(param) {
        values.push(t.getValue(param, layout));
    });

    return values;
};
