import {isObject, arrayFrom, arrayContains, arrayPluck, arrayUnique} from 'd2-utilizr';
import {Record} from './Record.js';

export var Dimension;

Dimension = function(config) {
    var t = this,
        items = [];

    config = isObject(config) ? config : {};
    config.items = arrayFrom(config.items);

    // constructor
    t.dimension = config.dimension;

    t.items = config.items.map(function(record) {
        return (new Record(record)).val();
    });
};

Dimension.prototype.log = function(text, noError) {
    if (!noError) {
        console.log(text, this);
    }
};

Dimension.prototype.val = function(noError) {
    if (!isString(this.dimension)) {
        this.log('(Dimension) Dimension is not a string', noError);
        return null;
    }

    if (!this.items.length && this.dimension !== 'co') {
        this.log('(Dimension) No items', noError);
        return null;
    }

    return this;
};

Dimension.prototype.getRecords = function(sortProperty, response) {
    var records = response ? response.getRecordsByDimensionName(this.dimension) : this.items;

    sortProperty = arrayContains(['id', 'name'], sortProperty) ? sortProperty : null;

    return sortProperty ? records.sort(function(a, b) { return a[sortProperty] > b[sortProperty];}) : records;
};

// dep 1

Dimension.prototype.getRecordIds = function(isSorted, response) {
    return arrayPluck(this.getRecords((isSorted ? 'id' : null), response), 'id');
};

Dimension.prototype.getRecordNames = function(isSorted, response) {
    return arrayPluck(this.getRecords((isSorted ? 'name' : null), response), 'name');
};

// dep 2

Dimension.prototype.url = function(isSorted, response) {
    return 'dimension=' + this.dimension + ':' + arrayUnique(this.getRecordIds(false, response)).join(';');
};
