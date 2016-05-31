import isString from 'd2-utilizr/lib/isString';
import isObject from 'd2-utilizr/lib/isObject';
import arrayFrom from 'd2-utilizr/lib/arrayFrom';
import arrayContains from 'd2-utilizr/lib/arrayContains';
import arrayPluck from 'd2-utilizr/lib/arrayPluck';
import arrayUnique from 'd2-utilizr/lib/arrayUnique';

import {Record} from './Record.js';

export var Dimension;

Dimension = function(config) {
    var t = this;

    t.klass = Dimension;

    config = isObject(config) ? config : {};
    config.items = arrayFrom(config.items);

    // constructor
    t.dimension = config.dimension;

    t.items = config.items.map(function(record) {
        return (new Record(record)).val();
    });

    if (config.sorted) {
        t.sorted = config.sorted;
    }
};

Dimension.prototype.log = function(text, noError) {
    if (!noError) {
        console.log(text, this);
    }
};

Dimension.prototype.val = function(noError) {

    // error
    if (!isString(this.dimension)) {
        this.log('(Dimension) Dimension is not a string', noError);
        return null;
    }

    // warning
    if (!this.items.length && this.dimension !== 'co') {
        this.log('(Dimension) No items', noError);
        //return null;
    }

    return this;
};

Dimension.prototype.add = function(recordConfig) {
    var record = (new Record(recordConfig)).val();

    if (record) {
        this.items.push(record);
    }
};

Dimension.prototype.getRecords = function(sortProperty, response) {
    var records = response ? response.getRecordsByDimensionName(this.dimension) : this.items;

    sortProperty = arrayContains(['id', 'name'], sortProperty) ? sortProperty : null;

    return sortProperty ? records.sort(function(a, b) { return a[sortProperty] > b[sortProperty];}) : records;
};

Dimension.prototype.removeItems = function() {
    this.items = [];
};

// dep 1

Dimension.prototype.getRecordIds = function(isSorted, response) {
    var rec = this.getRecords((isSorted ? 'id' : null), response);

    return arrayPluck(rec, 'id');
};

Dimension.prototype.getRecordNames = function(isSorted, response) {
    return arrayPluck(this.getRecords((isSorted ? 'name' : null), response), 'name');
};

Dimension.prototype.toPlugin = function() {
    delete this.klass;

    this.items.forEach(function(record) {
        record.toPlugin();
    });
};

Dimension.prototype.toPost = function() {
    delete this.klass;

    this.items.forEach(function(record) {
        record.toPost();
    });
};

// dep 2

Dimension.prototype.url = function(isSorted, response, isFilter) {
    var url = (isFilter ? 'filter' : 'dimension') + '=' + this.dimension,
        records = arrayUnique(this.getRecordIds(false, response));

    url += records.length ? (':' + records.join(';')) : '';

    return url;
};
