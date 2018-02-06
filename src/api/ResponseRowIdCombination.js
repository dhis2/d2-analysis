import arrayContains from 'd2-utilizr/lib/arrayContains';
import arrayFrom from 'd2-utilizr/lib/arrayFrom';
import isArray from 'd2-utilizr/lib/isArray';
import isString from 'd2-utilizr/lib/isString';

export var ResponseRowIdCombination;

ResponseRowIdCombination = function(refs, config) {
    var t = this;

    config = isArray(config) ? config : (isString(config) ? config : null);

    // constructor
    t.ids = config || '';
};

ResponseRowIdCombination.prototype.add = function(id) {
    if (id) {
        this.ids += '-' + id
    }
};

ResponseRowIdCombination.prototype.get = function() {
    return this.ids;
};

ResponseRowIdCombination.prototype.getNames = function(response, ignoreIndexes) {
    var ids = this.ids.split('-');

    if (isArray(ignoreIndexes)) {
        ids = ids.filter(((id, index) => !arrayContains(ignoreIndexes, index)));
    }

    return ids.map(id => response.getNameById(id));
};

ResponseRowIdCombination.prototype.getIdByIds = function(ids) {
    return this.ids.split('-').filter(id => arrayContains(arrayFrom(ids), id))[0];
};