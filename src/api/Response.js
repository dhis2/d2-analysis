import arrayClean from 'd2-utilizr/lib/arrayClean';
import arrayContains from 'd2-utilizr/lib/arrayContains';
import arrayFrom from 'd2-utilizr/lib/arrayFrom';
import arrayInsert from 'd2-utilizr/lib/arrayInsert';
import arraySort from 'd2-utilizr/lib/arraySort';
import arrayUnique from 'd2-utilizr/lib/arrayUnique';
import objectApplyIf from 'd2-utilizr/lib/objectApplyIf';
import clone from 'd2-utilizr/lib/clone';
import isBoolean from 'd2-utilizr/lib/isBoolean';
import isDefined from 'd2-utilizr/lib/isDefined';
import isEmpty from 'd2-utilizr/lib/isEmpty';
import isNumber from 'd2-utilizr/lib/isNumber';
import isNumeric from 'd2-utilizr/lib/isNumeric';
import isObject from 'd2-utilizr/lib/isObject';
import isString from 'd2-utilizr/lib/isString';

import getParseMiddleware from '../util/getParseMiddleware';

export var Response;

Response = function(refs, config) {
    var t = this;

    config = isObject(config) ? config : {};

    var { appManager, indexedDbManager, i18nManager } = refs;

    var { ResponseHeader, ResponseRow } = refs.api;

    var i18n = i18nManager.get();

    var booleanMap = {
        '0': i18n.no || 'No',
        '1': i18n.yes || 'Yes'
    };

    var OUNAME = 'ouname';
    var OU = 'ou';

    var DEFAULT_COLLECT_IGNORE_HEADERS = [
        'psi',
        'ps',
        'eventdate',
        'longitude',
        'latitude',
        'ouname',
        'oucode',
        'eventdate',
        'eventdate'
    ];

                                //DIMENSIONS      ITEMS    -> COLLECT         PREFIX

//- required                        V               V           no             no

//- legendSet                       V               V           no             no
//- !dimensions                     x               x           yes            yes

//- optionset, !dimensions          x               x           yes            yes
//- optionset                       V               x           no             yes

    // functions
    var isPrefixHeader = (header, dimensions) => {
        if (arrayContains(DEFAULT_COLLECT_IGNORE_HEADERS, header.name)) {
            return false;
        }

        return ('optionSet' in header) || isEmpty(dimensions);
    };

    var isCollectHeader = (header, dimensions) => {
        if (arrayContains(DEFAULT_COLLECT_IGNORE_HEADERS, header.name)) {
            return false;
        }

        return isEmpty(dimensions);
    };

    var getHeader = (name) => {
        return t.headers.find(header => header.name === name);
    };

    var hasHeader = (name) => {
        return getHeader(name) !== undefined;
    };

    t.getPrefixedId = (id, prefix) => (prefix || '') + '_' + id;

    t.getSortedUniqueRowIdStringsByHeader = (header) => {
        var parseByType = getParseMiddleware(header.valueType);
        var parseString = getParseMiddleware('STRING');

        return arraySort(arrayClean(arrayUnique(t.rows.map(responseRow => parseByType(responseRow.getAt(header.index)))))).map(id => parseString(id));
    };

    t.getNameByIdsByValueType = (id, valueType) => {
        if (valueType === 'BOOLEAN') {
            return booleanMap[id];
        }

        return id;
    };

    // headers
    t.headers = (config.headers || []).map((header, index) => {
        var dimensions = config.metaData.dimensions;

        var prefixConfig = isPrefixHeader(header, dimensions[header.name]) ? { isPrefix: true } : {};
        var collectConfig = isCollectHeader(header, dimensions[header.name]) ? { isCollect: true } : {};

        return new ResponseHeader(refs, header, Object.assign({}, prefixConfig, collectConfig, { index }));
    });

    // rows
    t.rows = (config.rows || []).map(row => ResponseRow(refs, row));

    t.metaData = function() {
        var metaData = Object.assign({}, config.metaData);

        var dimensions = metaData.dimensions,
            items = metaData.items;

        // populate metaData dimensions and items
        t.headers.filter(header => !arrayContains(DEFAULT_COLLECT_IGNORE_HEADERS, header.name)).forEach(header => {
            var ids;

            // collect row values
            if (header.isCollect) {
                ids = t.getSortedUniqueRowIdStringsByHeader(header);
                dimensions[header.name] = ids;
            }
            else {
                ids = dimensions[header.name];
            }

            if (header.isPrefix) {

                // create prefixed dimensions array
                dimensions[header.name] = ids.map(id => t.getPrefixedId(id, header.name));

                // create items
                if (header.optionSet) {
                    dimensions[header.name].forEach((prefixedId, index) => {
                        var id = ids[index];
                        var optionSet = header.optionSet;

                        var name = indexedDbManager.getCachedOptionName(ids[index], header.optionSet);

                        items[prefixedId] = { name: name };
                    });
                }
                else {
                    dimensions[header.name].forEach((prefixedId, index) => {
                        var id = ids[index];
                        var valueType = header.valueType;

                        var name = t.getNameByIdsByValueType(id, valueType);

                        items[prefixedId] = { name: name };
                    });
                }
            }
        });

        // for events, add items from 'ouname'
        if (hasHeader(OUNAME) && hasHeader(OU)) {
            var ounameHeaderIndex = getHeader(OUNAME).getIndex();
            var ouHeaderIndex = getHeader(OU).getIndex();

            for (let i = 0, row, ouId, ouName, item; i < t.rows.length; i++) {
                row = t.rows[i];
                ouId = row.getAt(ouHeaderIndex);

                if (items[ouId] !== undefined) {
                    continue;
                }

                ouName = row.getAt(ounameHeaderIndex);

                items[ouId] = {
                    name: ouName
                };
            }
        }

        return metaData;
    }();

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

    t.getRefs = function() {
        return refs;
    };
};

Response.prototype.sortOrganisationUnitsHierarchy = function() {
    let organisationUnits = this.metaData.dimensions.ou;

    for (let i = 0; i < organisationUnits.length; ++i) {
        let organisationUnit = organisationUnits[i],
            hierarchyPrefix = this.metaData.ouHierarchy[organisationUnit],
            hierarchyIds = [organisationUnit],
            hierarchyNames = [];

        hierarchyPrefix.split('/').reverse().forEach(ouId => {
            hierarchyIds.unshift(ouId);
        });

        hierarchyIds.map(ouId => {
            hierarchyNames.push(this.metaData.items[ouId].name);
        });

        organisationUnits[i] = {
            id: organisationUnit,
            fullName: hierarchyNames.join(' / ')
        };
    }

    arraySort(organisationUnits, null, 'fullName');

    this.metaData.dimensions.ou = organisationUnits.map(ou => {
        return ou.id;
    });
};

Response.prototype.clone = function() {
    var t = this,
        refs = t.getRefs();

    var { Response } = refs.api;

    return new Response(refs, t);
};

Response.prototype.getHeaderByName = function(name) {
    return this.nameHeaderMap[name];
};

Response.prototype.getHeaderByIndex = function(index) {
    return this.headers[index];
};

Response.prototype.getHeaderIndexByName = function(name) {
    var header = this.nameHeaderMap[name] || {};

    return header.index;
};

Response.prototype.getOptionSetHeaders = function() {
    return t.headers.filter(header => isString(header.optionSet) || isArray(header.optionSet));
};

Response.prototype.getNameById = function(id) {
    return (this.metaData.items[id] || {}).name || id;
};

Response.prototype.getHierarchyNameById = function(id, isHierarchy, isHtml) {
    var metaData = this.metaData,
        name = '';

    var items = metaData.items;

    if (isHierarchy && metaData.ouHierarchy.hasOwnProperty(id)) {
        var a = arrayClean(metaData.ouHierarchy[id].split('/'));

        a.forEach(function(id) {
            name += (isHtml ? '<span class="text-weak">' : '') + items[id].name + (isHtml ? '</span>' : '') + ' / ';
        });
    }

    return name;
};

Response.prototype.getIdsByDimensionName = function(dimensionName) {
    return this.metaData.dimensions ? this.metaData.dimensions[dimensionName] || [] : [];
};

Response.prototype.addMetaDataItems = function(items) {
    this.metaData.items = Object.assign(this.metaData.items, items)
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

Response.prototype.getFilteredHeaders = function(names) {
    return this.headers.filter(header => arrayContains(names, header.name));
};

Response.prototype.getOrganisationUnitsIds = function() {
    return this.metaData.dimensions.ou;
};

// dep 1

Response.prototype.getHeaderNameByIndex = function(index) {
    this.getHeaderByIndex(index).name;
};

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
    var t = this,
        refs = t.getRefs();

    var { Record } = refs.api;

    var metaData = this.metaData,
        ids = this.getIdsByDimensionName(dimensionName) || [],
        records = [];

    ids.forEach(function(id) {
        records.push((new Record(refs, {
            id: id,
            name: t.getNameById(id)
        })).val());
    });

    return arrayClean(records);
};

Response.prototype.getValueHeader = function() {
    return this.getHeaderByName('value');
};

// dep 2

Response.prototype.getValueHeaderIndex = function() {
    return this.getValueHeader() ? this.getValueHeader().getIndex() : null;
};

// dep 3

Response.prototype.getIdValueMap = function(layout) {
    if (this.idValueMap) {
        return this.idValueMap;
    }

    var t = this,
        refs = t.getRefs();

    var { ResponseRowIdCombination } = refs.api;

    var headerIndexOrder = arrayClean(t.getHeaderIndexOrder(layout.getDimensionNames())),
        idValueMap = {},
        idCombination;

    var dimensions = t.metaData.dimensions;

    this.rows.forEach(function(responseRow) {
        idCombination = new ResponseRowIdCombination(refs);

        headerIndexOrder.forEach(function(index) {
            var header = t.getHeaderByIndex(index);
            var rowValue = responseRow.getAt(index);

            var key = header.isPrefix ? t.getPrefixedId(rowValue, header.name) : rowValue;

            idCombination.add(key);
        });

        responseRow.setIdCombination(idCombination);

        idValueMap[idCombination.get()] = responseRow.getAt(t.getValueHeaderIndex());
    });

    return this.idValueMap = idValueMap;
};

Response.prototype.getTotal = function() {
    var valueHeaderIndex = this.getValueHeaderIndex();

    if (!isNumber(valueHeaderIndex)) {
        return;
    }

    return this.rows.reduce((total, row) => total + parseFloat(row[valueHeaderIndex]), 0);
};

Response.prototype.getExtremalRows = function(limit, isTop, isBottom) {
    limit = isNumeric(limit) ? parseInt(limit) : 10;
    isTop = isBoolean(isTop) ? isTop : true;
    isBottom = isBoolean(isBottom) ? isBottom : true;

    var valueHeaderIndex = this.getValueHeaderIndex();

    var filteredRows = this.rows.filter(row => isNumeric(row[valueHeaderIndex]));

    filteredRows.forEach(row => row.toFloat(valueHeaderIndex));

    arraySort(filteredRows, 'DESC', valueHeaderIndex);

    var len = filteredRows.length;

    var limitedRows = [
        ...(isTop ? filteredRows.slice(0, limit) : []),
        ...(isBottom ? filteredRows.slice(len - limit, len) : [])
    ];

    return limitedRows;
};

// dep 4

Response.prototype.getValue = function(param, layout) {
    var t = this,
        refs = t.getRefs();

    var { ResponseRowIdCombination } = refs.api;

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
