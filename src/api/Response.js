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

export const Response = function(refs, config) {
    var t = this;

    config = isObject(config) ? config : {};

    var { appManager, indexedDbManager, i18nManager } = refs;

    var { ResponseHeader, ResponseRow } = refs.api;

    var i18n = i18nManager.get();

    const EMPTY_UID = 'EMPTY_UID';

    var booleanMap = {
        EMPTY_UID: 'N/A',
        '0': i18n.no || 'No',
        '1': i18n.yes || 'Yes'
    };

    const OUNAME = 'ouname',
          OU = 'ou';


    const DEFAULT_COLLECT_IGNORE_HEADERS = [
        'psi',
        'ps',
        'eventdate',
        'longitude',
        'latitude',
        'ouname',
        'oucode',
        'eventdate',
        'eventdate',
        'value',
        'numerator',
        'denominator',
        'factor',
        'multiplier',
        'divisor',
    ];

    const DEFAULT_PREFIX_IGNORE_HEADERS = [
        'dy',
        ...DEFAULT_COLLECT_IGNORE_HEADERS
    ];

                                //DIMENSIONS      ITEMS    -> COLLECT         PREFIX

//- required                        V               V           no             no

//- legendSet                       V               V           no             no
//- !dimensions                     x               x           yes            yes

//- optionset, !dimensions          x               x           yes            yes
//- optionset                       V               x           no             yes

    // functions
    var isPrefixHeader = (header, dimensions) => {
        if (arrayContains(DEFAULT_PREFIX_IGNORE_HEADERS, header.name)) {
            return false;
        }

        return isEmpty(dimensions);
    };

    var isCollectHeader = (header, dimensions) => {
        if (arrayContains(DEFAULT_COLLECT_IGNORE_HEADERS, header.name)) {
            return false;
        }

        return isEmpty(dimensions);
    };

    var getHeader = name => t.headers.find(header => header.name === name);
    var hasHeader = name => getHeader(name) !== undefined;

    t.getPrefixedId = (id, prefix) => (prefix || '') + '_' + id;

    t.getSortedUniqueRowIdStringsByHeader = (header) => {
        var parseByType = getParseMiddleware(header.valueType);
        const ids = arrayClean(arrayUnique(t.rows.map(responseRow => responseRow.getAt(header.index))));
        let pa, pb;

        return ids.sort((a, b) => {
            pa = parseByType(a);
            pb = parseByType(b);

            return pa > pb ? 1 : pa < pb ? -1 : 0;
        });
    };

    t.getNameByIdsByValueType = (id, valueType) => {
        if (valueType === 'BOOLEAN') {
            return booleanMap[id];
        }

        return id;
    };

    t.optionCodeIdMap = function() {
        var dimensions = config.metaData.dimensions;
        var items = config.metaData.items;
        var map = {};

        config.headers.filter(header => isString(header.optionSet)).forEach(header => {
            var optionIds = dimensions[header.name];

            var mapByDimension = optionIds.map(id => ({
                [items[id].code]: id,
            })).reduce((map, obj) => Object.assign(map, obj), {});

            // add uid for empty values
            mapByDimension[''] = t.getPrefixedId(EMPTY_UID, header.name);

            map[header.name] = mapByDimension;
        });

        return map;
    }();

    // headers
    t.headers = (config.headers || []).map((header, index) => {
        var dimensions = config.metaData.dimensions;

        var prefixConfig = isPrefixHeader(header, dimensions[header.name]) ? { isPrefix: true } : {};
        var collectConfig = isCollectHeader(header, dimensions[header.name]) ? { isCollect: true } : {};

        return new ResponseHeader(refs, header, Object.assign({}, prefixConfig, collectConfig, { index }));
    });

    // rows
    t.rows = function() {
        var headersWithOptionSet = t.headers.filter(header => header.optionSet);
        var headersWithBoolean = t.headers.filter(header => header.valueType === 'BOOLEAN');
        var rows = config.rows;

        if (headersWithOptionSet.length) {
            rows = rows.slice();

            // replace option code with option uid
            headersWithOptionSet.forEach(header => {
                const headerEmptyUid = t.getPrefixedId(EMPTY_UID, header.name);
                let hasEmptyValues = false;

                rows.forEach(row => {
					var optionId = t.optionCodeIdMap[header.name][row[header.index]];

					if (optionId) {
                        row[header.index] = optionId;

                        // set whether header has empty values
                        if (hasEmptyValues === false && optionId === headerEmptyUid) {
                            hasEmptyValues = true;
                        }
					}
                });

                header.hasEmptyValues = hasEmptyValues;
            });
        }

        if (headersWithBoolean.length) {
            rows = rows.slice();

            // replace empty value with empty uid
            headersWithBoolean.forEach(header => {
                let hasEmptyValues = false;

                rows.forEach(row => {
                    if (row[header.index] === '') {
                        row[header.index] = EMPTY_UID;

                        hasEmptyValues = true;
                    }
                });

                header.hasEmptyValues = hasEmptyValues;
            });
        }

        // map to ResponseRow
        return rows.map(row => ResponseRow(refs, row));
    }();

    // metadata
    t.metaData = function() {
        var metaData = Object.assign({}, config.metaData);

        var dimensions = metaData.dimensions,
            items = metaData.items;

        // populate metaData dimensions and items
        t.headers.filter(header => !arrayContains(DEFAULT_COLLECT_IGNORE_HEADERS, header.name)).forEach(header => {
            var ids;

            // if header has empty values, add to "dimensions" and "items"
            if (header.hasEmptyValues) {
                let itemEmptyUid = t.getPrefixedId(EMPTY_UID, header.name);

                dimensions[header.name].push(itemEmptyUid);

                items[itemEmptyUid] = {
                    code: '',
                    name: 'N/A',
                };
            }

            // collect row values
            if (header.isCollect) {
                dimensions[header.name] = t.getSortedUniqueRowIdStringsByHeader(header);
            }

            ids = dimensions[header.name];

            if (header.isPrefix) {

                // create prefixed dimensions array
                dimensions[header.name] = ids.map(id => t.getPrefixedId(id, header.name));

                // create items
                if (header.optionSet) {
                    dimensions[header.name].forEach((prefixedId, index) => {
                        var id = ids[index];
                        var optionSet = header.optionSet;

                        var name = indexedDbManager.getCachedOptionName(id, optionSet);

                        items[prefixedId] = { name: metaData.items[name] ? metaData.items[name].name : name };
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
    t.sortedRows;

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
            if (this.metaData.items[ouId]) {
                hierarchyNames.push(this.metaData.items[ouId].name);
            }
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
    const refs = this.getRefs();

    var { Response } = refs.api;

    return new Response(refs, this);
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
        items = t.metaData.items,
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

            csv += '"' + (isMeta && items[val] && isString(items[val].name) ? items[val].name : val) + '"';
            csv += j < rows[i].length - 1 ? ',' : '\n';
        }
    }

    alink = document.createElement('a');
    alink.setAttribute('href', 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv));
    alink.setAttribute('download', 'data.csv');
    alink.click();
};

Response.prototype.getSize = function(layout) {

    let size = 1;

    if (layout.columns) {
        for (let i = 0, dim, dimName, dimSize; i < layout.columns.length; i++) {
            dimName = layout.columns[i].dimension;
            dim = this.metaData.dimensions[dimName]
            if (dim) {
                dimSize = dim.length;
            }

            size *= dimSize === 0 ? 1 : dimSize;
        }
    }

    if (layout.rows) {
        for (let i = 0, dim, dimName, dimSize; i < layout.rows.length; i++) {
            dimName = layout.rows[i].dimension;
            dim = this.metaData.dimensions[dimName]
            if (dim) {
                dimSize = dim.length;
            }

            size *= dimSize === 0 ? 1 : dimSize;
        }
    }

    return size;
}

Response.prototype.getFilteredHeaders = function(names) {
    return this.headers.filter(header => arrayContains(names, header.name));
};

Response.prototype.getDxIds = function() {
    return this.metaData.dimensions.dx;
};

Response.prototype.getOrganisationUnitsIds = function() {
    return this.metaData.dimensions.ou;
};

// dep 1
Response.prototype.getHeaderNameByIndex = function(index) {
    return this.getHeaderByIndex(index).name;
};

Response.prototype.getHeaderIndexOrder = function(dimensionNames) {
    return dimensionNames.map(name => this.getHeaderIndexByName(name));
};

Response.prototype.getIdsByDimensionNames = function(dimensionName) {
    return arrayClean(dimensionName.reduce((ids, name) => 
        ids.concat(this.getIdsByDimensionName(name) || []), []));
};

Response.prototype.getItemName = function(id, isHierarchy, isHtml) {
    return this.getHierarchyNameById(id, isHierarchy) + this.getNameById(id);
};

Response.prototype.getTotalAggregationType = function(id) {
    return (this.metaData.items[id] || {}).totalAggregationType;
};

Response.prototype.getValueType = function(id) {
    return (this.metaData.items[id] || {}).valueType;
};

Response.prototype.getRecordsByDimensionName = function(dimensionName) {
    var refs = this.getRefs(),
        { Record } = refs.api;

    var ids = this.getIdsByDimensionName(dimensionName) || [],
        records = ids.map(id => (new Record(refs, { id: id, name: this.getNameById(id) })).val());

    return arrayClean(records);
};

Response.prototype.getValueHeader = function() {
    return this.getHeaderByName('value');
};

Response.prototype.getNumeratorHeader = function() {
    return this.getHeaderByName('numerator');
}

Response.prototype.getDenominatorHeader = function() {
    return this.getHeaderByName('denominator');
}

Response.prototype.getFactorHeader = function() {
    return this.getHeaderByName('factor');
}

Response.prototype.getMultiplierHeader = function() {
    return this.getHeaderByName('multiplier');
}

Response.prototype.getDivisorHeader = function() {
    return this.getHeaderByName('divisor');
}

Response.prototype.hasIdByDimensionName = function(id, dimensionName) {
    return arrayContains(this.getIdsByDimensionName(dimensionName), id);
};

Response.prototype.getTotalAggregationTypes = function() {
    return [...new Set((this.getDxIds() || [])
        .map(id => this.getTotalAggregationType(id))
        .filter(aggType => typeof aggType === 'string'))
    ];
};

// dep 2
Response.prototype.getValueHeaderIndex = function() {
    return this.getValueHeader() ? this.getValueHeader().getIndex() : null;
};

Response.prototype.getNumeratorHeaderIndex = function() {
    return this.getNumeratorHeader() ? this.getNumeratorHeader().getIndex() : null;
};

Response.prototype.getDenominatorHeaderIndex = function() {
    return this.getDenominatorHeader() ? this.getDenominatorHeader().getIndex() : null;
};

Response.prototype.getFactorHeaderIndex = function() {
    return this.getFactorHeader() ? this.getFactorHeader().getIndex() : null;
};

// dep 3
Response.prototype.getSortedRows = function() {
    if (this.sortedRows) {
        return this.sortedRows;
    }

    var valueHeaderIndex = this.getValueHeaderIndex();

    // filter
    var rows = this.rows.filter(row => isNumeric(row[valueHeaderIndex]));

    // parse
    rows.forEach(row => row.toFloat(valueHeaderIndex));

    // sort
    arraySort(rows, 'DESC', valueHeaderIndex);

    return this.sortedRows = rows;
};

Response.prototype.getIdValueMap = function(layout) {
    return this.idValueMap = this.getIdMap(layout, 'value');
};

Response.prototype.getIdDenominatorMap = function(layout) {
    return this.idDenominatorMap = this.getIdMap(layout, 'denominator');
};

Response.prototype.getIdNumeratorMap = function(layout) {
    return this.idNumeratorMap = this.getIdMap(layout, 'numerator');
};

Response.prototype.getIdFactorMap = function(layout) {
    return this.idFactorMap = this.getIdMap(layout, 'factor');
};

Response.prototype.getIdMap = function(layout, name) {

    const refs = this.getRefs(),
          { ResponseRowIdCombination } = refs.api,
          headerIndexOrder = arrayClean(this.getHeaderIndexOrder(layout.getDimensionNames())),
          idMap = {};

    this.rows.forEach(responseRow => {
        let idCombination = new ResponseRowIdCombination(refs),
            key,
            rowValue,
            header;

        headerIndexOrder.forEach(index => {
            header = this.getHeaderByIndex(index);
            rowValue = responseRow.getAt(index);
            key = header.isPrefix ? this.getPrefixedId(rowValue, header.name) : rowValue;

            idCombination.add(key);
        });

        responseRow.setIdCombination(idCombination);
        idMap[idCombination.get()] = responseRow.getAt(this.getHeaderByName(name).getIndex());
    });

    return idMap;
}

Response.prototype.getAllIdMap = function(layout) {

    const refs = this.getRefs(),
          { ResponseRowIdCombination } = refs.api,
          headerIndexOrder = arrayClean(this.getHeaderIndexOrder(layout.getDimensionNames())),
          idMap = {};

    this.rows.forEach(responseRow => {
        let idCombination = new ResponseRowIdCombination(refs),
            key,
            rowValue,
            header;

        headerIndexOrder.forEach(index => {
            header = this.getHeaderByIndex(index);
            rowValue = responseRow.getAt(index);
            key = header.isPrefix ? this.getPrefixedId(rowValue, header.name) : rowValue;

            idCombination.add(key);
        });

        responseRow.setIdCombination(idCombination);
        idMap[idCombination.get()] = {
            'value': responseRow.getAt(this.getHeaderByName('value').getIndex()),
            'denominator': responseRow.getAt(this.getHeaderByName('denominator').getIndex()),
            'numerator': responseRow.getAt(this.getHeaderByName('numerator').getIndex()),
            'factor': responseRow.getAt(this.getHeaderByName('factor').getIndex()),
        };
    });

    return idMap;
}

// dep 4
Response.prototype.getValue = function(param, layout) {
    const {refs: { api: ResponseRowIdCombination } } = this.getRefs(),
          id = param instanceof ResponseRowIdCombination ? param.get() : param;

    return this.getIdValueMap(layout)[id];
};

Response.prototype.getExtremalRows = function(limit, isTop, isBottom) {
    limit = isNumeric(limit) ? parseInt(limit) : 10;
    isTop = isBoolean(isTop) ? isTop : true;
    isBottom = isBoolean(isBottom) ? isBottom : true;

    var sortedRows = this.getSortedRows(),
        len = sortedRows.length;

    return [
        ...(isTop ? sortedRows.slice(0, limit) : []),
        ...(isBottom ? sortedRows.slice(len - limit, len) : [])
    ];
};

// dep 5
Response.prototype.getValues = function(paramArray, layout) {
    return arrayFrom(paramArray).map(param => this.getValue(param, layout));
};
