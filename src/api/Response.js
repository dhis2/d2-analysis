import isObject from 'd2-utilizr/lib/isObject';
import arrayFrom from 'd2-utilizr/lib/arrayFrom';
import arrayClean from 'd2-utilizr/lib/arrayClean';
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
        return new ResponseHeader(header);
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

    // ResponseHeader: index
    t.headers.forEach(function(header, index) {
        header.setIndex(index);
    });
};

Response.prototype.getHeaderByName = function(name) {
    return this.nameHeaderMap[name];
};

Response.prototype.getHeaderIndexByName = function(name) {
    return this.nameHeaderMap[name].index;
};

Response.prototype.getNameById = function(id) {
    return this.metaData.names[id] || '';
};

Response.prototype.getHierarchyNameById = function(id, isHierarchy, isHtml) {
    var metaData = this.metaData,
        name = '';

    if (isHierarchy) {
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

// dep 1

Response.prototype.getHeaderIndexOrder = function(dimensionNames) {
    var t = this,
        headerIndexOrder = [];

    dimensionNames.forEach(function(name) {
        headerIndexOrder.push(t.getHeaderIndexByName(name));
    });

    return headerIndexOrder;
};

Response.prototype.getItemName = function(id, isHierarchy, isHtml) {
    return this.getHierarchyNameById(id, isHierarchy) + this.getNameById(id);
};

Response.prototype.getRecordsByDimensionName = function(dimensionName) {
    var metaData = this.metaData,
        ids = metaData[dimensionName],
        records = [];

    ids.forEach(function(id) {
        records.push((new Record({
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
        idCombination = new ResponseRowIdCombination();

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